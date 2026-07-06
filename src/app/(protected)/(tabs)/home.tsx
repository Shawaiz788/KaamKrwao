import React from 'react';
import HomeView from '../../../components/home/HomeView';
import { useAuth } from '../../../provider/auth';
import { usePostJob } from '../../../provider/post-job';
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
