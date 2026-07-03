import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';

export default function AuthLayout() {
    console.log('Auth layout');
    const { isSignedIn } = useAuth();

    if (isSignedIn) {
        return <Redirect href={'HomeScreen'} />;
    }

    return (
        <Stack>
            <Stack.Screen
                name='sign-in'
                options={{ headerShown: false, title: 'Sign in' }}
            />
            <Stack.Screen name='sign-up' options={{ headerShown: false, title: 'Sign up' }} />
            <Stack.Screen name='verify' options={{ headerShown: false, title: 'Verify' }} />
        </Stack>
    );
}