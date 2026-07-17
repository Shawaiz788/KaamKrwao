import React from 'react';
import { Stack, Redirect } from 'expo-router';
import { useAuth } from '@/context/auth';
import { View, ActivityIndicator } from 'react-native';
import { USER_TYPE_PRO } from '@/constants/userTypes';

/**
 * Pro route group layout.
 * Guards: must be logged in AND usertype_id === USER_TYPE_PRO.
 */
export default function ProLayout() {
    const { user, initializing } = useAuth();

    if (initializing) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0B1A12' }}>
                <ActivityIndicator size="large" color="#22C55E" />
            </View>
        );
    }

    // Not logged in
    if (!user) return <Redirect href="/" />;

    // Profile incomplete
    if (!user.displayName) return <Redirect href="/(protected)/profile-setup" />;

    // Not a pro — redirect to client home
    if (user.usertype_id !== USER_TYPE_PRO) return <Redirect href="/(protected)/(client)/home" />;

    return <Stack screenOptions={{ headerShown: false }} />;
}
