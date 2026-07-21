import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ProfileHeaderProps {
  topInset: number;
}

export default function ProfileHeader({ topInset }: ProfileHeaderProps) {
  return (
    <View style={[styles.headerContainer, { paddingTop: topInset + 36 }]}>
      <Text style={styles.headerTitle}>Complete Profile</Text>
      <Text style={styles.headerSubtitle}>Tell us a bit about yourself to get started</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#0B5A3E',
    paddingHorizontal: 24,
    paddingBottom: 28,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 6,
  },
});
