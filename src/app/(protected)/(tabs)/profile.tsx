import React from 'react';
import ProfileView from '../../../components/home/ProfileView';
import { useAuth } from '../../../provider/auth';
import { getAuth, signOut } from '@react-native-firebase/auth';
import { Alert } from 'react-native';

export default function ProfileRoute() {
  const { user } = useAuth();

  const handleSignOut = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
    } catch (error) {
      console.error('Sign out error: ', error);
      Alert.alert('Sign Out Error', 'Unable to sign out. Please try again.');
    }
  };

  return (
    <ProfileView
      userName={user?.displayName || 'ShawaizAli'}
      userEmail={user?.email || 'shawaiz@example.com'}
      onSignOut={handleSignOut}
    />
  );
}
