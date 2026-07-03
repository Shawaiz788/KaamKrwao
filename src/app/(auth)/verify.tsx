import React, { useRef, useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  KeyboardAvoidingView,
  Platform,
  View,
  ScrollView,
  Pressable,
  TextInput,
  StatusBar,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { isClerkAPIResponseError, useSignUp } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
const verifySchema = z.object({
  code: z.string({ message: 'Code is required' }).length(6, 'Verification code must be 6 digits'),
});

type VerifyFields = z.infer<typeof verifySchema>;

const mapClerkErrorToFormField = (error: any) => {
  switch (error.meta?.paramName) {
    case 'code':
      return 'code';
    default:
      return 'root';
  }
};

export default function VerifyScreen() {
  const {
    control,
    handleSubmit,
    setValue,
    setError,
    watch,
    formState: { errors },
  } = useForm<VerifyFields>({
    resolver: zodResolver(verifySchema),
    defaultValues: {
      code: '',
    },
  });

  const { signUp, isLoaded, setActive } = useSignUp();
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);

  const codeValue = watch('code');

  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<'success' | 'error' | null>(null);

  useEffect(() => {
    // Autofocus input on screen load
    setTimeout(() => {
      inputRef.current?.focus();
    }, 150);
  }, []);

  const onVerify = async ({ code }: VerifyFields) => {
    if (!isLoaded) return;

    try {
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (signUpAttempt.status === 'complete') {
        setActive({ session: signUpAttempt.createdSessionId });
      } else {
        console.log('Verification failed', signUpAttempt);
        setError('root', { message: 'Could not complete the sign up' });
      }
    } catch (err) {
      if (isClerkAPIResponseError(err)) {
        err.errors.forEach((error) => {
          const fieldName = mapClerkErrorToFormField(error) as keyof VerifyFields | 'root';
          setError(fieldName, {
            message: error.longMessage,
          });
        });
      } else {
        setError('root', { message: 'Unknown error occurred' });
      }
    }
  };

  const onResendCode = async () => {
    if (!isLoaded) return;
    try {
      await signUp.prepareVerification({ strategy: 'email_code' });
      setFeedbackType('success');
      setFeedbackMessage('Verification code resent successfully!');
      setTimeout(() => {
        setFeedbackMessage(null);
        setFeedbackType(null);
      }, 4000);
    } catch (err) {
      console.log('Resend error: ', err);
      setFeedbackType('error');
      setFeedbackMessage('Failed to resend verification code');
      setTimeout(() => {
        setFeedbackMessage(null);
        setFeedbackType(null);
      }, 4000);
    }
  };

  const handleFillDemoCode = () => {
    setValue('code', '123456');
    // Give state a small frame to update before submitting
    setTimeout(() => {
      handleSubmit(onVerify)();
    }, 100);
  };

  const emailAddress = signUp?.emailAddress || 'your email';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#072212" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header Area */}
          <View style={styles.headerContainer}>
            <View style={[styles.circleDeco, styles.circle1]} />
            <View style={[styles.circleDeco, styles.circle2]} />

            {/* Back Button */}
            <Pressable
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back-outline" size={20} color="#FFFFFF" />
              <Text style={styles.backButtonText}>Back</Text>
            </Pressable>

            {/* Language Selector in Header background */}
            <Pressable style={styles.langSelector}>
              <Ionicons name="globe-outline" size={14} color="#FFFFFF" />
              <Text style={styles.langSelectorText}>اردو</Text>
            </Pressable>

            {/* Envelope Icon Box */}
            <View style={styles.envelopeIconBox}>
              <Ionicons name="mail" size={26} color="#FFFFFF" />
            </View>

            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Verify your email</Text>
              <Text style={styles.headerSubtitle}>
                We sent a 6-digit code to{' '}
                <Text style={styles.emailBold}>{emailAddress}</Text>
              </Text>
            </View>
          </View>

          {/* Form Content Area */}
          <View style={styles.formContainer}>
            <Text style={styles.inputLabel}>Enter verification code</Text>

            <Controller
              control={control}
              name="code"
              render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                <View style={styles.otpSection}>
                  {/* Styled Box Grid (rendered underneath) */}
                  <View style={styles.codeContainer}>
                    {Array(6).fill(0).map((_, index) => {
                      const char = value ? value[index] : '';
                      const isFocusedBox = index === (value ? value.length : 0);
                      return (
                        <View
                          key={index}
                          style={[
                            styles.codeBox,
                            isFocusedBox && styles.codeBoxFocused,
                            error && styles.codeBoxError
                          ]}
                        >
                          <Text style={styles.codeText}>{char}</Text>
                        </View>
                      );
                    })}
                  </View>

                  {/* Invisible native input (overlayed on top to capture tap gestures) */}
                  <TextInput
                    ref={inputRef}
                    value={value}
                    onChangeText={(text) => {
                      const numeric = text.replace(/[^0-9]/g, '').slice(0, 6);
                      onChange(numeric);
                    }}
                    onBlur={onBlur}
                    keyboardType="number-pad"
                    maxLength={6}
                    style={styles.hiddenInput}
                    autoComplete="one-time-code"
                  />

                  {error && <Text style={styles.errorText}>{error.message}</Text>}
                </View>
              )}
            />

            {/* Empty space*/}
            <View style={styles.spacer} />

            {errors.root && (
              <Text style={styles.rootErrorText}>{errors.root.message}</Text>
            )}

            {/* Verify & Continue Button */}
            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                codeValue?.length !== 6 && styles.primaryButtonDisabled,
                pressed && styles.primaryButtonPressed
              ]}
              onPress={handleSubmit(onVerify)}
              disabled={codeValue?.length !== 6}
            >
              <Text style={styles.primaryButtonText}>Verify & Continue</Text>
            </Pressable>

            {/* Resend Code Button */}
            <Pressable
              style={({ pressed }) => [
                styles.resendButton,
                pressed && styles.resendButtonPressed
              ]}
              onPress={onResendCode}
            >
              <Ionicons name="refresh-sharp" size={16} color="#1F2937" />
              <Text style={styles.resendButtonText}>Resend code</Text>
            </Pressable>

            {feedbackMessage && (
              <Text
                style={[
                  styles.feedbackText,
                  feedbackType === 'success' ? styles.successText : styles.errorColorText
                ]}
              >
                {feedbackMessage}
              </Text>
            )}
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
    backgroundColor: '#072212',
    paddingHorizontal: 20,
    paddingTop: 16,
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 2,
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 6,
  },
  langSelector: {
    position: 'absolute',
    right: 20,
    top: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    zIndex: 2,
  },
  langSelectorText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 5,
  },
  envelopeIconBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    zIndex: 2,
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
    lineHeight: 20,
  },
  emailBold: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  otpSection: {
    width: '100%',
    marginBottom: 16,
    position: 'relative',
  },
  hiddenInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.01,
    zIndex: 10,
    elevation: 10,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  codeBox: {
    width: '14.5%',
    aspectRatio: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  codeBoxFocused: {
    borderColor: '#16A34A',
    borderWidth: 2,
  },
  codeBoxError: {
    borderColor: '#EF4444',
  },
  codeText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 8,
    fontWeight: '500',
  },
  spacer: {
    height: 24,
  },
  rootErrorText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#16A34A',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 16,
  },
  primaryButtonDisabled: {
    backgroundColor: '#A7F3D0',
    shadowOpacity: 0,
    elevation: 0,
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
  resendButton: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  resendButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  resendButtonText: {
    color: '#1F2937',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  feedbackText: {
    textAlign: 'center',
    fontSize: 13,
    marginTop: 12,
    fontWeight: '600',
  },
  successText: {
    color: '#16A34A',
  },
  errorColorText: {
    color: '#EF4444',
  },
});