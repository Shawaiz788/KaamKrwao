import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/context/auth';
import { View, ActivityIndicator } from 'react-native';
import { USER_TYPE_PRO } from '@/constants/userTypes';

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
            return <Redirect href={'/(protected)/profile-setup'} />;
        }
        if (user.usertype_id === USER_TYPE_PRO) {
            return <Redirect href={'/(protected)/(pro)/live-jobs'} />;
        }
        return <Redirect href={'/(protected)/(client)/home'} />;
    }

    return (
        <Stack>
            <Stack.Screen name='sign-in' options={{ headerShown: false }} />
            <Stack.Screen name='sign-up' options={{ headerShown: false }} />
            <Stack.Screen name='verify' options={{ headerShown: false }} />
        </Stack>
    );
}
