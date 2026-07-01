import { StatusBar } from 'expo-status-bar';
import {
    StyleSheet,
    Text,
    View,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import CustomInput from '@/components/CustomInput';
import CustomButton from '@/components/CustomButton';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';

const signInSchema = z.object({
    email: z.string({ message: 'Email is required' }).email('Invalid email'),
    password: z
        .string({ message: 'Password is required' })
        .min(8, 'Password should be at least 8 characters long'),
});

type SignInFields = z.infer<typeof signInSchema>;

export default function SignInScreen() {
    const { control, handleSubmit, formState: { errors } } = useForm<SignInFields>({
        resolver: zodResolver(signInSchema)
    });

    const { signIn } = useAuth()

    const OnSignInPress = (data: SignInFields) => {
        console.log('SignIn:', data);
        signIn();
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <Text style={styles.title}>Sign in</Text>

            <View style={styles.form}>
                <CustomInput
                    placeholder='Email'
                    name='email'
                    autoFocus
                    autoCapitalize='none'
                    keyboardType='email-address'
                    autoComplete='email'
                    control={control}
                />
                <CustomInput
                    placeholder='Password'
                    secureTextEntry
                    control={control}
                    name='password'
                />
            </View>
            <CustomButton
                text='Sign in'
                onPress={handleSubmit(OnSignInPress)}
            />

            <Link href='/sign-up' style={styles.link}>
                Don't have an account? Sign up
            </Link>

            <StatusBar style='auto' />
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        gap: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: '600',
    },
    form: {
        gap: 5,
        width: '100%',
        alignItems: 'center',
    }, link: {
        color: '#4353FD',
        fontWeight: '600',
    },
});
