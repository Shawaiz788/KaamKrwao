import React from 'react';
import {
  StyleSheet,
  Text,
  KeyboardAvoidingView,
  Platform,
  View,
  ScrollView,
  Pressable,
  StatusBar,
} from 'react-native';
import CustomInput from '@/components/CustomInput';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router } from 'expo-router';
import { isClerkAPIResponseError, useSignUp } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

// Form validation schema including confirmPassword check
const signUpSchema = z
  .object({
    email: z.string({ message: 'Email is required' }).email('Invalid email address'),
    password: z
      .string({ message: 'Password is required' })
      .min(8, 'Password should be at least 8 characters long'),
    confirmPassword: z.string({ message: 'Confirm password is required' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type SignUpFields = z.infer<typeof signUpSchema>;

const mapClerkErrorToFormField = (error: any) => {
  switch (error.meta?.paramName) {
    case 'email_address':
      return 'email';
    case 'password':
      return 'password';
    default:
      return 'root';
  }
};

export default function SignUpScreen() {
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SignUpFields>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const { signUp, isLoaded } = useSignUp();

  const onSignUp = async (data: SignUpFields) => {
    if (!isLoaded) return;

    try {
      await signUp.create({
        emailAddress: data.email,
        password: data.password,
      });

      await signUp.prepareVerification({ strategy: 'email_code' });

      router.push('/verify');
    } catch (err) {
      console.log('Sign up error: ', err);
      if (isClerkAPIResponseError(err)) {
        err.errors.forEach((error) => {
          console.log('Error: ', JSON.stringify(error, null, 2));
          const fieldName = mapClerkErrorToFormField(error) as keyof SignUpFields | 'root';
          setError(fieldName, {
            message: error.longMessage,
          });
        });
      } else {
        setError('root', { message: 'Unknown error' });
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#072212" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Area */}
          <View style={styles.headerContainer}>
            <View style={[styles.circleDeco, styles.circle1]} />
            <View style={[styles.circleDeco, styles.circle2]} />

            <View style={styles.headerTopRow}>
              {/* Logo */}
              <View style={styles.logoContainer}>
                <View style={styles.logoIconBg}>
                  <Ionicons name="checkmark-sharp" size={20} color="#FFFFFF" />
                </View>
                <Text style={styles.logoText}>HAAN</Text>
              </View>

              {/* Language Selector */}
              <Pressable style={styles.langSelector}>
                <Ionicons name="globe-outline" size={14} color="#FFFFFF" />
                <Text style={styles.langSelectorText}>اردو</Text>
              </Pressable>
            </View>

            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Create Account</Text>
              <Text style={styles.headerSubtitle}>Free to join. No credit card needed.</Text>
            </View>
          </View>

          {/* Form Content Area */}
          <View style={styles.formContainer}>
            <View style={styles.form}>
              <CustomInput
                control={control}
                name="email"
                label="Email address"
                placeholder="you@example.com"
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />

              <View style={styles.passwordFieldContainer}>
                <CustomInput
                  control={control}
                  name="password"
                  label="Password"
                  placeholder="••••••••"
                  secureTextEntry
                />
                <Text style={styles.passwordHint}>At least 8 characters</Text>
              </View>

              <CustomInput
                control={control}
                name="confirmPassword"
                label="Confirm password"
                placeholder="••••••••"
                secureTextEntry
              />

              {errors.root && (
                <Text style={styles.rootErrorText}>{errors.root.message}</Text>
              )}

              {/* Continue Button */}
              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.primaryButtonPressed
                ]}
                onPress={handleSubmit(onSignUp)}
              >
                <Text style={styles.primaryButtonText}>Continue →</Text>
              </Pressable>

              {/* Redirect to Sign In */}
              <View style={styles.redirectContainer}>
                <Text style={styles.redirectText}>Already have an account? </Text>
                <Link href="/sign-in" asChild>
                  <Pressable>
                    <Text style={styles.redirectLinkText}>Sign In</Text>
                  </Pressable>
                </Link>
              </View>

              {/* Footer Terms */}
              <Text style={styles.termsText}>
                By creating an account, you agree to HAAN's{' '}
                <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
                <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerContainer: {
    backgroundColor: '#0B5A3E',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
    position: 'relative',
    overflow: 'hidden',
  },
  circleDeco: {
    position: 'absolute',
    borderRadius: 200,
    backgroundColor: 'rgba(28, 163, 80, 0.08)',
  },
  circle1: {
    width: 200,
    height: 200,
    top: -40,
    right: -40,
  },
  circle2: {
    width: 140,
    height: 140,
    bottom: -60,
    left: -20,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
    marginBottom: 24,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIconBg: {
    backgroundColor: '#1CA350',
    width: 30,
    height: 30,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  langSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  langSelectorText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 5,
  },
  headerTitleContainer: {
    zIndex: 2,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
  },
  form: {
    width: '100%',
  },
  passwordFieldContainer: {
    marginBottom: 8,
  },
  passwordHint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: -4,
    marginBottom: 8,
    fontWeight: '500',
  },
  rootErrorText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#D97706',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  redirectContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  redirectText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
  redirectLinkText: {
    color: '#16A34A',
    fontSize: 14,
    fontWeight: '700',
  },
  termsText: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 12,
    lineHeight: 18,
    paddingHorizontal: 10,
  },
  termsLink: {
    color: '#6B7280',
    fontWeight: '500',
  },
});