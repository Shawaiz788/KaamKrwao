import React from 'react';
import { Stack } from 'expo-router';
import { PostJobProvider } from '@/context/post-job';

/**
 * Client route group layout.
 * Wraps PostJobProvider around all client screens.
 */
export default function ClientLayout() {
    return (
        <PostJobProvider>
            <Stack screenOptions={{ headerShown: false }} />
        </PostJobProvider>
    );
}
