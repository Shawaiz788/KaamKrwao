import React from 'react';
import BrowseView from '../../../components/home/BrowseView';
import { useRouter } from 'expo-router';

export default function BrowseRoute() {
  const router = useRouter();

  const handleSelectPro = (proName: string) => {
    router.navigate('/messages');
  };

  return (
    <BrowseView
      initialCategory="All"
      onSelectPro={handleSelectPro}
    />
  );
}
