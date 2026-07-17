import React from 'react';
import HomeView from '@/pages/client/HomeView';
import { useAuth } from '@/context/auth';
import { usePostJob } from '@/context/post-job';
import { useRouter } from 'expo-router';

export default function HomeRoute() {
  const { user } = useAuth();
  const { openPostJob } = usePostJob();
  const router = useRouter();

  const handleSelectPro = (proName: string) => {
    router.navigate('/messages');
  };

  return (
    <HomeView
      userName={user?.displayName || 'ShawaizAli'}
      onNavigateToTab={(tab) => router.navigate(`/${tab}`)}
      onOpenPostJob={openPostJob}
      onSelectPro={handleSelectPro}
    />
  );
}
