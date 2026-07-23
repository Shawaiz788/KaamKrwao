import React, { useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import {
  StyleSheet,
  Text,
  KeyboardAvoidingView,
  Platform,
  View,
  ScrollView,
  Pressable,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { getAuth, signInWithPhoneNumber, signOut } from '@react-native-firebase/auth';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { checkPhoneExists } from '@/services/user';
import AuthHeader from '@/components/auth/AuthHeader';
import PhoneInputField from '@/components/auth/PhoneInputField';
import PasswordInputField from '@/components/auth/PasswordInputField';

const signUpSchema = z
  .object({
    phone: z
      .string({ message: 'Phone number is required' })
      .regex(/^[0-9]{10}$/, 'Phone number must be exactly 10 digits (e.g. 3001234567)'),
    password: z
      .string({ message: 'Password is required' })
      .min(6, 'Password must be at least 6 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-zA-Z]/, 'Password must contain at least one alphabet letter')
      .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: z.string({ message: 'Confirm password is required' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords must match',
    path: ['confirmPassword'],
  });

type SignUpFields = z.infer<typeof signUpSchema>;

export default function SignUpScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [loadingStep, setLoadingStep] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setError,
    watch,
    formState: { errors },
  } = useForm<SignUpFields>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      phone: '',
      password: '',
      confirmPassword: '',
    },
  });

  const watchPassword = watch('password');

  const onSignUp = async (data: SignUpFields) => {
    try {
      setLoadingStep('Checking phone availability...');
      const formattedPhone = `+92${data.phone}`;

      const phoneExists = await checkPhoneExists(formattedPhone);
      if (phoneExists) {
        setError('phone', { message: 'Phone number already registered. Please sign in.' });
        setLoadingStep(null);
        return;
      }

      setLoadingStep('Sending SMS OTP...');
      const auth = getAuth();

      if (auth.currentUser) {
        await signOut(auth);
      }

      const confirmation = await signInWithPhoneNumber(auth, formattedPhone);
      await SecureStore.setItemAsync('pending_signup_password', data.password);

      setLoadingStep('Proceeding...');
      router.push({
        pathname: '/verify',
        params: {
          phoneNumber: formattedPhone,
          verificationId: confirmation.verificationId,
          password: data.password,
          flowType: 'sign-up',
        },
      });
    } catch (err: any) {
      console.log('Sign up error: ', err);
      const rawMsg = err?.message || '';
      if (err.code === 'auth/invalid-phone-number') {
        setError('phone', { message: 'Invalid phone number format' });
      } else if (
        rawMsg.includes('Status: 5') ||
        rawMsg.includes('500') ||
        rawMsg.includes('504') ||
        rawMsg.includes('502') ||
        rawMsg.includes('5xx') ||
        rawMsg.includes('temporarily busy')
      ) {
        setError('root', { message: 'Server is temporarily busy. Please try again in a few moments.' });
      } else {
        setError('root', { message: rawMsg || 'An error occurred sending OTP' });
      }
    } finally {
      setLoadingStep(null);
    }
  };

  const isLoading = Boolean(loadingStep);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B5A3E" />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardAvoid}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <AuthHeader topInset={insets.top} title="Sign Up" subtitle="Create an account to get started" />

          <View style={styles.formContainer}>
            <View style={styles.form}>
              <PhoneInputField control={control} name="phone" autoFocus />

              <PasswordInputField control={control} name="password" label="Password" />

              <PasswordInputField
                control={control}
                name="confirmPassword"
                label="Confirm Password"
                watchPassword={watchPassword}
              />

              {errors.root && <Text style={styles.rootErrorText}>{errors.root.message}</Text>}

              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  (pressed || isLoading) && styles.primaryButtonPressed,
                  isLoading && styles.primaryButtonDisabled,
                ]}
                onPress={handleSubmit(onSignUp)}
                disabled={isLoading}
              >
                {isLoading ? (
                  <View style={styles.loadingContentRow}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={styles.loadingStepText}>{loadingStep}</Text>
                  </View>
                ) : (
                  <Text style={styles.primaryButtonText}>Send Verification Code</Text>
                )}
              </Pressable>

              <View style={styles.redirectContainer}>
                <Text style={styles.redirectText}>Already have an account? </Text>
                <Link href="/(auth)/sign-in" asChild>
                  <Pressable>
                    <Text style={styles.redirectLinkText}>Sign In</Text>
                  </Pressable>
                </Link>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardAvoid: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
  },
  formContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -16,
    paddingHorizontal: 20,
    paddingTop: 32,
  },
  form: {
    gap: 20,
  },
  rootErrorText: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: '#D97706',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  primaryButtonPressed: {
    opacity: 0.9,
  },
  primaryButtonDisabled: {
    backgroundColor: '#FCD34D',
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  loadingContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingStepText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  redirectContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 20,
  },
  redirectText: {
    color: '#6B7280',
    fontSize: 14,
  },
  redirectLinkText: {
    color: '#0B5A3E',
    fontWeight: '700',
    fontSize: 14,
  },
});
