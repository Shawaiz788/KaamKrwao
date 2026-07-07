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
import CustomInput from '@/components/CustomInput';
import { Link, useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { getAuth, signInWithPhoneNumber, signInAnonymously, updateProfile } from '@react-native-firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { getUserById, getUserByPhoneNumber } from '../../../api/user';
import { useAuth } from '../../provider/auth';

const signInSchema = z.object({
    phone: z
        .string({ message: 'Phone number is required' })
        .regex(/^[0-9]{10}$/, 'Phone number must be exactly 10 digits (e.g. 3001234567)'),
    password: z
        .string({ message: 'Password is required' })
        .min(6, 'Password must be at least 6 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-zA-Z]/, 'Password must contain at least one alphabet letter')
        .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
});

type SignInFields = z.infer<typeof signInSchema>;

export default function SignInScreen() {
    const insets = useSafeAreaInsets();
    const [showPassword, setShowPassword] = useState(false);
    const {
        control,
        handleSubmit,
        setError,
        formState: { errors },
    } = useForm<SignInFields>({
        resolver: zodResolver(signInSchema),
        defaultValues: {
            phone: '',
            password: '',
        },
    });

    const router = useRouter();
    const { reloadUser } = useAuth();

    const [isLoading, setIsLoading] = useState(false);

    const onSignIn = async (data: SignInFields) => {
        setIsLoading(true);
        try {
            const formattedPhone = `+92${data.phone}`;
            console.log('[SignIn] Fetching user info for phone:', formattedPhone);
            const userInfo = await getUserByPhoneNumber(data.phone);
            console.log('[SignIn] Fetched user info:', userInfo);

            const auth = getAuth();

            // Clear any stale user session to prevent firebase auth from getting stuck
            if (auth.currentUser) {
                await auth.signOut();
            }

            // Authenticate directly (mock via signInAnonymously)
            const userCredential = await signInAnonymously(auth);

            const fullName = userInfo ? `${userInfo.first_name} ${userInfo.last_name}`.trim() : '';
            if (fullName) {
                // Set the display name to mock user info
                await updateProfile(userCredential.user, {
                    displayName: fullName,
                });
            }

            // Sync the local Auth context
            await reloadUser();

            // Redirect directly to home screen
            router.replace('/home');
        } catch (err: any) {
            console.log('Sign in error: ', err);
            setError('root', { message: err.message || 'An error occurred signing in' });
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
                                <Text style={styles.logoText}>KaamKarwao</Text>
                            </View>

                            <Pressable style={styles.langSelector}>
                                <Ionicons name="globe-outline" size={14} color="#FFFFFF" />
                                <Text style={styles.langSelectorText}>اردو</Text>
                            </Pressable>
                        </View>

                        <View style={styles.headerTitleContainer}>
                            <Text style={styles.headerTitle}>Sign In</Text>
                            <Text style={styles.headerSubtitle}>Enter your phone and password to sign in</Text>
                        </View>
                    </View>

                    {/* Form Content Area */}
                    <View style={styles.formContainer}>
                        <View style={styles.form}>
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

                            {errors.root && (
                                <Text style={styles.rootErrorText}>{errors.root.message}</Text>
                            )}

                            <Pressable
                                style={({ pressed }) => [
                                    styles.primaryButton,
                                    (pressed || isLoading) && styles.primaryButtonPressed,
                                    isLoading && styles.primaryButtonDisabled
                                ]}
                                onPress={handleSubmit(onSignIn)}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.primaryButtonText}>Sign In</Text>
                                )}
                            </Pressable>

                            <View style={styles.redirectContainer}>
                                <Text style={styles.redirectText}>Don't have an account? </Text>
                                <Link href="/(auth)/sign-up" asChild>
                                    <Pressable>
                                        <Text style={styles.redirectLinkText}>Sign Up</Text>
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
    forgotPasswordButton: {
        alignSelf: 'center',
        paddingVertical: 4,
    },
    forgotPasswordText: {
        color: '#0B5A3E',
        fontSize: 14,
        fontWeight: '600',
    },
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 10,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#E5E7EB',
    },
    dividerText: {
        marginHorizontal: 12,
        color: '#9CA3AF',
        fontSize: 14,
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
