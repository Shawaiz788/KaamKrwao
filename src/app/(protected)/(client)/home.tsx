import React from 'react';
import HomeView from '@/pages/client/HomeView';
import { useAuth } from '@/context/auth';
import { usePostJob } from '@/context/post-job';
import { useRouter } from 'expo-router';

export default function ClientHomeRoute() {
    const { user } = useAuth();
    const { openPostJob } = usePostJob();
    const router = useRouter();

    return (
        <HomeView
            userName={user?.displayName || 'User'}
            onNavigateToTab={(tab) => router.navigate(`/${tab}`)}
            onOpenPostJob={openPostJob}
            onSelectPro={(proName) => router.navigate('/messages')}
        />
    );
}
