import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../../provider/auth'; // Import your custom hook
import { View, ActivityIndicator } from 'react-native';

export default function AuthLayout() {
    const { user, initializing } = useAuth();

    if (initializing) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' }}>
                <ActivityIndicator size="large" color="#16A34A" />
            </View>
        );
    }

    if (user) {
        const isProfileIncomplete = !user.displayName;
        if (isProfileIncomplete) {
            return <Redirect href={'/profile-setup'} />;
        }
        return <Redirect href={'/HomeScreen'} />;
    }

    return (
        <Stack>
            <Stack.Screen name='sign-in' options={{ headerShown: false }} />
            <Stack.Screen name='sign-up' options={{ headerShown: false }} />
            <Stack.Screen name='verify' options={{ headerShown: false }} />
        </Stack>
    );
}
