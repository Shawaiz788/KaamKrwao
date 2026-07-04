import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  ScrollView,
  Pressable,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../provider/auth'; // Updated import
import { updateProfile } from '@react-native-firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

type City = 'Lahore' | 'Karachi' | 'Islamabad' | 'Rawalpindi';
type Role = 'client' | 'provider';

export default function ProfileSetupScreen() {
  const insets = useSafeAreaInsets();
  const { user, reloadUser } = useAuth(); // Updated hook usage
  const router = useRouter();

  // Component States
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState<City>('Lahore');
  const [role, setRole] = useState<Role>('client');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGoToHAAN = async () => {
    if (!user) return;

    // Form Validation
    if (!fullName.trim()) {
      setErrorMsg('Full name is required');
      return;
    }

    if (!email.trim()) {
      setErrorMsg('Email address is required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMsg('Please enter a valid email address (e.g., you@example.com)');
      return;
    }

    setErrorMsg(null);
    setIsLoading(true);

    try {
      // Update Firebase User Profile Display Name
      await updateProfile(user, {
        displayName: fullName.trim(),
      });

      // Reload user in context to update state
      await reloadUser();

      console.log('Saved locally / logged profile parameters:', {
        uid: user.uid,
        email: email.trim(),
        fullName: fullName.trim(),
        phone: user.phoneNumber,
        city,
        role,
      });

      console.log('Profile setup saved successfully!');
      router.replace('/HomeScreen');
    } catch (err: any) {
      console.log('Error saving profile setup: ', err);
      setErrorMsg(err?.message || 'Failed to save profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B5A3E" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <View style={[styles.headerContainer, { paddingTop: insets.top + 36 }]}>
            <Text style={styles.headerTitle}>Complete Profile</Text>
            <Text style={styles.headerSubtitle}>Tell us a bit about yourself to get started</Text>
          </View>

          {/* Form Fields */}
          <View style={styles.formContainer}>
            {errorMsg && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={16} color="#DC2626" />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            {/* Full Name Input */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Full Name</Text>
              <View style={styles.inputFieldContainer}>
                <Ionicons name="person-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="John Doe"
                  placeholderTextColor="#9CA3AF"
                  value={fullName}
                  onChangeText={(val) => {
                    setFullName(val);
                    if (errorMsg) setErrorMsg(null);
                  }}
                />
              </View>
            </View>

            {/* Email Input */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputFieldContainer}>
                <Ionicons name="mail-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="you@example.com"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={(val) => {
                    setEmail(val);
                    if (errorMsg) setErrorMsg(null);
                  }}
                />
              </View>
            </View>

            {/* City Selector */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Select your City</Text>
              <View style={styles.gridContainer}>
                {(['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi'] as City[]).map((cityName) => (
                  <Pressable
                    key={cityName}
                    style={[
                      styles.gridCard,
                      city === cityName ? styles.gridCardActive : styles.gridCardInactive,
                    ]}
                    onPress={() => setCity(cityName)}
                  >
                    <Ionicons
                      name="location-outline"
                      size={20}
                      color={city === cityName ? '#FFFFFF' : '#4B5563'}
                    />
                    <Text
                      style={[
                        styles.gridCardText,
                        city === cityName ? styles.gridCardTextActive : styles.gridCardTextInactive,
                      ]}
                    >
                      {cityName}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Role Selection */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Register as</Text>
              <View style={styles.roleContainer}>
                <Pressable
                  style={[
                    styles.roleCard,
                    role === 'client' ? styles.roleCardActive : styles.roleCardInactive,
                  ]}
                  onPress={() => setRole('client')}
                >
                  <View style={styles.roleTextContainer}>
                    <Text
                      style={[
                        styles.roleTitle,
                        role === 'client' ? styles.roleTitleActive : styles.roleTitleInactive,
                      ]}
                    >
                      Client
                    </Text>
                    <Text
                      style={[
                        styles.roleDesc,
                        role === 'client' ? styles.roleDescActive : styles.roleDescInactive,
                      ]}
                    >
                      I want to find trusted local services for my work.
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.radioCircle,
                      role === 'client' ? styles.radioCircleActive : styles.radioCircleInactive,
                    ]}
                  >
                    {role === 'client' && <View style={styles.radioDot} />}
                  </View>
                </Pressable>

                <Pressable
                  style={[
                    styles.roleCard,
                    role === 'provider' ? styles.roleCardActive : styles.roleCardInactive,
                  ]}
                  onPress={() => setRole('provider')}
                >
                  <View style={styles.roleTextContainer}>
                    <Text
                      style={[
                        styles.roleTitle,
                        role === 'provider' ? styles.roleTitleActive : styles.roleTitleInactive,
                      ]}
                    >
                      Service Provider
                    </Text>
                    <Text
                      style={[
                        styles.roleDesc,
                        role === 'provider' ? styles.roleDescActive : styles.roleDescInactive,
                      ]}
                    >
                      I want to provide my services and get hired by clients.
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.radioCircle,
                      role === 'provider' ? styles.radioCircleActive : styles.radioCircleInactive,
                    ]}
                  >
                    {role === 'provider' && <View style={styles.radioDot} />}
                  </View>
                </Pressable>
              </View>
            </View>

            {/* Save Button */}
            <Pressable
              style={({ pressed }) => [
                styles.saveButton,
                pressed && styles.saveButtonPressed,
                isLoading && styles.saveButtonDisabled,
              ]}
              onPress={handleGoToHAAN}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Finish & Continue</Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardAvoid: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
  },
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
  formContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
    gap: 24,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  inputWrapper: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  inputFieldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    height: 52,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    height: '100%',
    color: '#111827',
    fontSize: 15,
    fontWeight: '500',
  },
  countryCode: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginRight: 10,
    borderRightWidth: 1,
    borderRightColor: '#D1D5DB',
    paddingRight: 10,
  },
  phoneInput: {
    flex: 1,
    height: '100%',
    color: '#111827',
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 1,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridCard: {
    width: '48%',
    height: 50,
    borderRadius: 14,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
  },
  gridCardActive: {
    backgroundColor: '#0B5A3E',
    borderColor: '#0B5A3E',
  },
  gridCardInactive: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
  gridCardText: {
    fontSize: 14,
    fontWeight: '600',
  },
  gridCardTextActive: {
    color: '#FFFFFF',
  },
  gridCardTextInactive: {
    color: '#4B5563',
  },
  roleContainer: {
    gap: 16,
  },
  roleCard: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  roleCardActive: {
    borderColor: '#0B5A3E',
    backgroundColor: 'rgba(11, 90, 62, 0.04)',
  },
  roleCardInactive: {
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  roleTextContainer: {
    flex: 1,
    gap: 4,
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  roleTitleActive: {
    color: '#0B5A3E',
  },
  roleTitleInactive: {
    color: '#374151',
  },
  roleDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  roleDescActive: {
    color: '#0B5A3E',
    opacity: 0.8,
  },
  roleDescInactive: {
    color: '#6B7280',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleActive: {
    borderColor: '#0B5A3E',
  },
  radioCircleInactive: {
    borderColor: '#9CA3AF',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0B5A3E',
  },
  saveButton: {
    backgroundColor: '#D97706',
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  saveButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  saveButtonDisabled: {
    backgroundColor: '#F3F4F6',
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
