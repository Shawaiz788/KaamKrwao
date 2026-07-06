import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    KeyboardAvoidingView,
    Platform,
    View,
    ScrollView,
    Pressable,
    StatusBar,
    TextInput,
    ActivityIndicator,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { getAuth, signInWithPhoneNumber } from '@react-native-firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const signUpSchema = z.object({
    phone: z
        .string({ message: 'Phone number is required' })
        .regex(/^[0-9]{10}$/, 'Phone number must be exactly 10 digits (e.g. 3001234567)'),
    password: z
        .string({ message: 'Password is required' })
        .min(6, 'Password must be at least 6 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-zA-Z]/, 'Password must contain at least one alphabet letter')
        .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: z
        .string({ message: 'Confirm password is required' }),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords must match',
    path: ['confirmPassword'],
});

type SignUpFields = z.infer<typeof signUpSchema>;

export default function SignUpScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
        setIsLoading(true);
        try {
            const formattedPhone = `+92${data.phone}`;
            const auth = getAuth();
            
            // Clear any stale user session to prevent firebase auth from getting stuck
            if (auth.currentUser) {
                await auth.signOut();
            }
            
            const confirmation = await signInWithPhoneNumber(auth, formattedPhone);
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
            if (err.code === 'auth/invalid-phone-number') {
                setError('phone', { message: 'Invalid phone number format' });
            } else {
                setError('root', { message: err.message || 'An error occurred sending OTP' });
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0B5A3E" />

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
                    <View style={[styles.headerContainer, { paddingTop: insets.top + 20 }]}>
                        <View style={[styles.circleDeco, styles.circle1]} />
                        <View style={[styles.circleDeco, styles.circle2]} />

                        <View style={styles.headerTopRow}>
                            <View style={styles.logoContainer}>
                                <View style={styles.logoIconBg}>
                                    <Ionicons name="checkmark-sharp" size={20} color="#FFFFFF" />
                                </View>
                                <Text style={styles.logoText}>HAAN</Text>
                            </View>

                            <Pressable style={styles.langSelector}>
                                <Ionicons name="globe-outline" size={14} color="#FFFFFF" />
                                <Text style={styles.langSelectorText}>اردو</Text>
                            </Pressable>
                        </View>

                        <View style={styles.headerTitleContainer}>
                            <Text style={styles.headerTitle}>Sign Up</Text>
                            <Text style={styles.headerSubtitle}>Create an account to get started</Text>
                        </View>
                    </View>

                    {/* Form Content Area */}
                    <View style={styles.formContainer}>
                        <View style={styles.form}>
                            {/* Phone Input */}
                            <View style={styles.inputWrapper}>
                                <Text style={styles.label}>Phone Number</Text>
                                <Controller
                                    control={control}
                                    name="phone"
                                    render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => {
                                        const isValid = /^[0-9]{10}$/.test(value || '');
                                        return (
                                            <View style={styles.inputContainer}>
                                                <View
                                                    style={[
                                                        styles.inputFieldContainer,
                                                        {
                                                            borderColor: error ? '#EF4444' : (isValid ? '#16A34A' : '#E5E7EB'),
                                                            backgroundColor: '#F9FAFB'
                                                        }
                                                    ]}
                                                >
                                                    <Text style={styles.countryCode}>+92</Text>
                                                    <TextInput
                                                        style={styles.phoneInput}
                                                        placeholder="3001234567"
                                                        placeholderTextColor="#9CA3AF"
                                                        keyboardType="numeric"
                                                        autoFocus
                                                        value={value}
                                                        onChangeText={(text) => {
                                                            const clean = text.replace(/[^0-9]/g, '').slice(0, 10);
                                                            onChange(clean);
                                                        }}
                                                        onBlur={onBlur}
                                                    />
                                                    <View style={styles.indicatorContainer}>
                                                        {isValid ? (
                                                            <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
                                                        ) : (
                                                            <View style={styles.dotIndicator} />
                                                        )}
                                                    </View>
                                                </View>
                                                {error && <Text style={styles.errorText}>{error.message}</Text>}
                                            </View>
                                        );
                                    }}
                                />
                            </View>

                            {/* Password Input */}
                            <View style={styles.inputWrapper}>
                                <Text style={styles.label}>Password</Text>
                                <Controller
                                    control={control}
                                    name="password"
                                    render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => {
                                        const isValid = (value || '').length >= 6 &&
                                            /[A-Z]/.test(value || '') &&
                                            /[a-zA-Z]/.test(value || '') &&
                                            /[^a-zA-Z0-9]/.test(value || '');
                                        return (
                                            <View style={styles.inputContainer}>
                                                <View
                                                    style={[
                                                        styles.inputFieldContainer,
                                                        {
                                                            borderColor: error ? '#EF4444' : (isValid ? '#16A34A' : '#E5E7EB'),
                                                            backgroundColor: '#F9FAFB'
                                                        }
                                                    ]}
                                                >
                                                    <Ionicons name="lock-closed-outline" size={18} color="#9CA3AF" style={{ marginRight: 8 }} />
                                                    <TextInput
                                                        style={styles.passwordInput}
                                                        placeholder="••••••••"
                                                        placeholderTextColor="#9CA3AF"
                                                        secureTextEntry={!showPassword}
                                                        value={value}
                                                        onChangeText={onChange}
                                                        onBlur={onBlur}
                                                    />
                                                    <Pressable
                                                        onPress={() => setShowPassword(!showPassword)}
                                                        style={{ padding: 4, marginRight: 4 }}
                                                    >
                                                        <Ionicons
                                                            name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                                                            size={18}
                                                            color="#6B7280"
                                                        />
                                                    </Pressable>
                                                    <View style={styles.indicatorContainer}>
                                                        {isValid ? (
                                                            <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
                                                        ) : (
                                                            <View style={styles.dotIndicator} />
                                                        )}
                                                    </View>
                                                </View>
                                                {error && <Text style={styles.errorText}>{error.message}</Text>}
                                            </View>
                                        );
                                    }}
                                />
                            </View>

                            {/* Confirm Password Input */}
                            <View style={styles.inputWrapper}>
                                <Text style={styles.label}>Confirm Password</Text>
                                <Controller
                                    control={control}
                                    name="confirmPassword"
                                    render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => {
                                        const isValid = (value || '').length >= 6 &&
                                            /[A-Z]/.test(value || '') &&
                                            /[a-zA-Z]/.test(value || '') &&
                                            /[^a-zA-Z0-9]/.test(value || '') &&
                                            value === watchPassword;
                                        return (
                                            <View style={styles.inputContainer}>
                                                <View
                                                    style={[
                                                        styles.inputFieldContainer,
                                                        {
                                                            borderColor: error ? '#EF4444' : (isValid ? '#16A34A' : '#E5E7EB'),
                                                            backgroundColor: '#F9FAFB'
                                                        }
                                                    ]}
                                                >
                                                    <Ionicons name="lock-closed-outline" size={18} color="#9CA3AF" style={{ marginRight: 8 }} />
                                                    <TextInput
                                                        style={styles.passwordInput}
                                                        placeholder="••••••••"
                                                        placeholderTextColor="#9CA3AF"
                                                        secureTextEntry={!showConfirmPassword}
                                                        value={value}
                                                        onChangeText={onChange}
                                                        onBlur={onBlur}
                                                    />
                                                    <Pressable
                                                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                                        style={{ padding: 4, marginRight: 4 }}
                                                    >
                                                        <Ionicons
                                                            name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                                                            size={18}
                                                            color="#6B7280"
                                                        />
                                                    </Pressable>
                                                    <View style={styles.indicatorContainer}>
                                                        {isValid ? (
                                                            <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
                                                        ) : (
                                                            <View style={styles.dotIndicator} />
                                                        )}
                                                    </View>
                                                </View>
                                                {error && <Text style={styles.errorText}>{error.message}</Text>}
                                            </View>
                                        );
                                    }}
                                />
                            </View>

                            {errors.root && (
                                <Text style={styles.rootErrorText}>{errors.root.message}</Text>
                            )}

                            <Pressable
                                style={({ pressed }) => [
                                    styles.primaryButton,
                                    (pressed || isLoading) && styles.primaryButtonPressed,
                                    isLoading && styles.primaryButtonDisabled
                                ]}
                                onPress={handleSubmit(onSignUp)}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
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
    headerContainer: {
        backgroundColor: '#0B5A3E',
        paddingHorizontal: 20,
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
        top: -100,
        right: -50,
    },
    circle2: {
        width: 150,
        height: 150,
        bottom: -80,
        left: -30,
    },
    headerTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    logoIconBg: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: '#16A34A',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    langSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
    },
    langSelectorText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
    headerTitleContainer: {
        marginTop: 24,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.7)',
        marginTop: 4,
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
    inputWrapper: {
        gap: 8,
        width: '100%',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 6,
    },
    inputContainer: {
        width: '100%',
        marginBottom: 8,
    },
    inputFieldContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        borderRadius: 14,
        height: 52,
        paddingHorizontal: 16,
        backgroundColor: '#F9FAFB',
    },
    countryCode: {
        fontSize: 15,
        fontWeight: '600',
        color: '#374151',
        marginRight: 10,
        borderRightWidth: 1,
        borderRightColor: '#D1D5DB',
        paddingRight: 10,
    },
    phoneInput: {
        flex: 1,
        height: '100%',
        color: '#111827',
        fontSize: 15,
        fontWeight: '500',
        letterSpacing: 1,
    },
    passwordInput: {
        flex: 1,
        height: '100%',
        color: '#111827',
        fontSize: 15,
        fontWeight: '500',
    },
    errorText: {
        color: '#EF4444',
        fontSize: 12,
        marginTop: 4,
        fontWeight: '500',
    },
    indicatorContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        width: 24,
        height: 24,
        marginLeft: 8,
    },
    dotIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#9CA3AF',
    },
});
