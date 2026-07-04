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
import { getAuth, signInWithPhoneNumber } from '@react-native-firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const signInSchema = z.object({
    phone: z
        .string({ message: 'Phone number is required' })
        .regex(/^[0-9]{10}$/, 'Phone number must be exactly 10 digits (e.g. 3001234567)'),
});

type SignInFields = z.infer<typeof signInSchema>;

export default function SignInScreen() {
    const {
        control,
        handleSubmit,
        setError,
        formState: { errors },
    } = useForm<SignInFields>({
        resolver: zodResolver(signInSchema),
        defaultValues: {
            phone: '',
        },
    });

    const router = useRouter();

    const [isLoading, setIsLoading] = useState(false);

    const onSignIn = async (data: SignInFields) => {
        setIsLoading(true);
        try {
            const formattedPhone = `+92${data.phone}`;
            const auth = getAuth();
            const confirmation = await signInWithPhoneNumber(auth, formattedPhone);
            router.replace({
                pathname: '/verify',
                params: {
                    phoneNumber: formattedPhone,
                    verificationId: confirmation.verificationId,
                },
            });
        } catch (err: any) {
            console.log('Sign in error: ', err);
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
                            <Text style={styles.headerTitle}>Sign In / Sign Up</Text>
                            <Text style={styles.headerSubtitle}>Enter your phone number to continue</Text>
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
                                    render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                                        <View style={styles.inputContainer}>
                                            <View
                                                style={[
                                                    styles.inputFieldContainer,
                                                    {
                                                        borderColor: error ? '#EF4444' : '#E5E7EB',
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
                                                    value={value}
                                                    onChangeText={(text) => {
                                                        const clean = text.replace(/[^0-9]/g, '').slice(0, 10);
                                                        onChange(clean);
                                                    }}
                                                    onBlur={onBlur}
                                                />
                                            </View>
                                            {error && <Text style={styles.errorText}>{error.message}</Text>}
                                        </View>
                                    )}
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
                                    <Text style={styles.primaryButtonText}>Send Verification Code</Text>
                                )}
                            </Pressable>
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
    errorText: {
        color: '#EF4444',
        fontSize: 12,
        marginTop: 4,
        fontWeight: '500',
    },
});
