import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image, ActivityIndicator, Alert, ToastAndroid, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { updateProfilePic } from '@/services/user';
import { useAuth } from '@/context/auth';

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  onOpenDrawer: () => void;
  user?: any;
}

export default function AdminHeader({ title, subtitle, onOpenDrawer, user }: AdminHeaderProps) {
  const insets = useSafeAreaInsets();
  const { updateUser } = useAuth();
  const [isUploading, setIsUploading] = useState(false);

  const profilePic = user?.profile_pic;

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Gallery permissions are required to select a profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedUri = result.assets[0].uri;
        setIsUploading(true);

        const profilePicResponse = await updateProfilePic(selectedUri);
        const resObj = profilePicResponse as any;
        const rawUrl = resObj?.image ?? resObj?.profile_pic;
        if (rawUrl) {
          const BASE = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '');
          const fullUrl = rawUrl.startsWith('http') ? rawUrl : `${BASE}${rawUrl}`;
          await updateUser({ profile_pic: fullUrl });
          if (Platform.OS === 'android') {
            ToastAndroid.show('Profile picture updated!', ToastAndroid.SHORT);
          } else {
            Alert.alert('Success', 'Profile picture updated successfully!');
          }
        }
      }
    } catch (err: any) {
      console.error('[AdminHeader] Error updating profile picture:', err);
      Alert.alert('Upload Failed', err?.message || 'Could not update profile picture.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View style={[styles.header, { paddingTop: Math.max(insets.top + 8, 16) }]}>
      <View style={styles.topRow}>
        <View style={styles.leftRow}>
          <Pressable style={styles.menuBtn} onPress={onOpenDrawer}>
            <Ionicons name="menu-outline" size={24} color="#FFFFFF" />
          </Pressable>
          <View>
            <View style={styles.badgeRow}>
              <View style={styles.badgeDot} />
              <Text style={styles.badgeText}>ADMIN PANEL</Text>
            </View>
            <Text style={styles.title}>{title}</Text>
          </View>
        </View>

        <Pressable style={styles.userSection} onPress={handlePickImage} disabled={isUploading}>
          {isUploading ? (
            <View style={styles.avatarPlaceholder}>
              <ActivityIndicator size="small" color="#0B5A3E" />
            </View>
          ) : profilePic ? (
            <Image source={{ uri: profilePic }} style={styles.userAvatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={20} color="#6B7280" />
            </View>
          )}

          {/* Small Camera Badge Icon */}
          <View style={styles.cameraBadge}>
            <Ionicons name="camera" size={10} color="#FFFFFF" />
          </View>
        </Pressable>
      </View>

      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#0B5A3E',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#F59E0B',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 6,
  },
  userSection: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  avatarPlaceholder: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#0B5A3E',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
});
