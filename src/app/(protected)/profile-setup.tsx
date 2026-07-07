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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../provider/auth'; // Updated import
import { updateProfile } from '@react-native-firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { createUser } from '../../../api/user';
import { useMutation } from '@tanstack/react-query';
import { createCountry, createCity, createArea, createLocation, getCountries, getCities, getCitiesByCountry, getAreasByCity, City } from '../../../api/location';

type Role = 'client' | 'provider';

export default function ProfileSetupScreen() {
  const insets = useSafeAreaInsets();
  const { user, reloadUser } = useAuth(); // Updated hook usage
  const router = useRouter();
  const params = useLocalSearchParams();

  // Component States
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [citiesList, setCitiesList] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [role, setRole] = useState<Role>('client');
  const [gender, setGender] = useState<string>('other');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  React.useEffect(() => {
    const loadCities = async () => {
      setIsLoadingCities(true);
      try {
        const fetchedCities = await getCities();
        setCitiesList(fetchedCities);
        if (fetchedCities.length > 0) {
          setSelectedCity(fetchedCities[0]);
        }
      } catch (err) {
        console.error('Error loading cities:', err);
        const fallbackCities: City[] = [
          { id: 2, name: 'Lahore' },
          { id: 4, name: 'Karachi' },
          { id: 3, name: 'Islamabad' }
        ];
        setCitiesList(fallbackCities);
        setSelectedCity(fallbackCities[0]);
      } finally {
        setIsLoadingCities(false);
      }
    };

    loadCities();
  }, []);

  const isNameValid = fullName.trim().length >= 3;
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const addMutation = useMutation({
    mutationFn: createUser,
  })





  const CreateUser = async () => {
    if (!user)
      return null;

    // Split fullName into first_name and last_name
    const nameParts = fullName.trim().split(/\s+/);
    const first_name = nameParts[0] || '';
    const last_name = nameParts.slice(1).join(' ') || '';

    // Map role to  (Viewer and Worker in the database)
    const usertype_id = role === 'client' ? 1 : 2;


    if (!selectedCity) {
      throw new Error('Please select a city.');
    }
    const cityId = selectedCity.id;
    const cityName = selectedCity.name;




    const newUser = {
      first_name,
      last_name,
      phone_number: user.phoneNumber || '',
      email: email.trim(),
      gender,
      usertype_id: usertype_id,
      location_id: 1,
      password: "MyPassword2000@",
      overall_rating: 5,
    };

    return await addMutation.mutateAsync(newUser);
  };

  const handleGoToHome = async () => {
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
      // 1. Call the backend API FIRST to register the user in Postgres
      console.log('[profile-setup] Starting CreateUser chain...');
      await CreateUser();

      // 2. Update Firebase User Profile Display Name ONLY AFTER database registration succeeds
      await updateProfile(user, {
        displayName: fullName.trim(),
      });

      // 3. Reload user in context to update state
      await reloadUser();

      console.log('Saved locally / logged profile parameters:', {
        uid: user.uid,
        email: email.trim(),
        fullName: fullName.trim(),
        phone: user.phoneNumber,
        city: selectedCity?.name,
        role,
        gender,
        password: params.password,
      });

      console.log('Profile setup saved successfully!');
      router.replace('/home');
    } catch (err: any) {
      console.error('[profile-setup] Profile setup failed:', err);
      setErrorMsg(err?.message || 'Failed to save profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#0B5A3E" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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
              <View
                style={[
                  styles.inputFieldContainer,
                  isNameValid && { borderColor: '#16A34A' }
                ]}
              >
                <Ionicons name="person-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="John Doe"
                  placeholderTextColor="#9CA3AF"
                  value={fullName}
                  onChangeText={(val) => {
                    const clean = val.replace(/[0-9]/g, '');
                    setFullName(clean);
                    if (errorMsg) setErrorMsg(null);
                  }}
                />
                <View style={styles.indicatorContainer}>
                  {isNameValid ? (
                    <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
                  ) : (
                    <View style={styles.dotIndicator} />
                  )}
                </View>
              </View>
            </View>

            {/* Email Input */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Email Address</Text>
              <View
                style={[
                  styles.inputFieldContainer,
                  isEmailValid && { borderColor: '#16A34A' }
                ]}
              >
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
                <View style={styles.indicatorContainer}>
                  {isEmailValid ? (
                    <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
                  ) : (
                    <View style={styles.dotIndicator} />
                  )}
                </View>
              </View>
            </View>

            {/* City Selector */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Select your City</Text>
              {isLoadingCities ? (
                <View style={{ paddingVertical: 12 }}>
                  <ActivityIndicator color="#0F5C43" size="small" />
                </View>
              ) : (
                <View style={styles.gridContainer}>
                  {citiesList.map((c) => (
                    <Pressable
                      key={c.id}
                      style={[
                        styles.gridCard,
                        selectedCity?.id === c.id ? styles.gridCardActive : styles.gridCardInactive,
                      ]}
                      onPress={() => setSelectedCity(c)}
                    >
                      <Ionicons
                        name="location-outline"
                        size={20}
                        color={selectedCity?.id === c.id ? '#FFFFFF' : '#4B5563'}
                      />
                      <Text
                        style={[
                          styles.gridCardText,
                          selectedCity?.id === c.id ? styles.gridCardTextActive : styles.gridCardTextInactive,
                        ]}
                      >
                        {c.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            {/* Gender Selector */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Select your Gender</Text>
              <View style={styles.gridContainer}>
                {(['Male', 'Female', 'Other'] as string[]).map((genderName) => {
                  const isSelected = gender.toLowerCase() === genderName.toLowerCase();
                  return (
                    <Pressable
                      key={genderName}
                      style={[
                        styles.gridCard,
                        isSelected ? styles.gridCardActive : styles.gridCardInactive,
                        { width: '30.5%' }
                      ]}
                      onPress={() => setGender(genderName.toLowerCase())}
                    >
                      <Ionicons
                        name={
                          genderName === 'Male'
                            ? 'male'
                            : genderName === 'Female'
                            ? 'female'
                            : 'people'
                        }
                        size={18}
                        color={isSelected ? '#FFFFFF' : '#4B5563'}
                      />
                      <Text
                        style={[
                          styles.gridCardText,
                          isSelected ? styles.gridCardTextActive : styles.gridCardTextInactive,
                          { fontSize: 13 }
                        ]}
                      >
                        {genderName}
                      </Text>
                    </Pressable>
                  );
                })}
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

          </View>
        </ScrollView>

        {/* Fixed Footer with Save Button */}
        <View style={styles.footer}>
          <Pressable
            style={({ pressed }) => [
              styles.saveButton,
              pressed && styles.saveButtonPressed,
              isLoading && styles.saveButtonDisabled,
            ]}
            onPress={handleGoToHome}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Finish & Continue</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  saveButton: {
    backgroundColor: '#D97706',
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
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
  indicatorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 24,
    height: 24,
    marginLeft: 8,
  },
  dotIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#9CA3AF',
  },
});
