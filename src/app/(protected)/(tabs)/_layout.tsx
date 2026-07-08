import React from 'react';
import { Tabs } from 'expo-router';
import { PostJobProvider } from '../../../provider/post-job';

export default function TabLayout() {
  return (
    <PostJobProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none' }, // Hides the bottom tab bar
        }}
      >
        <Tabs.Screen name="home" options={{ title: 'Home' }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      </Tabs>
    </PostJobProvider>
  );
}
