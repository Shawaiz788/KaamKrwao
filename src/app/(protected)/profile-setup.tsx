import React, { useEffect, useState, useRef } from 'react';
import * as SecureStore from 'expo-secure-store';
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
  Alert,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/context/auth';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { createUser, verifyUserOnBackend, loginUser } from '@/services/user';
import { useMutation } from '@tanstack/react-query';
import { City, getCities, Area, getAreas, getOrCreateLocationChain } from '@/services/location';
import { COUNTRY_DATA, getCountryFromPhone } from '@/constants/locationData';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { USER_TYPE_PRO } from '@/constants/userTypes';

type Role = 'client' | 'provider';

const getLeafletHtml = (initialLat: number, initialLng: number) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    body { margin: 0; padding: 0; background: #EAE6DF; }
    #map { height: 100vh; width: 100vw; }
    .leaflet-control-zoom { display: none !important; }
    .leaflet-control-attribution { display: none !important; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', { 
      zoomControl: false, 
      attributionControl: false,
      fadeAnimation: true,
      zoomAnimation: true
    }).setView([${initialLat}, ${initialLng}], 16);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 20,
      subdomains: 'abcd'
    }).addTo(map);

    map.on('moveend', function() {
      var center = map.getCenter();
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'REGION_CHANGED',
          latitude: center.lat,
          longitude: center.lng
        }));
      }
    });

    // Signal React Native that map is ready
    map.whenReady(function() {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MAP_READY' }));
      }
    });
  </script>
</body>
</html>
`;

export default function ProfileSetupScreen() {
  const insets = useSafeAreaInsets();
  const { user, login } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();

  const countryName = getCountryFromPhone(user?.phoneNumber);

  // Component States
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [citiesList, setCitiesList] = useState<City[]>([]);
  const [areasList, setAreasList] = useState<Area[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>('Lahore');
  const [role, setRole] = useState<Role>('client');
  const [gender, setGender] = useState<string>('male');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [area, setArea] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [streetNumber, setStreetNumber] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [formattedAddress, setFormattedAddress] = useState('');
  const [showAreaDropdown, setShowAreaDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [loadingGps, setLoadingGps] = useState(false);

  // Map picker overlay states
  const [mapAddress, setMapAddress] = useState('');
  const [mapCoords, setMapCoords] = useState<{ latitude: number, longitude: number } | null>(null);
  const mapWebViewRef = useRef<WebView>(null);

  // Load dynamic cities and areas from backend on mount
  useEffect(() => {
    const loadAddressData = async () => {
      try {
        console.log('[profile-setup] Loading cities and areas from backend API...');
        const cities = await getCities();
        const areas = await getAreas();
        setCitiesList(cities);
        setAreasList(areas);

        if (cities.length > 0) {
          // If cities are returned, default to the first one
          setSelectedCity(cities[0].name);
        }
      } catch (err) {
        console.error('[profile-setup] Failed to load cities/areas from backend:', err);
      }
    };
    loadAddressData();
  }, []);

  const countryCities = citiesList.map(c => c.name);

  const matchedCityObj = citiesList.find(c => c.name.toLowerCase() === selectedCity.toLowerCase());
  const cityAreas = matchedCityObj
    ? areasList.filter(a => a.city === matchedCityObj.id).map(a => a.name)
    : [];

  const fetchGpsLocation = async (silent = false) => {
    setLoadingGps(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        if (!silent) {
          Alert.alert('Permission Denied', 'Permission to access location was denied. Please input pin location manually.');
        }
        return;
      }
      let loc = null;
      try {
        loc = await Promise.race([
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
          new Promise<any>((_, reject) => setTimeout(() => reject(new Error('timeout')), 2500))
        ]);
      } catch (e) {
        console.log('[profile-setup] fetchGpsLocation request timed out. Fetching cached position...');
        loc = await Location.getLastKnownPositionAsync();
      }

      if (!loc) {
        throw new Error('GPS lookup failed.');
      }
      setLatitude(loc.coords.latitude);
      setLongitude(loc.coords.longitude);

      // Resolve address string from coords to pre-fill formatted address input
      try {
        let response = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude
        });
        if (response && response.length > 0) {
          const item = response[0];
          const parts = [
            item.name,
            item.street,
            item.district || item.subregion,
            item.city
          ].filter(Boolean);
          setFormattedAddress(parts.join(', '));
        }
      } catch (err) {
        // Silently catch reverse geocoding issues
      }
    } catch (err: any) {
      if (!silent) {
        Alert.alert('GPS Error', 'Failed to retrieve your current location.');
      }
      console.error(err);
    } finally {
      setLoadingGps(false);
    }
  };

  // Sync map coordinates and address when map picker opens
  useEffect(() => {
    if (showMapPicker) {
      const init = getInitialCoords();
      setMapCoords({ latitude: init.lat, longitude: init.lng });
      setMapAddress(latitude !== null && longitude !== null ? 'Selected Coordinates' : 'Loading address...');
      reverseGeocodeMap(init.lat, init.lng);
    }
  }, [showMapPicker]);

  const reverseGeocodeMap = async (lat: number, lng: number) => {
    try {
      let response = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (response && response.length > 0) {
        const item = response[0];
        const parts = [
          item.name,
          item.street,
          item.district || item.subregion,
          item.city,
        ].filter(Boolean);
        setMapAddress(parts.join(', ') || `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      } else {
        setMapAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      }
    } catch (e) {
      setMapAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    }
  };

  const handleMapModalMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'REGION_CHANGED') {
        const newCoords = {
          latitude: data.latitude,
          longitude: data.longitude,
        };
        setMapCoords(newCoords);
        reverseGeocodeMap(data.latitude, data.longitude);
      }
    } catch (e) {
      // JSON parse error
    }
  };

  const reCenterMapPicker = async () => {
    try {
      let loc = null;
      try {
        loc = await Promise.race([
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
          new Promise<any>((_, reject) => setTimeout(() => reject(new Error('timeout')), 2500))
        ]);
      } catch (e) {
        console.log('[profile-setup] reCenterMapPicker request timed out. Fetching cached position...');
        loc = await Location.getLastKnownPositionAsync();
      }
      if (loc) {
        const newCoords = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        };
        setMapCoords(newCoords);
        reverseGeocodeMap(newCoords.latitude, newCoords.longitude);

        if (mapWebViewRef.current) {
          const jsCode = `
            if (map) {
              map.setView([${newCoords.latitude}, ${newCoords.longitude}], 16);
            }
            true;
          `;
          mapWebViewRef.current.injectJavaScript(jsCode);
        }
      }
    } catch (e) {
      // Silence errors
    }
  };

  const confirmSelectedMapLocation = () => {
    if (mapCoords) {
      setLatitude(mapCoords.latitude);
      setLongitude(mapCoords.longitude);
      if (mapAddress && mapAddress !== 'Loading address...') {
        setFormattedAddress(mapAddress);
      }
    }
    setShowMapPicker(false);
  };

  useEffect(() => {
    if (latitude === null || longitude === null) {
      fetchGpsLocation(true);
    }
  }, []);

  // Reset area when city changes
  useEffect(() => {
    setArea('');
  }, [selectedCity]);

  const getInitialCoords = () => {
    if (latitude !== null && longitude !== null) {
      return { lat: latitude, lng: longitude };
    }
    return { lat: 31.5204, lng: 74.3587 }; // Default fallback
  };





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

    // Map role to (Viewer and Worker in the database)
    const usertype_id = role === 'provider' ? 1 : 2;

    if (!selectedCity) {
      throw new Error('Please select a city.');
    }
    if (!area) {
      throw new Error('Please select your Area / Sector.');
    }
    if (!houseNumber.trim()) {
      throw new Error('House number is required.');
    }
    if (!/^\d+$/.test(houseNumber.trim())) {
      throw new Error('House number must contain only numbers.');
    }
    if (!streetNumber.trim()) {
      throw new Error('Street number is required.');
    }
    if (!zipCode.trim()) {
      throw new Error('Zip code is required.');
    }
    if (!/^\d+$/.test(zipCode.trim())) {
      throw new Error('Zip code must contain only numbers.');
    }
    if (latitude === null || longitude === null) {
      throw new Error('Pin location / GPS coordinates are required.');
    }
    if (!formattedAddress.trim()) {
      throw new Error('Formatted address is required.');
    }

    console.log('[profile-setup] Resolving location chain...');
    const resolvedLoc = await getOrCreateLocationChain({
      countryName: countryName || 'Pakistan',
      cityName: selectedCity,
      areaName: area,
      houseNumber: houseNumber.trim(),
      streetNumber: streetNumber.trim(),
      latitude: latitude,
      longitude: longitude,
      zipCode: zipCode.trim(),
      formatted_address: formattedAddress.trim(),
    });

    const locationId = resolvedLoc.id;
    if (!locationId) {
      throw new Error('Failed to resolve or create your location profile.');
    }
    console.log('[profile-setup] Resolved Location ID:', locationId);

    const savedPassword = await SecureStore.getItemAsync('pending_signup_password');
    console.log('[SecureStore] Loaded pending signup password string length:', savedPassword ? savedPassword.length : 0);
    const passwordToUse = savedPassword || (params.password as string);

    const newUser = {
      first_name,
      last_name,
      phone_number: user.phoneNumber || '',
      email: email.trim(),
      gender,
      usertype_id: usertype_id,
      location_id: locationId,
      password: passwordToUse,
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

    // Location validation
    if (!selectedCity) {
      setErrorMsg('Please select a city.');
      return;
    }
    if (!area) {
      setErrorMsg('Please select your Area / Sector.');
      return;
    }
    if (!houseNumber.trim()) {
      setErrorMsg('House number is required.');
      return;
    }
    if (!/^\d+$/.test(houseNumber.trim())) {
      setErrorMsg('House number must contain only numbers.');
      return;
    }
    if (!streetNumber.trim()) {
      setErrorMsg('Street number is required.');
      return;
    }
    if (!zipCode.trim()) {
      setErrorMsg('Zip code is required.');
      return;
    }
    if (!/^\d+$/.test(zipCode.trim())) {
      setErrorMsg('Zip code must contain only numbers.');
      return;
    }
    if (latitude === null || longitude === null) {
      setErrorMsg('Pin location / GPS coordinates are required.');
      return;
    }
    if (!formattedAddress.trim()) {
      setErrorMsg('Formatted address is required.');
      return;
    }

    setErrorMsg(null);
    setIsLoading(true);

    try {
      // 1. Call the backend API FIRST to register the user in Postgres
      console.log('[profile-setup] Starting CreateUser chain...');
      const createdUser = await CreateUser();

      // Retrieve the pending signup password before it gets deleted from SecureStore
      const savedPassword = await SecureStore.getItemAsync('pending_signup_password');
      const passwordToUse = savedPassword || (params.password as string);

      // Clean up the temporary password storage
      await SecureStore.deleteItemAsync('pending_signup_password');
      console.log('[SecureStore] Deleted pending signup password');

      // Update local session
      if (createdUser && user) {
        // Extract JWT access and refresh tokens from response payload if present
        let token = (createdUser as any).access || (createdUser as any).access_token || (createdUser as any).token;
        let refreshToken = (createdUser as any).refresh || (createdUser as any).refresh_token;

        // If the registration endpoint didn't return a JWT token (common), log the user in programmatically to get one
        if (!token && createdUser.phone_number && passwordToUse) {
          try {
            console.log('[profile-setup] Registration did not return a JWT token. Programmatically logging in...');
            const loginInfo = await loginUser(createdUser.phone_number, passwordToUse);
            token = (loginInfo as any).access || (loginInfo as any).access_token || (loginInfo as any).token;
            refreshToken = (loginInfo as any).refresh || (loginInfo as any).refresh_token;
            console.log('[profile-setup] Programmatic login complete. Token obtained.');
          } catch (loginErr) {
            console.error('[profile-setup] Programmatic login failed:', loginErr);
          }
        }

        // Automatically verify user account on the backend using the user ID and JWT token
        if (createdUser && createdUser.id) {
          try {
            console.log(`[profile-setup] Auto-verifying new account on backend for User ID: ${createdUser.id}...`);
            await verifyUserOnBackend(createdUser.id, token);
            console.log('[profile-setup] Backend verification complete!');
          } catch (verifyErr) {
            console.error('[profile-setup] Auto-verification on backend failed:', verifyErr);
          }
        }

        const appUser = {
          uid: createdUser.id?.toString() || user.uid,
          displayName: `${createdUser.first_name} ${createdUser.last_name}`.trim(),
          email: createdUser.email,
          phoneNumber: createdUser.phone_number,
          id: createdUser.id,
          first_name: createdUser.first_name,
          last_name: createdUser.last_name,
          gender: createdUser.gender,
          usertype_id: createdUser.usertype_id,
          location_id: createdUser.location_id,
          overall_rating: createdUser.overall_rating ?? user?.overall_rating,
          token: token, // Attach JWT token
          refreshToken: refreshToken, // Attach JWT refresh token
        };
        await login(appUser, passwordToUse);
      }

      console.log('Saved locally / logged profile parameters:', {
        uid: user?.uid,
        email: email.trim(),
        fullName: fullName.trim(),
        phone: user?.phoneNumber,
        city: selectedCity,
        role,
        gender,
        password: params.password,
      });

      console.log('Profile setup saved successfully!');
      // Route based on user type
      if (createdUser && createdUser.usertype_id === USER_TYPE_PRO) {
        router.replace('/(protected)/(pro)/dashboard');
      } else {
        router.replace('/(protected)/(client)/home');
      }
    } catch (err: any) {
      console.error('[profile-setup] Profile setup failed:', err);
      let friendlyMsg = 'Failed to save profile. Please try again.';
      const rawMsg = err?.message || '';

      if (
        rawMsg.includes('timed out') ||
        rawMsg.includes('not responding') ||
        rawMsg.includes('connection error') ||
        rawMsg.includes('could not be reached')
      ) {
        friendlyMsg = rawMsg;
      } else if (
        rawMsg.includes('Status: 5') ||
        rawMsg.includes('500') ||
        rawMsg.includes('504') ||
        rawMsg.includes('502') ||
        rawMsg.includes('5xx') ||
        rawMsg.includes('temporarily busy')
      ) {
        friendlyMsg = 'The server is temporarily busy. Please try again in a few moments.';
      } else if (rawMsg.includes('Failed to create user') || rawMsg.includes('Status:') || rawMsg.includes('Response:')) {
        friendlyMsg = 'Registration failed. The email or phone number might already be in use.';
      } else if (rawMsg.includes('Failed to resolve or create your location profile')) {
        friendlyMsg = 'Location verification failed. Please check your address details.';
      } else if (rawMsg) {
        friendlyMsg = rawMsg;
      }

      setErrorMsg(friendlyMsg);
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
              <View style={{ zIndex: 2000 }}>
                <Pressable
                  style={styles.dropdownTrigger}
                  onPress={() => {
                    setShowCityDropdown(!showCityDropdown);
                    setShowAreaDropdown(false);
                  }}
                >
                  <Text style={selectedCity ? styles.dropdownTextSelected : styles.dropdownTextPlaceholder}>
                    {selectedCity || 'Select City...'}
                  </Text>
                  <Ionicons name={showCityDropdown ? 'chevron-up' : 'chevron-down'} size={20} color="#4B5563" />
                </Pressable>

                {showCityDropdown && (
                  <View style={styles.dropdownList}>
                    <ScrollView nestedScrollEnabled style={{ maxHeight: 180 }}>
                      {countryCities.map((c) => (
                        <Pressable
                          key={c}
                          style={styles.dropdownItem}
                          onPress={() => {
                            setSelectedCity(c);
                            setShowCityDropdown(false);
                            if (errorMsg) setErrorMsg(null);
                          }}
                        >
                          <Text style={styles.dropdownItemText}>{c}</Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>

            {/* Area Selector */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Area / Sector</Text>
              <View style={{ zIndex: 1000 }}>
                <Pressable
                  style={styles.dropdownTrigger}
                  onPress={() => setShowAreaDropdown(!showAreaDropdown)}
                >
                  <Text style={area ? styles.dropdownTextSelected : styles.dropdownTextPlaceholder}>
                    {area || 'Select Area / Sector...'}
                  </Text>
                  <Ionicons name={showAreaDropdown ? 'chevron-up' : 'chevron-down'} size={20} color="#4B5563" />
                </Pressable>

                {showAreaDropdown && (
                  <View style={styles.dropdownList}>
                    <ScrollView nestedScrollEnabled style={{ maxHeight: 180 }}>
                      {cityAreas.map((a, idx) => (
                        <Pressable
                          key={idx}
                          style={styles.dropdownItem}
                          onPress={() => {
                            setArea(a);
                            setShowAreaDropdown(false);
                            if (errorMsg) setErrorMsg(null);
                          }}
                        >
                          <Text style={styles.dropdownItemText}>{a}</Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>

            {/* Formatted Address (Moved upwards under Area for clean flow) */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Formatted Address</Text>
              <View style={styles.inputFieldContainer}>
                <TextInput
                  style={styles.textInput}
                  placeholder="E.g. House 42, Street 3, Phase 5 DHA, Lahore"
                  placeholderTextColor="#9CA3AF"
                  value={formattedAddress}
                  onChangeText={(val) => {
                    setFormattedAddress(val);
                    if (errorMsg) setErrorMsg(null);
                  }}
                />
              </View>
            </View>

            {/* House Number */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>House Number</Text>
              <View style={styles.inputFieldContainer}>
                <TextInput
                  style={styles.textInput}
                  placeholder="E.g. 42"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  value={houseNumber}
                  onChangeText={(val) => {
                    setHouseNumber(val.replace(/[^0-9]/g, ''));
                    if (errorMsg) setErrorMsg(null);
                  }}
                />
              </View>
            </View>

            {/* Street Number */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Street Number</Text>
              <View style={styles.inputFieldContainer}>
                <TextInput
                  style={styles.textInput}
                  placeholder="E.g. Street 5"
                  placeholderTextColor="#9CA3AF"
                  value={streetNumber}
                  onChangeText={(val) => {
                    setStreetNumber(val);
                    if (errorMsg) setErrorMsg(null);
                  }}
                />
              </View>
            </View>

            {/* Zip Code */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Zip Code</Text>
              <View style={styles.inputFieldContainer}>
                <TextInput
                  style={styles.textInput}
                  placeholder="E.g. 54000"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  value={zipCode}
                  onChangeText={(val) => {
                    setZipCode(val.replace(/[^0-9]/g, ''));
                    if (errorMsg) setErrorMsg(null);
                  }}
                />
              </View>
            </View>

            {/* Pin Location / GPS Coordinates */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Pin Location / GPS Coordinates</Text>
              <View style={styles.gpsRow}>
                <TextInput
                  style={[styles.textInput, styles.inputFieldContainer, { flex: 1, marginRight: 8, backgroundColor: '#F3F4F6', color: '#4B5563', paddingHorizontal: 8 }]}
                  placeholder="Lat"
                  placeholderTextColor="#9CA3AF"
                  editable={false}
                  value={latitude !== null ? latitude.toFixed(6) : ''}
                />
                <TextInput
                  style={[styles.textInput, styles.inputFieldContainer, { flex: 1, marginRight: 8, backgroundColor: '#F3F4F6', color: '#4B5563', paddingHorizontal: 8 }]}
                  placeholder="Lng"
                  placeholderTextColor="#9CA3AF"
                  editable={false}
                  value={longitude !== null ? longitude.toFixed(6) : ''}
                />
                <Pressable
                  style={styles.mapTriggerBtn}
                  onPress={() => setShowMapPicker(true)}
                >
                  <Ionicons name="map-outline" size={20} color="#FFFFFF" />
                </Pressable>
                <Pressable
                  style={[styles.gpsBtnSquare, loadingGps && styles.gpsBtnLoading]}
                  onPress={() => fetchGpsLocation(false)}
                  disabled={loadingGps}
                >
                  {loadingGps ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Ionicons name="locate-outline" size={20} color="#FFFFFF" />
                  )}
                </Pressable>
              </View>
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

      {/* WebView Map Picker Modal (Premium Sticky Center Pin Design) */}
      <Modal visible={showMapPicker} animationType="slide" onRequestClose={() => setShowMapPicker(false)}>
        <View style={styles.mapModalContainer}>
          {/* Full Screen Adjuster Map */}
          <WebView
            ref={mapWebViewRef}
            style={styles.mapWebview}
            source={{ html: getLeafletHtml(getInitialCoords().lat, getInitialCoords().lng) }}
            onMessage={handleMapModalMessage}
            scrollEnabled={false}
            overScrollMode="never"
          />

          {/* Centered marker overlay */}
          <View style={styles.mapPinContainer} pointerEvents="none">
            <Ionicons name="location" size={44} color="#EF4444" style={styles.mapPinIcon} />
          </View>

          {/* Top Header floating banner (Safe Area Resilient) */}
          <View style={[styles.mapHeader, { top: insets.top > 0 ? insets.top + 10 : 20 }]}>
            <Pressable onPress={() => setShowMapPicker(false)} style={styles.mapBackBtn}>
              <Ionicons name="arrow-back" size={24} color="#111827" />
            </Pressable>
            <Text style={styles.mapHeaderTitle}>Select your location</Text>
            <View style={{ width: 32 }} />
          </View>

          {/* Floating locate button inside map */}
          <View style={styles.mapLocateBtn}>
            <Pressable onPress={reCenterMapPicker} style={styles.mapLocateBtnPressable}>
              <Ionicons name="locate" size={24} color="#10B981" />
            </Pressable>
          </View>

          {/* Bottom address confirmation card */}
          <View style={[styles.mapBottomCard, { paddingBottom: insets.bottom > 0 ? insets.bottom + 16 : 24 }]}>
            <Text style={styles.mapCardTitle}>PINPOINT LOCATION</Text>
            <View style={styles.mapAddressRow}>
              <Ionicons name="flag" size={20} color="#111827" style={{ marginRight: 10 }} />
              <Text style={styles.mapAddressText} numberOfLines={2}>
                {mapAddress || 'Loading address...'}
              </Text>
            </View>

            <Pressable
              style={styles.mapDoneBtn}
              onPress={confirmSelectedMapLocation}
            >
              <Text style={styles.mapDoneBtnText}>Confirm Location</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    height: 52,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
  },
  dropdownTextPlaceholder: {
    color: '#9CA3AF',
    fontSize: 15,
    fontWeight: '500',
  },
  dropdownTextSelected: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '500',
  },
  dropdownList: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    maxHeight: 200,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemText: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
  },
  gpsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  gpsControlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 16,
    gap: 12,
  },
  gpsMapButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#10B981',
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  gpsLocateButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#0B5A3E',
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  gpsButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  mapModalContainer: {
    flex: 1,
    position: 'relative',
  },
  mapWebview: {
    flex: 1,
  },
  mapPinContainer: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    marginLeft: -22,
    marginTop: -44,
    zIndex: 3,
  },
  mapPinIcon: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  mapHeader: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 6,
    zIndex: 5,
  },
  mapBackBtn: {
    padding: 4,
  },
  mapHeaderTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  mapBottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 12,
    zIndex: 5,
  },
  mapCardTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 1,
    marginBottom: 12,
  },
  mapAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  mapAddressText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 20,
  },
  mapDoneBtn: {
    backgroundColor: '#0B5A3E',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  mapDoneBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  mapLocateBtn: {
    position: 'absolute',
    right: 16,
    bottom: 215,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 6,
    zIndex: 5,
  },
  mapLocateBtnPressable: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapTriggerBtn: {
    backgroundColor: '#10B981',
    height: 52,
    width: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  gpsBtnSquare: {
    backgroundColor: '#0B5A3E',
    height: 52,
    width: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  gpsBtnLoading: {
    opacity: 0.7,
  },
});
