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
import { Link, useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { isClerkAPIResponseError, useSignIn } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const signInSchema = z.object({
    email: z.string({ message: 'Email is required' }).email('Invalid email address'),
    password: z
        .string({ message: 'Password is required' })
        .min(8, 'Password should be at least 8 characters long'),
});

type SignInFields = z.infer<typeof signInSchema>;

const mapClerkErrorToFormField = (error: any) => {
    switch (error.meta?.paramName) {
        case 'identifier':
            return 'email';
        case 'password':
            return 'password';
        default:
            return 'root';
    }
};

export default function SignInScreen() {
    const {
        control,
        handleSubmit,
        setError,
        formState: { errors },
    } = useForm<SignInFields>({
        resolver: zodResolver(signInSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    });

    const { signIn, isLoaded, setActive } = useSignIn();
    const router = useRouter();

    const onSignIn = async (data: SignInFields) => {
        if (!isLoaded) return;

        try {
            const signInAttempt = await signIn.create({
                identifier: data.email,
                password: data.password,
            });

            if (signInAttempt.status === 'complete') {
                setActive({ session: signInAttempt.createdSessionId });
            } else {
                console.log('Sign in failed');
                setError('root', { message: 'Sign in could not be completed' });
            }
        } catch (err) {
            console.log('Sign in error: ', JSON.stringify(err, null, 2));

            if (isClerkAPIResponseError(err)) {
                err.errors.forEach((error) => {
                    const fieldName = mapClerkErrorToFormField(error) as keyof SignInFields | 'root';
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
                            <Text style={styles.headerTitle}>Sign In</Text>
                            <Text style={styles.headerSubtitle}>Welcome back</Text>
                        </View>
                    </View>

                    {/* Form Content Area */}
                    <View style={styles.formContainer}>
                        <View style={styles.form}>
                            <CustomInput
                                control={control}
                                name="email"
                                label="Email"
                                placeholder="you@example.com"
                                autoCapitalize="none"
                                keyboardType="email-address"
                                autoComplete="email"
                            />

                            <CustomInput
                                control={control}
                                name="password"
                                label="Password"
                                placeholder="••••••••"
                                secureTextEntry
                            />

                            {errors.root && (
                                <Text style={styles.rootErrorText}>{errors.root.message}</Text>
                            )}

                            {/* Sign In Button */}
                            <Pressable
                                style={({ pressed }) => [
                                    styles.primaryButton,
                                    pressed && styles.primaryButtonPressed
                                ]}
                                onPress={handleSubmit(onSignIn)}
                            >
                                <Text style={styles.primaryButtonText}>Sign In</Text>
                            </Pressable>

                            {/* Forgot Password Link */}
                            <Pressable style={styles.forgotPasswordButton}>
                                <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                            </Pressable>

                            {/* "or" Divider */}
                            <View style={styles.dividerRow}>
                                <View style={styles.dividerLine} />
                                <Text style={styles.dividerText}>or</Text>
                                <View style={styles.dividerLine} />
                            </View>

                            {/* Redirect to Sign Up */}
                            <View style={styles.redirectContainer}>
                                <Text style={styles.redirectText}>Don't have an account? </Text>
                                <Link href="/sign-up" asChild>
                                    <Pressable>
                                        <Text style={styles.redirectLinkText}>Create Account</Text>
                                    </Pressable>
                                </Link>
                            </View>


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
        backgroundColor: '#072212',
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
    rootErrorText: {
        color: '#EF4444',
        fontSize: 13,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 12,
    },
    primaryButton: {
        backgroundColor: '#16A34A',
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 12,
        shadowColor: '#16A34A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
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
    forgotPasswordButton: {
        alignItems: 'center',
        marginTop: 16,
        marginBottom: 16,
    },
    forgotPasswordText: {
        color: '#16A34A',
        fontSize: 14,
        fontWeight: '600',
    },
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 12,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#E5E7EB',
    },
    dividerText: {
        color: '#9CA3AF',
        fontSize: 14,
        marginHorizontal: 12,
        fontWeight: '500',
    },
    redirectContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 12,
        marginBottom: 24,
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
    demoCard: {
        backgroundColor: '#EDF3FF',
        borderWidth: 1,
        borderColor: '#C6D8FF',
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    demoText: {
        color: '#2A5DF2',
        fontSize: 13,
        fontWeight: '500',
    },
    demoBold: {
        fontWeight: '700',
    },
});