import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../../provider/auth';
import { getLocationById, UserLocation } from '../../../api/location';
import * as Location from 'expo-location';
import { WebView } from 'react-native-webview';

import DateTimePicker from '@react-native-community/datetimepicker';

const { width } = Dimensions.get('window');

const formatDate = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const parseDateString = (dateStr: string): Date => {
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  return new Date();
};

const getLeafletHtml = (initialLat: number, initialLng: number) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    #map { height: 100vh; width: 100vw; z-index: 1; }
    .search-container {
      position: absolute;
      top: 10px;
      left: 10px;
      right: 10px;
      z-index: 1000;
      background: white;
      padding: 6px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      display: flex;
      gap: 6px;
    }
    .search-input {
      flex: 1;
      padding: 10px 14px;
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      font-size: 14px;
      outline: none;
    }
    .search-btn {
      background: #082C18;
      color: white;
      border: none;
      padding: 10px 16px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: bold;
      cursor: pointer;
    }
    .confirm-btn-container {
      position: absolute;
      bottom: 20px;
      left: 20px;
      right: 20px;
      z-index: 1000;
    }
    .confirm-btn {
      background: #10B981;
      color: white;
      border: none;
      padding: 14px;
      border-radius: 12px;
      font-size: 16px;
      font-weight: bold;
      width: 100%;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
      cursor: pointer;
      text-align: center;
    }
    .confirm-btn:active {
      background: #059669;
    }
  </style>
</head>
<body>
  <div class="search-container">
    <input type="text" id="search-input" class="search-input" placeholder="Search place or address..." />
    <button onclick="searchPlace()" class="search-btn">Search</button>
  </div>
  <div id="map"></div>
  <div class="confirm-btn-container">
    <button onclick="confirmLocation()" class="confirm-btn">Confirm Selected Location</button>
  </div>

  <script>
    var map = L.map('map', { zoomControl: false }).setView([${initialLat}, ${initialLng}], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    var marker = L.marker([${initialLat}, ${initialLng}], { draggable: true }).addTo(map);
    var selectedCoords = { lat: ${initialLat}, lng: ${initialLng} };

    function updateCoords(lat, lng) {
      selectedCoords.lat = lat;
      selectedCoords.lng = lng;
    }

    marker.on('dragend', function (e) {
      var pos = marker.getLatLng();
      updateCoords(pos.lat, pos.lng);
    });

    map.on('click', function (e) {
      marker.setLatLng(e.latlng);
      updateCoords(e.latlng.lat, e.latlng.lng);
    });

    function searchPlace() {
      var query = document.getElementById('search-input').value;
      if (!query) return;
      
      fetch('https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(query))
        .then(function(response) { return response.json(); })
        .then(function(data) {
          if (data && data.length > 0) {
            var first = data[0];
            var lat = parseFloat(first.lat);
            var lon = parseFloat(first.lon);
            var latlng = [lat, lon];
            map.setView(latlng, 16);
            marker.setLatLng(latlng);
            updateCoords(lat, lon);
          } else {
            alert('Place not found. Try another search query.');
          }
        })
        .catch(function(err) {
          console.error(err);
          alert('Error searching for place. Please try again.');
        });
    }

    function confirmLocation() {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'LOCATION_SELECTED',
          lat: selectedCoords.lat,
          lng: selectedCoords.lng
        }));
      }
    }
  </script>
</body>
</html>
`;

interface PostJobModalProps {
  visible: boolean;
  onClose: () => void;
  initialCategory?: string;
  onSuccess: (jobDetails: any) => void;
}

const POST_CATEGORIES = [
  { name: 'Electrician', icon: 'flash', color: '#F97316' },
  { name: 'Plumber', icon: 'build', color: '#A855F7' },
  { name: 'AC Service', icon: 'snow', color: '#3B82F6' },
  { name: 'Tutor', icon: 'school', color: '#10B981' },
  { name: 'Mehndi', icon: 'leaf', color: '#84CC16' },
  { name: 'Cleaning', icon: 'sparkles', color: '#EAB308' },
  { name: 'Painter', icon: 'brush', color: '#EC4899' },
  { name: 'Mason', icon: 'construct', color: '#EF4444' },
  { name: 'Generator/UPS', icon: 'options', color: '#6366F1' },
  { name: 'Car Detailing', icon: 'car', color: '#06B6D4' },
  { name: 'Event Setup', icon: 'color-palette', color: '#F43F5E' },
  { name: 'Driver', icon: 'navigate', color: '#14B8A6' },
];

import { COUNTRY_DATA, getCountryFromPhone } from '../../constants/locationData';

const postJobSchema = z.object({
  category: z.string().min(1, { message: 'Please select a category' }),
  description: z.string().min(5, { message: 'Description must be at least 5 characters long' }),
  useSavedLocation: z.boolean(),
  city: z.string().optional(),
  area: z.string().optional(),
  houseNumber: z.string().optional(),
  streetNumber: z.string().optional(),
  zipCode: z.string().optional(),
  pinLocation: z.string().optional(),
  landmark: z.string().optional(),
  budget: z.string()
    .min(1, { message: 'Please specify your budget' })
    .refine(val => !isNaN(Number(val)) && Number(val) > 0, { message: 'Budget must be a positive number' }),
  date: z.string().min(1, { message: 'Preferred date is required' }),
  paymentPref: z.string().min(1, { message: 'Payment preference is required' }),
}).superRefine((val, ctx) => {
  if (!val.useSavedLocation) {
    if (!val.city || val.city.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'City is required',
        path: ['city'],
      });
    }
    if (!val.area || val.area.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Area is required',
        path: ['area'],
      });
    }
    if (!val.houseNumber || val.houseNumber.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'House number is required',
        path: ['houseNumber'],
      });
    } else if (!/^\d+$/.test(val.houseNumber.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'House number must contain only numbers',
        path: ['houseNumber'],
      });
    }
    if (!val.streetNumber || val.streetNumber.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Street number is required',
        path: ['streetNumber'],
      });
    }
    if (!val.zipCode || val.zipCode.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Zip code is required',
        path: ['zipCode'],
      });
    } else if (!/^\d+$/.test(val.zipCode.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Zip code must contain only numbers',
        path: ['zipCode'],
      });
    }
    if (!val.pinLocation || val.pinLocation.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Pin location is required',
        path: ['pinLocation'],
      });
    }
  }
});

type PostJobFormData = z.infer<typeof postJobSchema>;

export default function PostJobModal({
  visible,
  onClose,
  initialCategory,
  onSuccess,
}: PostJobModalProps) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(1);
  const [showAreaDropdown, setShowAreaDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [postedSuccess, setPostedSuccess] = useState(false);
  const [loadingGps, setLoadingGps] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);

  const { user } = useAuth();
  const country = getCountryFromPhone(user?.phoneNumber);
  const countryCities = COUNTRY_DATA[country]?.cities || COUNTRY_DATA['Pakistan'].cities;
  const defaultCity = countryCities[0] || '';

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
    reset,
  } = useForm<PostJobFormData>({
    resolver: zodResolver(postJobSchema),
    defaultValues: {
      category: initialCategory || '',
      description: '',
      useSavedLocation: false,
      city: defaultCity,
      area: '',
      houseNumber: '',
      streetNumber: '',
      zipCode: '',
      pinLocation: '',
      landmark: '',
      budget: '',
      date: '',
      paymentPref: 'Cash on Service',
    },
  });

  const watchedCategory = watch('category');
  const watchedDescription = watch('description');
  const watchedUseSavedLocation = watch('useSavedLocation');
  const watchedCity = watch('city');
  const watchedArea = watch('area');
  const watchedHouseNumber = watch('houseNumber');
  const watchedStreetNumber = watch('streetNumber');
  const watchedZipCode = watch('zipCode');
  const watchedPinLocation = watch('pinLocation');
  const watchedLandmark = watch('landmark');
  const watchedBudget = watch('budget');
  const watchedDate = watch('date');
  const watchedPaymentPref = watch('paymentPref');

  const cityAreas = watchedCity
    ? (COUNTRY_DATA[country]?.areas[watchedCity] || [])
    : [];

  const [savedLocationDetails, setSavedLocationDetails] = useState<UserLocation | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);

  useEffect(() => {
    if (visible && user?.location_id) {
      setLoadingLocation(true);
      getLocationById(user.location_id)
        .then((loc) => {
          setSavedLocationDetails(loc);
          setValue('useSavedLocation', true); // Default to saved location if available
        })
        .catch((err) => {
          console.error('Failed to load saved location:', err);
          setValue('useSavedLocation', false);
        })
        .finally(() => {
          setLoadingLocation(false);
        });
    } else {
      setValue('useSavedLocation', false);
      setSavedLocationDetails(null);
    }
  }, [visible, user?.location_id, setValue]);

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
      let loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setValue('pinLocation', `${loc.coords.latitude}, ${loc.coords.longitude}`, { shouldValidate: true });
    } catch (err: any) {
      if (!silent) {
        Alert.alert('GPS Error', 'Failed to retrieve your current location.');
      }
      console.error(err);
    } finally {
      setLoadingGps(false);
    }
  };

  useEffect(() => {
    if (visible && !watchedUseSavedLocation && !watchedPinLocation) {
      fetchGpsLocation(true);
    }
  }, [visible, watchedUseSavedLocation]);

  const getInitialCoords = () => {
    if (watchedPinLocation) {
      const parts = watchedPinLocation.split(',');
      if (parts.length === 2) {
        const lat = parseFloat(parts[0].trim());
        const lng = parseFloat(parts[1].trim());
        if (!isNaN(lat) && !isNaN(lng)) {
          return { lat, lng };
        }
      }
    }
    return { lat: 31.5204, lng: 74.3587 }; // Default fallback (Lahore)
  };

  const handleMapMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'LOCATION_SELECTED') {
        setValue('pinLocation', `${data.lat.toFixed(6)}, ${data.lng.toFixed(6)}`, { shouldValidate: true });
        setShowMapPicker(false);
      }
    } catch (err) {
      console.error('Failed to parse WebView message:', err);
    }
  };

  // Reset area when city changes
  useEffect(() => {
    setValue('area', '');
  }, [watchedCity, setValue]);

  // Update category if initialCategory changes
  useEffect(() => {
    if (initialCategory) {
      setValue('category', initialCategory);
    }
  }, [initialCategory, setValue]);

  // Update default city if user's country is loaded/changed
  useEffect(() => {
    if (user) {
      setValue('city', defaultCity);
    }
  }, [user, defaultCity, setValue]);

  // Reset form when modal closes or opens
  const handleReset = () => {
    setStep(1);
    reset({
      category: initialCategory || '',
      description: '',
      useSavedLocation: !!user?.location_id,
      city: defaultCity,
      area: '',
      houseNumber: '',
      streetNumber: '',
      zipCode: '',
      pinLocation: '',
      landmark: '',
      budget: '',
      date: '',
      paymentPref: 'Cash on Service',
    });
    setPostedSuccess(false);
    setShowCityDropdown(false);
    setShowAreaDropdown(false);
    setShowDatePicker(false);
  };

  const handleNext = async () => {
    if (step === 1) {
      const isValid = await trigger(['category', 'description']);
      if (isValid) {
        setStep(2);
      }
    } else if (step === 2) {
      const fieldsToValidate: any[] = ['budget', 'date'];
      if (!watchedUseSavedLocation) {
        fieldsToValidate.push('city', 'area', 'houseNumber', 'streetNumber', 'zipCode', 'pinLocation');
      }
      const isValid = await trigger(fieldsToValidate);
      if (isValid) {
        setStep(3);
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      onClose();
      handleReset();
    }
  };

  const handlePostJob = handleSubmit((data) => {
    setPostedSuccess(true);
    setTimeout(() => {
      onSuccess({
        category: data.category,
        description: data.description,
        useSavedLocation: data.useSavedLocation,
        locationId: user?.location_id,
        city: data.city,
        area: data.area,
        landmark: data.landmark,
        houseNumber: data.houseNumber,
        streetNumber: data.streetNumber,
        zipCode: data.zipCode,
        pinLocation: data.pinLocation,
        budget: data.budget,
        date: data.date,
        paymentPreference: data.paymentPref,
        country: country,
      });
      handleReset();
      onClose();
    }, 2000);
  });

  const isStep1Valid = watchedCategory !== '' && watchedDescription.trim().length >= 5;
  const isStep2Valid = watchedBudget.trim() !== '' && watchedDate.trim() !== '' && (
    watchedUseSavedLocation
      ? (savedLocationDetails !== null)
      : (watchedCity !== '' && watchedArea !== '' && (watchedHouseNumber || '').trim() !== '' && (watchedStreetNumber || '').trim() !== '' && (watchedZipCode || '').trim() !== '' && (watchedPinLocation || '').trim() !== '')
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {postedSuccess ? (
          <View style={styles.successOverlay}>
            <View style={styles.successIconCircle}>
              <Ionicons name="checkmark" size={60} color="#FFFFFF" />
            </View>
            <Text style={styles.successTitle}>Job Posted Successfully!</Text>
            <Text style={styles.successSub}>
              KaamKarwao pros will respond to your request within 10 minutes.
            </Text>
            <ActivityIndicator size="small" color="#FFFFFF" style={{ marginTop: 20 }} />
          </View>
        ) : (
          <>
            {/* Header */}
            <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
              <View style={styles.headerRow}>
                <Pressable onPress={handleBack} style={styles.backBtn}>
                  <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </Pressable>
                <Text style={styles.headerTitle}>Post a Job</Text>
                <View style={{ width: 24 }} />
              </View>

              {/* Progress Line Bar */}
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${(step / 3) * 100}%` },
                  ]}
                />
              </View>
              <Text style={styles.stepText}>Step {step} of 3</Text>
            </View>

            {/* Scrollable Form Content */}
            <ScrollView
              style={styles.formContent}
              contentContainerStyle={{ paddingBottom: 40 }}
              keyboardShouldPersistTaps="handled"
            >
              {/* STEP 1 */}
              {step === 1 && (
                <View>
                  <Text style={styles.sectionHeading}>What do you need fixed?</Text>

                  {/* Categories Selector Grid */}
                  <Controller
                    control={control}
                    name="category"
                    render={({ field: { onChange, value } }) => (
                      <View style={styles.categoriesGrid}>
                        {POST_CATEGORIES.map((cat, idx) => {
                          const isSelected = value === cat.name;
                          return (
                            <Pressable
                              key={idx}
                              style={[
                                styles.categoryCard,
                                isSelected ? styles.categoryCardActive : styles.categoryCardInactive,
                              ]}
                              onPress={() => onChange(cat.name)}
                            >
                              <Ionicons
                                name={cat.icon as any}
                                size={24}
                                color={isSelected ? '#FFFFFF' : cat.color}
                                style={{ marginBottom: 6 }}
                              />
                              <Text
                                style={[
                                  styles.categoryLabel,
                                  isSelected ? styles.categoryLabelActive : styles.categoryLabelInactive,
                                ]}
                              >
                                {cat.name}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    )}
                  />
                  {errors.category && (
                    <Text style={styles.errorText}>{errors.category.message}</Text>
                  )}

                  {/* Describe the Job */}
                  <Text style={styles.inputLabel}>Describe the job</Text>
                  <Controller
                    control={control}
                    name="description"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        style={[styles.textArea, errors.description && styles.inputError]}
                        multiline
                        numberOfLines={4}
                        placeholder="E.g. Need to fix a leaking pipe under the kitchen sink..."
                        placeholderTextColor="#9CA3AF"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        textAlignVertical="top"
                      />
                    )}
                  />
                  {errors.description && (
                    <Text style={styles.errorText}>{errors.description.message}</Text>
                  )}
                </View>
              )}

              {/* STEP 2 */}
              {step === 2 && (
                <View>
                  {/* Location Options Selector */}
                  {user?.location_id ? (
                    <View style={styles.locationSelectorContainer}>
                      <Text style={styles.inputLabel}>Choose Location Option</Text>
                      <View style={styles.tabContainer}>
                        <Pressable
                          style={[
                            styles.tabButton,
                            watchedUseSavedLocation && styles.tabButtonActive,
                          ]}
                          onPress={() => setValue('useSavedLocation', true)}
                        >
                          <Ionicons
                            name="bookmark-outline"
                            size={16}
                            color={watchedUseSavedLocation ? '#FFFFFF' : '#374151'}
                            style={{ marginRight: 6 }}
                          />
                          <Text
                            style={[
                              styles.tabButtonText,
                              watchedUseSavedLocation && styles.tabButtonTextActive,
                            ]}
                          >
                            Saved Location
                          </Text>
                        </Pressable>
                        <Pressable
                          style={[
                            styles.tabButton,
                            !watchedUseSavedLocation && styles.tabButtonActive,
                          ]}
                          onPress={() => setValue('useSavedLocation', false)}
                        >
                          <Ionicons
                            name="map-outline"
                            size={16}
                            color={!watchedUseSavedLocation ? '#FFFFFF' : '#374151'}
                            style={{ marginRight: 6 }}
                          />
                          <Text
                            style={[
                              styles.tabButtonText,
                              !watchedUseSavedLocation && styles.tabButtonTextActive,
                            ]}
                          >
                            New Address
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : null}

                  {watchedUseSavedLocation && user?.location_id ? (
                    <View style={styles.savedLocationCard}>
                      <View style={styles.savedLocationHeader}>
                        <Ionicons name="location" size={20} color="#10B981" style={{ marginRight: 8 }} />
                        <Text style={styles.savedLocationTitle}>Your Saved Location</Text>
                      </View>
                      {loadingLocation ? (
                        <ActivityIndicator size="small" color="#10B981" style={{ marginVertical: 10 }} />
                      ) : savedLocationDetails ? (
                        <Text style={styles.savedLocationAddress}>
                          {((loc) => {
                            const getCityName = (loc: any) => {
                              if (!loc) return '';
                              if (typeof loc.city === 'object') return loc.city?.name || '';
                              if (loc.city_name) return loc.city_name;
                              return `City ID: ${loc.city_id || loc.city || ''}`;
                            };
                            const getAreaName = (loc: any) => {
                              if (!loc) return '';
                              if (typeof loc.area === 'object') return loc.area?.name || '';
                              if (loc.area_name) return loc.area_name;
                              return `Area ID: ${loc.area_id || loc.area || ''}`;
                            };
                            const parts = [
                              loc.house_number ? `House ${loc.house_number}` : null,
                              loc.street_number ? `Street ${loc.street_number}` : null,
                              loc.landmark ? `Landmark: ${loc.landmark}` : null,
                              getAreaName(loc),
                              getCityName(loc),
                              loc.zip_code ? `Zip: ${loc.zip_code}` : null,
                            ].filter(Boolean);
                            return parts.join(', ');
                          })(savedLocationDetails)}
                        </Text>
                      ) : (
                        <Text style={styles.savedLocationError}>
                          Failed to load saved location. Please enter address manually.
                        </Text>
                      )}
                    </View>
                  ) : (
                    <View>
                      {/* City Selection */}
                      <Text style={styles.inputLabel}>City</Text>
                      <Controller
                        control={control}
                        name="city"
                        render={({ field: { onChange, value } }) => (
                          <View style={{ zIndex: 2000 }}>
                            <Pressable
                              style={[styles.dropdownTrigger, errors.city && styles.inputError]}
                              onPress={() => setShowCityDropdown(!showCityDropdown)}
                            >
                              <Text style={value ? styles.dropdownTextSelected : styles.dropdownTextPlaceholder}>
                                {value || 'Select City...'}
                              </Text>
                              <Ionicons name={showCityDropdown ? 'chevron-up' : 'chevron-down'} size={20} color="#4B5563" />
                            </Pressable>

                            {showCityDropdown && (
                              <View style={styles.dropdownList}>
                                <ScrollView nestedScrollEnabled style={{ maxHeight: 180 }}>
                                  {countryCities.map((city, idx) => (
                                    <Pressable
                                      key={idx}
                                      style={styles.dropdownItem}
                                      onPress={() => {
                                        onChange(city);
                                        setShowCityDropdown(false);
                                      }}
                                    >
                                      <Text style={styles.dropdownItemText}>{city}</Text>
                                    </Pressable>
                                  ))}
                                </ScrollView>
                              </View>
                            )}
                          </View>
                        )}
                      />
                      {errors.city && (
                        <Text style={styles.errorText}>{errors.city.message}</Text>
                      )}

                      {/* Area / Sector Select */}
                      <Text style={styles.inputLabel}>Area / Sector</Text>
                      <Controller
                        control={control}
                        name="area"
                        render={({ field: { onChange, value } }) => (
                          <View style={{ zIndex: 1000 }}>
                            <Pressable
                              style={[styles.dropdownTrigger, errors.area && styles.inputError]}
                              onPress={() => setShowAreaDropdown(!showAreaDropdown)}
                            >
                              <Text style={value ? styles.dropdownTextSelected : styles.dropdownTextPlaceholder}>
                                {value || 'Area / Sector...'}
                              </Text>
                              <Ionicons name={showAreaDropdown ? 'chevron-up' : 'chevron-down'} size={20} color="#4B5563" />
                            </Pressable>

                            {showAreaDropdown && (
                              <View style={styles.dropdownList}>
                                <ScrollView nestedScrollEnabled style={{ maxHeight: 180 }}>
                                  {cityAreas.map((area, idx) => (
                                    <Pressable
                                      key={idx}
                                      style={styles.dropdownItem}
                                      onPress={() => {
                                        onChange(area);
                                        setShowAreaDropdown(false);
                                      }}
                                    >
                                      <Text style={styles.dropdownItemText}>{area}</Text>
                                    </Pressable>
                                  ))}
                                </ScrollView>
                              </View>
                            )}
                          </View>
                        )}
                      />
                      {errors.area && (
                        <Text style={styles.errorText}>{errors.area.message}</Text>
                      )}

                      {/* House Number */}
                      <Text style={styles.inputLabel}>House Number</Text>
                      <Controller
                        control={control}
                        name="houseNumber"
                        render={({ field: { onChange, onBlur, value } }) => (
                          <TextInput
                            style={[styles.textInput, errors.houseNumber && styles.inputError]}
                            placeholder="E.g. 42-A"
                            placeholderTextColor="#9CA3AF"
                            value={value}
                            onChangeText={onChange}
                            onBlur={onBlur}
                            keyboardType='numeric'
                          />
                        )}
                      />
                      {errors.houseNumber && (
                        <Text style={styles.errorText}>{errors.houseNumber.message}</Text>
                      )}

                      {/* Street Number */}
                      <Text style={styles.inputLabel}>Street Number</Text>
                      <Controller
                        control={control}
                        name="streetNumber"
                        render={({ field: { onChange, onBlur, value } }) => (
                          <TextInput
                            style={[styles.textInput, errors.streetNumber && styles.inputError]}
                            placeholder="E.g. Street 5"
                            placeholderTextColor="#9CA3AF"
                            value={value}
                            onChangeText={onChange}
                            onBlur={onBlur}
                          />
                        )}
                      />
                      {errors.streetNumber && (
                        <Text style={styles.errorText}>{errors.streetNumber.message}</Text>
                      )}

                      {/* Zip Code */}
                      <Text style={styles.inputLabel}>Zip Code</Text>
                      <Controller
                        control={control}
                        name="zipCode"
                        render={({ field: { onChange, onBlur, value } }) => (
                          <TextInput
                            style={[styles.textInput, errors.zipCode && styles.inputError]}
                            placeholder="E.g. 54000"
                            placeholderTextColor="#9CA3AF"
                            keyboardType="numeric"
                            value={value}
                            onChangeText={onChange}
                            onBlur={onBlur}
                          />
                        )}
                      />
                      {errors.zipCode && (
                        <Text style={styles.errorText}>{errors.zipCode.message}</Text>
                      )}

                      {/* Pin Location */}
                      <Text style={styles.inputLabel}>Pin Location / GPS Coordinates</Text>
                      <Controller
                        control={control}
                        name="pinLocation"
                        render={({ field: { onChange, value } }) => (
                          <View style={styles.gpsRow}>
                            <TextInput
                              style={[styles.textInput, { flex: 1 }, errors.pinLocation && styles.inputError]}
                              placeholder="E.g. 31.5204, 74.3587"
                              placeholderTextColor="#9CA3AF"
                              value={value}
                              onChangeText={onChange}
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
                        )}
                      />
                      {errors.pinLocation && (
                        <Text style={styles.errorText}>{errors.pinLocation.message}</Text>
                      )}

                      {/* Nearest Landmark */}
                      <Text style={styles.inputLabel}>Nearest Landmark (Optional)</Text>
                      <Controller
                        control={control}
                        name="landmark"
                        render={({ field: { onChange, onBlur, value } }) => (
                          <TextInput
                            style={styles.textInput}
                            placeholder="E.g. Near Al-Fatah supermarket, DHA"
                            placeholderTextColor="#9CA3AF"
                            value={value}
                            onChangeText={onChange}
                            onBlur={onBlur}
                          />
                        )}
                      />
                    </View>
                  )}

                  {/* Budget */}
                  <Text style={styles.inputLabel}>Your Budget (PKR)</Text>
                  <Controller
                    control={control}
                    name="budget"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        style={[styles.textInput, errors.budget && styles.inputError]}
                        placeholder="Rs. 5,000"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="numeric"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                      />
                    )}
                  />
                  {errors.budget && (
                    <Text style={styles.errorText}>{errors.budget.message}</Text>
                  )}

                  {/* Preferred Date */}
                  <Text style={styles.inputLabel}>Preferred Date</Text>
                  <Controller
                    control={control}
                    name="date"
                    render={({ field: { onChange, value } }) => {
                      const dateValue = value ? parseDateString(value) : new Date();

                      return (
                        <View>
                          <Pressable
                            style={[styles.dropdownTrigger, errors.date && styles.inputError]}
                            onPress={() => setShowDatePicker(!showDatePicker)}
                          >
                            <Text style={value ? styles.dropdownTextSelected : styles.dropdownTextPlaceholder}>
                              {value || 'Select Date...'}
                            </Text>
                            <Ionicons name="calendar-outline" size={20} color="#4B5563" />
                          </Pressable>

                          {showDatePicker && (
                            <View style={{ marginTop: 10 }}>
                              <DateTimePicker
                                value={dateValue}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                                minimumDate={new Date()}
                                onChange={(event, selectedDate) => {
                                  if (Platform.OS === 'android') {
                                    setShowDatePicker(false);
                                  }
                                  if (selectedDate) {
                                    const formatted = formatDate(selectedDate);
                                    onChange(formatted);
                                  }
                                }}
                              />
                              {Platform.OS === 'ios' && (
                                <Pressable
                                  style={styles.iosDoneBtn}
                                  onPress={() => setShowDatePicker(false)}
                                >
                                  <Text style={styles.iosDoneBtnText}>Done</Text>
                                </Pressable>
                              )}
                            </View>
                          )}
                        </View>
                      );
                    }}
                  />
                  {errors.date && (
                    <Text style={styles.errorText}>{errors.date.message}</Text>
                  )}
                </View>
              )}

              {/* STEP 3 */}
              {step === 3 && (
                <View>
                  <Text style={styles.sectionHeading}>Review & Post</Text>

                  {/* Summary Card */}
                  <View style={styles.reviewCard}>
                    <View style={styles.reviewRow}>
                      <Text style={styles.reviewLabel}>Category</Text>
                      <Text style={styles.reviewValue}>{watchedCategory}</Text>
                    </View>
                    <View style={styles.reviewDivider} />

                    <View style={styles.reviewRow}>
                      <Text style={styles.reviewLabel}>Location</Text>
                      <Text style={styles.reviewValue}>
                        {watchedUseSavedLocation
                          ? (savedLocationDetails
                            ? ((loc) => {
                              const getCityName = (loc: any) => {
                                if (!loc) return '';
                                if (typeof loc.city === 'object') return loc.city?.name || '';
                                if (loc.city_name) return loc.city_name;
                                return `City ID: ${loc.city_id || loc.city || ''}`;
                              };
                              const getAreaName = (loc: any) => {
                                if (!loc) return '';
                                if (typeof loc.area === 'object') return loc.area?.name || '';
                                if (loc.area_name) return loc.area_name;
                                return `Area ID: ${loc.area_id || loc.area || ''}`;
                              };
                              const parts = [
                                loc.house_number ? `House ${loc.house_number}` : null,
                                loc.street_number ? `Street ${loc.street_number}` : null,
                                getAreaName(loc),
                                getCityName(loc),
                              ].filter(Boolean);
                              return parts.join(', ');
                            })(savedLocationDetails)
                            : 'Saved Location')
                          : `${watchedHouseNumber ? `House ${watchedHouseNumber}, ` : ''}${watchedStreetNumber ? `Street ${watchedStreetNumber}, ` : ''}${watchedArea}, ${watchedCity}`}
                      </Text>
                    </View>
                    <View style={styles.reviewDivider} />

                    <View style={styles.reviewRow}>
                      <Text style={styles.reviewLabel}>Landmark</Text>
                      <Text style={styles.reviewValue}>
                        {watchedUseSavedLocation
                          ? (savedLocationDetails?.landmark || 'None')
                          : (watchedLandmark || 'None')}
                      </Text>
                    </View>
                    <View style={styles.reviewDivider} />

                    <View style={styles.reviewRow}>
                      <Text style={styles.reviewLabel}>Budget</Text>
                      <Text style={styles.reviewValue}>Rs. {watchedBudget}</Text>
                    </View>
                    <View style={styles.reviewDivider} />

                    <View style={styles.reviewRow}>
                      <Text style={styles.reviewLabel}>Date</Text>
                      <Text style={styles.reviewValue}>{watchedDate}</Text>
                    </View>
                  </View>

                  {/* Payment Preference */}
                  <Text style={styles.inputLabel}>Payment Preference</Text>
                  <Controller
                    control={control}
                    name="paymentPref"
                    render={({ field: { onChange, value } }) => (
                      <View style={styles.paymentGrid}>
                        {[
                          { name: 'Cash on Service', icon: 'cash-outline' },
                          { name: 'JazzCash', icon: 'phone-portrait-outline' },
                          { name: 'Easypaisa', icon: 'wallet-outline' },
                          { name: 'Bank Transfer', icon: 'business-outline' },
                        ].map((payment) => {
                          const isSelected = value === payment.name;
                          return (
                            <Pressable
                              key={payment.name}
                              style={[
                                styles.paymentCard,
                                isSelected ? styles.paymentCardActive : styles.paymentCardInactive,
                              ]}
                              onPress={() => onChange(payment.name)}
                            >
                              <Ionicons
                                name={payment.icon as any}
                                size={20}
                                color={isSelected ? '#10B981' : '#4B5563'}
                                style={{ marginRight: 8 }}
                              />
                              <Text
                                style={[
                                  styles.paymentLabel,
                                  isSelected ? styles.paymentLabelActive : styles.paymentLabelInactive,
                                ]}
                              >
                                {payment.name}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    )}
                  />

                  {/* Info Shield Banner */}
                  <View style={styles.infoBanner}>
                    <Ionicons
                      name="shield-checkmark-outline"
                      size={20}
                      color="#10B981"
                      style={{ marginRight: 10 }}
                    />
                    <Text style={styles.infoBannerText}>
                      Your job will be shown to KaamKarwao Verified pros who respond within 10 minutes.
                      Only pay after the job is done.
                    </Text>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Bottom Button Row */}
            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
              {step < 3 ? (
                <Pressable
                  style={[
                    styles.nextBtn,
                    step === 1 && !isStep1Valid && styles.btnDisabled,
                    step === 2 && !isStep2Valid && styles.btnDisabled,
                  ]}
                  disabled={(step === 1 && !isStep1Valid) || (step === 2 && !isStep2Valid)}
                  onPress={handleNext}
                >
                  <Text style={styles.btnText}>Next →</Text>
                </Pressable>
              ) : (
                <Pressable style={styles.postBtn} onPress={handlePostJob}>
                  <Text style={styles.btnText}>Post a Job ⚡</Text>
                </Pressable>
              )}
            </View>
          </>
        )}
      </KeyboardAvoidingView>

      {/* WebView Map Picker Modal */}
      <Modal visible={showMapPicker} animationType="slide" onRequestClose={() => setShowMapPicker(false)}>
        <View style={styles.mapModalContainer}>
          {/* Header */}
          <View style={[styles.mapHeader, { paddingTop: Math.max(insets.top, 16) }]}>
            <Pressable onPress={() => setShowMapPicker(false)} style={styles.mapBackBtn}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </Pressable>
            <Text style={styles.mapHeaderTitle}>Select Location on Map</Text>
            <View style={{ width: 24 }} />
          </View>

          <WebView
            style={{ flex: 1 }}
            originWhitelist={['*']}
            source={{ html: getLeafletHtml(getInitialCoords().lat, getInitialCoords().lng) }}
            javaScriptEnabled={true}
            onMessage={handleMapMessage}
          />
        </View>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#082C18',
    paddingBottom: 15,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  progressBarBg: {
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2.5,
    marginBottom: 6,
  },
  progressBarFill: {
    height: 5,
    backgroundColor: '#FFFFFF',
    borderRadius: 2.5,
  },
  stepText: {
    color: '#A7F3D0',
    fontSize: 12,
    fontWeight: '600',
  },
  formContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  categoryCard: {
    width: (width - 60) / 3,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
  },
  categoryCardActive: {
    backgroundColor: '#082C18',
    borderColor: '#082C18',
  },
  categoryCardInactive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  categoryLabelActive: {
    color: '#FFFFFF',
  },
  categoryLabelInactive: {
    color: '#374151',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginTop: 14,
    marginBottom: 8,
  },
  textArea: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 14,
    fontSize: 14,
    color: '#1F2937',
    height: 120,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    fontSize: 14,
    color: '#1F2937',
  },
  citiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  cityPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  cityPillActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  cityPillInactive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  cityPillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  cityPillTextActive: {
    color: '#FFFFFF',
  },
  cityPillTextInactive: {
    color: '#1F2937',
  },
  dropdownTrigger: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownTextPlaceholder: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  dropdownTextSelected: {
    color: '#1F2937',
    fontSize: 14,
    fontWeight: '600',
  },
  dropdownList: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    marginTop: 4,
    maxHeight: 180,
    overflow: 'scroll',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#1F2937',
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 20,
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  reviewLabel: {
    color: '#6B7280',
    fontSize: 14,
  },
  reviewValue: {
    fontWeight: '700',
    color: '#111827',
    fontSize: 14,
  },
  reviewDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },
  paymentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  paymentCard: {
    width: (width - 50) / 2,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  paymentCardActive: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  paymentCardInactive: {
    borderColor: '#E5E7EB',
  },
  paymentLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  paymentLabelActive: {
    color: '#065F46',
  },
  paymentLabelInactive: {
    color: '#4B5563',
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  infoBannerText: {
    fontSize: 11,
    color: '#065F46',
    flex: 1,
    lineHeight: 16,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  nextBtn: {
    backgroundColor: '#34D399', // Matches the light-green button in image
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postBtn: {
    backgroundColor: '#10B981', // Matches step 3 "Post a Job" dark green
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  btnDisabled: {
    backgroundColor: '#D1D5DB',
  },
  successOverlay: {
    flex: 1,
    backgroundColor: '#082C18',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  successIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  successTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
  },
  successSub: {
    color: '#A7F3D0',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  iosDoneBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  iosDoneBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  locationSelectorContainer: {
    marginBottom: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    padding: 4,
    marginTop: 8,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: '#082C18',
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
  },
  savedLocationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  savedLocationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  savedLocationTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  savedLocationAddress: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
  },
  savedLocationError: {
    fontSize: 13,
    color: '#EF4444',
  },
  gpsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gpsBtn: {
    backgroundColor: '#082C18',
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginLeft: 10,
  },
  gpsBtnLoading: {
    opacity: 0.7,
  },
  gpsBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  mapModalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  mapHeader: {
    backgroundColor: '#082C18',
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mapBackBtn: {
    padding: 4,
  },
  mapHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  mapTriggerBtn: {
    backgroundColor: '#10B981',
    height: 48,
    width: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  gpsBtnSquare: {
    backgroundColor: '#082C18',
    height: 48,
    width: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});
