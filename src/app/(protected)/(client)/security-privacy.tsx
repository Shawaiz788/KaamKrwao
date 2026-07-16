import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Switch,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SecurityPrivacyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Toggles states
  const [twoFactor, setTwoFactor] = useState(false);
  const [biometric, setBiometric] = useState(true);
  const [dataSharing, setDataSharing] = useState(false);
  const [locationHistory, setLocationHistory] = useState(true);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleChangePassword = () => {
    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      Alert.alert('Error', 'Please fill in all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New password and confirm password do not match.');
      return;
    }

    setIsChangingPassword(true);
    // Simulating password change call
    setTimeout(() => {
      setIsChangingPassword(false);
      Alert.alert('Success', 'Your password has been changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }, 1500);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: '#F9FAFB' }}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top > 0 ? insets.top + 10 : 20 }]}>
        <View style={styles.headerTop}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.headerTitle}>Security & Privacy</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Security Settings Section */}
        <Text style={styles.sectionHeader}>Preferences</Text>
        <View style={styles.card}>
          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Ionicons name="shield-half-outline" size={20} color="#16A34A" style={styles.iconStyle} />
              <View style={{ flex: 1 }}>
                <Text style={styles.switchTitle}>Two-Factor Authentication</Text>
                <Text style={styles.switchDesc}>Secure your account with an extra verification code</Text>
              </View>
            </View>
            <Switch
              value={twoFactor}
              onValueChange={setTwoFactor}
              trackColor={{ false: '#D1D5DB', true: '#A7F3D0' }}
              thumbColor={twoFactor ? '#10B981' : '#F3F4F6'}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Ionicons name="finger-print-outline" size={20} color="#16A34A" style={styles.iconStyle} />
              <View style={{ flex: 1 }}>
                <Text style={styles.switchTitle}>Biometric Logins</Text>
                <Text style={styles.switchDesc}>Use FaceID or fingerprint check to access the app quicker</Text>
              </View>
            </View>
            <Switch
              value={biometric}
              onValueChange={setBiometric}
              trackColor={{ false: '#D1D5DB', true: '#A7F3D0' }}
              thumbColor={biometric ? '#10B981' : '#F3F4F6'}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Ionicons name="eye-off-outline" size={20} color="#16A34A" style={styles.iconStyle} />
              <View style={{ flex: 1 }}>
                <Text style={styles.switchTitle}>Data Personalization</Text>
                <Text style={styles.switchDesc}>Allow KaamKrwao to use account data to personalize search</Text>
              </View>
            </View>
            <Switch
              value={dataSharing}
              onValueChange={setDataSharing}
              trackColor={{ false: '#D1D5DB', true: '#A7F3D0' }}
              thumbColor={dataSharing ? '#10B981' : '#F3F4F6'}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Ionicons name="navigate-outline" size={20} color="#16A34A" style={styles.iconStyle} />
              <View style={{ flex: 1 }}>
                <Text style={styles.switchTitle}>Location History</Text>
                <Text style={styles.switchDesc}>Keep a record of your tasks locations for security audits</Text>
              </View>
            </View>
            <Switch
              value={locationHistory}
              onValueChange={setLocationHistory}
              trackColor={{ false: '#D1D5DB', true: '#A7F3D0' }}
              thumbColor={locationHistory ? '#10B981' : '#F3F4F6'}
            />
          </View>
        </View>

        {/* Change Password Section */}
        <Text style={styles.sectionHeader}>Change Password</Text>
        <View style={styles.card}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Current Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={18} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="••••••••"
                secureTextEntry
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>New Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={18} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="••••••••"
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Confirm New Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={18} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="••••••••"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          <Pressable
            style={[styles.btn, isChangingPassword && styles.btnDisabled]}
            onPress={handleChangePassword}
            disabled={isChangingPassword}
          >
            <Text style={styles.btnText}>
              {isChangingPassword ? 'Updating...' : 'Update Password'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#082C18',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  backBtn: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 60,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: '#374151',
    marginBottom: 10,
    marginTop: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 20,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  switchInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginRight: 16,
  },
  iconStyle: {
    marginRight: 12,
    marginTop: 2,
  },
  switchTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  switchDesc: {
    fontSize: 11,
    color: '#6B7280',
    lineHeight: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 6,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    height: 48,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    height: '100%',
  },
  btn: {
    backgroundColor: '#16A34A',
    height: 46,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  btnDisabled: {
    backgroundColor: '#9CA3AF',
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
