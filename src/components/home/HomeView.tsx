import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Image,
  Dimensions,
  Platform,
  Animated,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { useAuth } from '../../provider/auth';
import { usePostJob, Task } from '../../provider/post-job';
import ActiveTaskScreen from './ActiveTaskScreen';

const { width, height } = Dimensions.get('window');

interface HomeViewProps {
  userName: string;
  onNavigateToTab?: (tab: 'home' | 'browse' | 'messages' | 'profile') => void;
  onOpenPostJob?: (initialCategory?: string) => void;
  onSelectPro?: (proName: string) => void;
}

export interface Pro {
  id: string;
  name: string;
  category: string;
  rating: number;
  reviews: number;
  location: string;
  price: string;
  timeEstimate: string;
  policeVerified: boolean;
  avatar: string;
}

export const MOCK_PROS: Pro[] = [
  {
    id: '1',
    name: 'Ahmad Ali Electrician',
    category: 'Electrician',
    rating: 4.8,
    reviews: 127,
    location: 'DHA Phase 5, Lahore',
    price: 'Rs. 1,500',
    timeEstimate: '~10 min',
    policeVerified: true,
    avatar: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150',
  },
  {
    id: '2',
    name: 'Malik Brothers Plumbing',
    category: 'Plumber',
    rating: 4.6,
    reviews: 89,
    location: 'Clifton Block 4, Karachi',
    price: 'Rs. 1,200',
    timeEstimate: '~25 min',
    policeVerified: false,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
  },
];

export const CATEGORIES = [
  { name: 'Electrician', icon: 'flash', color: '#F97316' },
  { name: 'Plumber', icon: 'build', color: '#A855F7' },
  { name: 'AC Service', icon: 'snow', color: '#3B82F6' },
  { name: 'Tutor', icon: 'school', color: '#10B981' },
  { name: 'Mehndi', icon: 'leaf', color: '#84CC16' },
  { name: 'Cleaning', icon: 'sparkles', color: '#EAB308' },
  { name: 'Painter', icon: 'brush', color: '#EC4899' },
  { name: 'Mason', icon: 'construct', color: '#EF4444' },
];

const PAYMENT_METHODS = [
  { id: 'cash', name: 'Cash', icon: 'cash-outline', logoColor: '#059669' },
  { id: 'jazzcash', name: 'JazzCash', icon: 'wallet-outline', logoColor: '#EAB308' },
  { id: 'easypaisa', name: 'EasyPaisa', icon: 'card-outline', logoColor: '#2563EB' },
];

// Premium styled maps using CartoDB Positron
const getLeafletHtml = (lat: number, lng: number) => `
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
    }).setView([${lat}, ${lng}], 15);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 20,
      subdomains: 'abcd'
    }).addTo(map);

    // Initial offset so coordinates align under the pin (at 35% height)
    map.whenReady(function() {
      var size = map.getSize();
      var tgt = L.point(size.x / 2, size.y * 0.35);
      var ctr = L.point(size.x / 2, size.y / 2);
      map.panBy(ctr.subtract(tgt), { animate: false });
    });

    map.on('moveend', function() {
      // Read coordinates directly under the visual pin at 35% screen height
      var size = map.getSize();
      var pinPoint = L.point(size.x / 2, size.y * 0.35);
      var pinCoords = map.containerPointToLatLng(pinPoint);
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'REGION_CHANGED',
          latitude: pinCoords.lat,
          longitude: pinCoords.lng
        }));
      }
    });

    // Signal React Native that map is fully ready
    map.whenReady(function() {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MAP_READY' }));
      }
    });
  </script>
</body>
</html>
`;

// Full screen map adjuster HTML (using center coordinate directly with no offset)
const getAdjusterLeafletHtml = (lat: number, lng: number) => `
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
    }).setView([${lat}, ${lng}], 16);

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
  </script>
</body>
</html>
`;


export default function HomeView({ userName }: HomeViewProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuth();
  const {
    activeTask,
    taskHistory,
    selectedCategory,
    createTask,
    clearHistory,
    openPostJob,
    closePostJob,
  } = usePostJob();

  // Location State
  const [mapCoords, setMapCoords] = useState({
    latitude: 31.5204,
    longitude: 74.3587,
  });
  const [initialCoords, setInitialCoords] = useState<{ latitude: number, longitude: number } | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [address, setAddress] = useState('Fetching location...');

  // Collapsible Bottom Sheet State
  const [sheetCollapsed, setSheetCollapsed] = useState(false);
  const sheetTranslateY = useRef(new Animated.Value(0)).current;

  // Search & Adjust Location States
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [pinAdjusterVisible, setPinAdjusterVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchingLocation, setSearchingLocation] = useState(false);
  const [adjusterCoords, setAdjusterCoords] = useState({ latitude: 31.5204, longitude: 74.3587 });
  const [adjusterAddress, setAdjusterAddress] = useState('');

  // Animated swipe handling via PanResponder
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only capture vertical drag movements greater than 5px
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderRelease: (_, gestureState) => {
        // If it's a simple tap (minimal movement), toggle collapse
        if (Math.abs(gestureState.dx) < 15 && Math.abs(gestureState.dy) < 15) {
          setSheetCollapsed(prev => !prev);
        } else if (gestureState.dy > 50) {
          // Dragged down
          setSheetCollapsed(true);
        } else if (gestureState.dy < -50) {
          // Dragged up
          setSheetCollapsed(false);
        }
      },
    })
  ).current;

  // Animate bottom sheet collapse/expand
  useEffect(() => {
    Animated.spring(sheetTranslateY, {
      toValue: sheetCollapsed ? 250 : 0,
      useNativeDriver: true,
      tension: 40,
      friction: 8,
    }).start();
  }, [sheetCollapsed]);

  // Form Inputs State
  const [activeCategory, setActiveCategory] = useState<string>('Electrician');
  const [budget, setBudget] = useState('');
  const [description, setDescription] = useState('');
  const [paymentPref, setPaymentPref] = useState('cash');

  // Navigation / Drawer / History Modals State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [viewActiveTaskScreen, setViewActiveTaskScreen] = useState(false);

  const drawerAnim = useRef(new Animated.Value(-width * 0.75)).current;
  const webViewRef = useRef<WebView | null>(null);

  // Sync provider selected category if any
  useEffect(() => {
    if (selectedCategory) {
      setActiveCategory(selectedCategory);
      closePostJob(); // Clear out selected category once read
    }
  }, [selectedCategory]);

  // Request Location permissions and get coordinates
  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          const defaultCoords = { latitude: 31.5204, longitude: 74.3587 };
          setMapCoords(defaultCoords);
          setInitialCoords(defaultCoords);
          setAddress('Lahore, Pakistan (Default)');
          setLoadingLocation(false);
          return;
        }

        // Get last known location instantly, otherwise do a quick balanced fetch (<1s)
        let loc = await Location.getLastKnownPositionAsync();
        if (!loc) {
          loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
        }

        console.log('[GPS] Fast fix:', loc.coords.latitude, loc.coords.longitude, 'accuracy:', loc.coords.accuracy, 'm');

        const newCoords = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        };
        setMapCoords(newCoords);
        setInitialCoords(newCoords);
        reverseGeocode(loc.coords.latitude, loc.coords.longitude);
      } catch (err) {
        console.error('Error fetching location: ', err);
        const defaultCoords = { latitude: 31.5204, longitude: 74.3587 };
        setMapCoords(defaultCoords);
        setInitialCoords(defaultCoords);
        setAddress('Lahore, Pakistan (Default)');
      } finally {
        setLoadingLocation(false);
      }
    })();
  }, []);

  const reCenterMap = async () => {
    try {
      setLoadingLocation(true);

      // Get last known location instantly, otherwise do a quick balanced fetch (<1s)
      let loc = await Location.getLastKnownPositionAsync();
      if (!loc) {
        loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
      }

      const newCoords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };
      setMapCoords(newCoords);

      if (webViewRef.current) {
        const jsCode = `
          if (map) {
            map.setView([${newCoords.latitude}, ${newCoords.longitude}], 15);
            var size = map.getSize();
            var tgt = L.point(size.x / 2, size.y * 0.35);
            var ctr = L.point(size.x / 2, size.y / 2);
            map.panBy(ctr.subtract(tgt), { animate: false });
          }
          true;
        `;
        webViewRef.current.injectJavaScript(jsCode);
      }
      reverseGeocode(newCoords.latitude, newCoords.longitude);
    } catch (err) {
      Alert.alert('Location Error', 'Unable to fetch current location.');
    } finally {
      setLoadingLocation(false);
    }
  };

  const reverseGeocode = async (lat: number, lng: number) => {
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
        setAddress(parts.join(', ') || `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      } else {
        setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      }
    } catch (e) {
      setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    }
  };

  const searchLocations = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 3) {
      setSearchResults([]);
      return;
    }
    setSearchingLocation(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=8&countrycodes=pk&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'en',
            'User-Agent': 'KaamKrwaoApp/1.0',
          },
        }
      );
      const data = await response.json();
      if (data && Array.isArray(data)) {
        const formatted = data.map((item: any) => {
          const name = item.display_name.split(',')[0];
          return {
            id: item.place_id,
            name: name || 'Location',
            address: item.display_name,
            latitude: parseFloat(item.lat),
            longitude: parseFloat(item.lon),
            type: item.type || 'monument',
          };
        });
        setSearchResults(formatted);
      }
    } catch (error) {
      console.error('Search location error: ', error);
    } finally {
      setSearchingLocation(false);
    }
  };

  const selectSearchResult = (item: any) => {
    const newCoords = {
      latitude: item.latitude,
      longitude: item.longitude,
    };
    setMapCoords(newCoords);
    if (!initialCoords) {
      setInitialCoords(newCoords);
    } else {
      if (webViewRef.current) {
        const jsCode = `
          if (map) {
            map.setView([${newCoords.latitude}, ${newCoords.longitude}], 15);
            var size = map.getSize();
            var tgt = L.point(size.x / 2, size.y * 0.35);
            var ctr = L.point(size.x / 2, size.y / 2);
            map.panBy(ctr.subtract(tgt), { animate: false });
          }
          true;
        `;
        webViewRef.current.injectJavaScript(jsCode);
      }
    }
    setAddress(item.address);
    setSearchModalVisible(false);
  };

  const openPinAdjuster = () => {
    setAdjusterCoords(mapCoords);
    setAdjusterAddress(address);
    setPinAdjusterVisible(true);
  };

  const confirmAdjustedLocation = () => {
    setMapCoords(adjusterCoords);
    if (webViewRef.current) {
      const jsCode = `
        if (map) {
          map.setView([${adjusterCoords.latitude}, ${adjusterCoords.longitude}], 15);
          var size = map.getSize();
          var tgt = L.point(size.x / 2, size.y * 0.35);
          var ctr = L.point(size.x / 2, size.y / 2);
          map.panBy(ctr.subtract(tgt), { animate: false });
        }
        true;
      `;
      webViewRef.current.injectJavaScript(jsCode);
    }
    setAddress(adjusterAddress);
    setPinAdjusterVisible(false);
    setSearchModalVisible(false);
  };

  const handleAdjusterMapMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'REGION_CHANGED') {
        setAdjusterCoords({
          latitude: data.latitude,
          longitude: data.longitude,
        });
        reverseGeocodeAdjuster(data.latitude, data.longitude);
      }
    } catch (e) {
      // JSON parse error
    }
  };

  const reverseGeocodeAdjuster = async (lat: number, lng: number) => {
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
        setAdjusterAddress(parts.join(', ') || `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      } else {
        setAdjusterAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      }
    } catch (e) {
      setAdjusterAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    }
  };

  const handleMapMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'REGION_CHANGED') {
        setMapCoords({
          latitude: data.latitude,
          longitude: data.longitude,
        });
        reverseGeocode(data.latitude, data.longitude);
      }
    } catch (e) {
      // JSON parse error
    }
  };

  const toggleDrawer = (open: boolean) => {
    setDrawerOpen(open);
    Animated.timing(drawerAnim, {
      toValue: open ? 0 : -width * 0.75,
      duration: 250,
      useNativeDriver: true,
    }).start();
  };

  const handleRequestTask = () => {
    if (!activeCategory) {
      Alert.alert('Selection Required', 'Please select a category first.');
      return;
    }
    if (!budget || isNaN(Number(budget)) || Number(budget) <= 0) {
      Alert.alert('Invalid Budget', 'Please enter a valid price/budget.');
      return;
    }
    if (description.trim().length < 5) {
      Alert.alert('Details Required', 'Please describe the work in at least 5 characters.');
      return;
    }

    createTask(activeCategory, description, Number(budget), address, paymentPref);
    setViewActiveTaskScreen(true);

    // Clear inputs for next time
    setBudget('');
    setDescription('');
  };

  const handleSignOut = async () => {
    toggleDrawer(false);
    try {
      await logout();
    } catch (err) {
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  // Auto show active task screen if task is running
  useEffect(() => {
    if (activeTask && !viewActiveTaskScreen) {
      setViewActiveTaskScreen(true);
    }
  }, [activeTask?.id]);

  return (
    <View style={styles.container}>
      {/* 1. MAP BACKGROUND (PREMIUM WEBVIEW WITH CARTODB POSITRON) */}
      <View style={styles.mapContainer}>
        {loadingLocation || !initialCoords ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#10B981" />
            <Text style={styles.loadingText}>Getting your GPS location...</Text>
            <Text style={[styles.loadingText, { fontSize: 11, color: '#9CA3AF', marginTop: 4 }]}>Please wait up to 15 seconds</Text>
          </View>
        ) : (
          <WebView
            ref={webViewRef}
            style={styles.map}
            source={{ html: getLeafletHtml(initialCoords.latitude, initialCoords.longitude) }}
            onMessage={handleMapMessage}
            scrollEnabled={false}
            overScrollMode="never"
          />
        )}

        {/* 2. MAP OVERLAY PIN IN MIDDLE */}
        {!loadingLocation && initialCoords && (
          <View style={styles.centerMarkerContainer} pointerEvents="none">
            <Ionicons name="location" size={40} color="#EF4444" style={styles.pinIcon} />
          </View>
        )}
      </View>

      {/* 3. FLOATING HAMBURGER MENU BUTTON */}
      <Pressable
        style={[styles.menuBtn, { top: insets.top > 0 ? insets.top + 10 : 20 }]}
        onPress={() => toggleDrawer(true)}
      >
        <Ionicons name="menu" size={26} color="#111827" />
      </Pressable>

      {/* FLOATING LOCATION RE-CENTER BUTTON */}
      {!loadingLocation && initialCoords && (
        <Animated.View style={[
          styles.locateBtn,
          {
            transform: [{
              translateY: sheetTranslateY.interpolate({
                inputRange: [0, 250],
                outputRange: [0, 200],
              })
            }]
          }
        ]}>
          <Pressable onPress={reCenterMap} style={styles.locateBtnPressable}>
            <Ionicons name="locate" size={24} color="#10B981" />
          </Pressable>
        </Animated.View>
      )}

      {/* 4. FLOATING ACTIVE TASK FEEDBACK BAR */}
      {activeTask && !viewActiveTaskScreen && (
        <Pressable
          style={[styles.activeTaskBanner, { top: insets.top > 0 ? insets.top + 15 : 25 }]}
          onPress={() => setViewActiveTaskScreen(true)}
        >
          <View style={styles.bannerIndicator} />
          <Text style={styles.bannerText}>
            ⚡ Active Request: <Text style={styles.boldText}>{activeTask.category}</Text> (Rs. {activeTask.budget})
          </Text>
          <Ionicons name="chevron-forward" size={16} color="#10B981" style={{ marginLeft: 8 }} />
        </Pressable>
      )}

      {/* 5. BOTTOM CONTROL SHEET (ANIMATED COLLAPSIBLE) */}
      <Animated.View style={[
        styles.bottomSheet, 
        { 
          transform: [{ translateY: sheetTranslateY }],
          paddingBottom: insets.bottom > 0 ? insets.bottom + 8 : 16 
        }
      ]}>
        {/* Interactive Drag Handle Area (Tappable and Swipeable) */}
        <View 
          style={styles.sheetHandleContainer} 
          {...panResponder.panHandlers}
        >
          <View style={styles.sheetHandle} />
          {sheetCollapsed && (
            <View style={styles.collapsedHeader}>
              <Text style={styles.collapsedAddressText} numberOfLines={1}>
                📍 {address}
              </Text>
              <Text style={styles.collapsedSubText}>
                Tap or swipe up to set details & budget
              </Text>
            </View>
          )}
        </View>

        {/* Scrolling Categories Selection */}
        <Text style={styles.sheetTitle}>What service do you need?</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = activeCategory === cat.name;
            return (
              <Pressable
                key={cat.name}
                style={[styles.categoryCard, isSelected && styles.categoryCardSelected]}
                onPress={() => setActiveCategory(cat.name)}
              >
                <View style={[styles.categoryIconCircle, { backgroundColor: cat.color + '15' }]}>
                  <Ionicons name={cat.icon as any} size={22} color={isSelected ? '#10B981' : cat.color} />
                </View>
                <Text style={[styles.categoryLabel, isSelected && styles.categoryLabelSelected]}>
                  {cat.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.inputContainer}>
          {/* Location / Address display (Tap to search) */}
          <Pressable style={styles.addressPill} onPress={() => setSearchModalVisible(true)}>
            <Ionicons name="location" size={18} color="#EF4444" style={{ marginRight: 8 }} />
            <Text style={styles.addressText} numberOfLines={1}>
              {address}
            </Text>
          </Pressable>

          {/* Budget Input & Payment selection in a Row */}
          <View style={styles.formRow}>
            <View style={styles.budgetInputContainer}>
              <Text style={styles.currencyPrefix}>Rs.</Text>
              <TextInput
                style={styles.budgetInput}
                placeholder="Enter Budget"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                value={budget}
                onChangeText={setBudget}
              />
            </View>

            {/* Payment Method Selector */}
            <View style={styles.paymentSelectorContainer}>
              {PAYMENT_METHODS.map((pm) => {
                const isSelected = paymentPref === pm.id;
                return (
                  <Pressable
                    key={pm.id}
                    style={[styles.paymentBtn, isSelected && styles.paymentBtnSelected]}
                    onPress={() => setPaymentPref(pm.id)}
                  >
                    <Ionicons name={pm.icon as any} size={18} color={isSelected ? '#10B981' : '#6B7280'} />
                    <Text style={[styles.paymentBtnLabel, isSelected && styles.paymentLabelSelected]}>
                      {pm.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Description Input */}
          <View style={styles.descriptionContainer}>
            <Ionicons name="create-outline" size={18} color="#6B7280" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.descriptionInput}
              placeholder="Provide details about the job..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={2}
              value={description}
              onChangeText={setDescription}
            />
          </View>
        </View>

        {/* Find Professional Action Button */}
        <Pressable style={styles.actionButton} onPress={handleRequestTask}>
          <Text style={styles.actionButtonText}>Find Professional</Text>
        </Pressable>
      </Animated.View>

      {/* 6. CUSTOM SLIDE-OUT DRAWER */}
      {drawerOpen && (
        <Pressable style={styles.drawerBackdrop} onPress={() => toggleDrawer(false)} />
      )}
      <Animated.View style={[styles.drawerPanel, { transform: [{ translateX: drawerAnim }] }]}>
        <View style={[styles.drawerHeader, { paddingTop: insets.top > 0 ? insets.top + 20 : 30 }]}>
          <View style={styles.drawerAvatarCircle}>
            <Text style={styles.drawerAvatarText}>
              {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
            </Text>
          </View>
          <Text style={styles.drawerName}>{user?.displayName || 'App User'}</Text>
          <Text style={styles.drawerPhone}>{user?.phoneNumber || 'No phone registered'}</Text>
          <View style={styles.drawerVerifiedBadge}>
            <Ionicons name="checkmark-circle" size={14} color="#10B981" style={{ marginRight: 4 }} />
            <Text style={styles.drawerVerifiedLabel}>Verified User</Text>
          </View>
        </View>

        <View style={styles.drawerItemsContainer}>
          {activeTask && (
            <Pressable
              style={styles.drawerItem}
              onPress={() => {
                toggleDrawer(false);
                setViewActiveTaskScreen(true);
              }}
            >
              <Ionicons name="flash-outline" size={20} color="#10B981" style={styles.drawerItemIcon} />
              <Text style={[styles.drawerItemLabel, { color: '#10B981', fontWeight: '700' }]}>
                Active Request
              </Text>
            </Pressable>
          )}

          <Pressable
            style={styles.drawerItem}
            onPress={() => {
              toggleDrawer(false);
              setHistoryVisible(true);
            }}
          >
            <Ionicons name="time-outline" size={20} color="#374151" style={styles.drawerItemIcon} />
            <Text style={styles.drawerItemLabel}>Task History</Text>
          </Pressable>

          <Pressable
            style={styles.drawerItem}
            onPress={() => {
              toggleDrawer(false);
              router.push('/profile');
            }}
          >
            <Ionicons name="settings-outline" size={20} color="#374151" style={styles.drawerItemIcon} />
            <Text style={styles.drawerItemLabel}>Settings</Text>
          </Pressable>

          <View style={styles.drawerDivider} />

          <Pressable style={[styles.drawerItem, styles.logoutItem]} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={20} color="#EF4444" style={styles.drawerItemIcon} />
            <Text style={styles.drawerLogoutLabel}>Sign Out</Text>
          </Pressable>
        </View>
      </Animated.View>

      {/* 7. ACTIVE TASK FULL SCREEN OVERLAY */}
      {viewActiveTaskScreen && (
        <Modal visible={viewActiveTaskScreen} animationType="slide">
          <ActiveTaskScreen onBack={() => setViewActiveTaskScreen(false)} />
        </Modal>
      )}

      {/* 8. TASK HISTORY MODAL OVERLAY */}
      <Modal
        visible={historyVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setHistoryVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.historyBox}>
            <View style={styles.historyBoxHeader}>
              <Text style={styles.historyTitle}>Task History</Text>
              <Pressable onPress={() => setHistoryVisible(false)} style={styles.historyCloseBtn}>
                <Ionicons name="close" size={24} color="#374151" />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.historyList}>
              {taskHistory.length === 0 ? (
                <View style={styles.emptyHistory}>
                  <Ionicons name="receipt-outline" size={48} color="#D1D5DB" />
                  <Text style={styles.emptyHistoryText}>No tasks created yet.</Text>
                </View>
              ) : (
                taskHistory.map((task) => (
                  <View key={task.id} style={styles.historyItemCard}>
                    <View style={styles.historyItemHeader}>
                      <Text style={styles.historyItemCategory}>{task.category}</Text>
                      <View
                        style={[
                          styles.historyStatusBadge,
                          {
                            backgroundColor:
                              task.status === 'completed' ? '#D1FAE5' : '#FEE2E2',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.historyStatusText,
                            {
                              color: task.status === 'completed' ? '#065F46' : '#991B1B',
                            },
                          ]}
                        >
                          {task.status.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.historyItemDesc}>{task.description}</Text>
                    <View style={styles.historyItemMeta}>
                      <Text style={styles.historyItemCost}>Rs. {task.budget}</Text>
                      <Text style={styles.historyItemTime}>{task.createdAt}</Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>

            {taskHistory.length > 0 && (
              <Pressable
                style={styles.clearHistoryBtn}
                onPress={() => {
                  Alert.alert(
                    'Clear History',
                    'Are you sure you want to clear your task history?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Clear', style: 'destructive', onPress: clearHistory },
                    ]
                  );
                }}
              >
                <Text style={styles.clearHistoryBtnText}>Clear History</Text>
              </Pressable>
            )}
          </View>
        </View>
      </Modal>

      {/* 9. SEARCH LOCATION MODAL */}
      <Modal
        visible={searchModalVisible}
        animationType="slide"
        onRequestClose={() => setSearchModalVisible(false)}
      >
        <View style={styles.searchModalContainer}>
          <View style={[styles.searchHeaderRow, { paddingTop: insets.top > 0 ? insets.top + 10 : 20 }]}>
            <Pressable onPress={() => setSearchModalVisible(false)} style={styles.searchBackBtn}>
              <Ionicons name="arrow-back" size={24} color="#111827" />
            </Pressable>
            <View style={styles.searchInputWrapper}>
              <TextInput
                style={styles.searchTextInput}
                placeholder="Search destination address..."
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={searchLocations}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => { setSearchQuery(''); setSearchResults([]); }} style={styles.searchClearBtn}>
                  <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                </Pressable>
              )}
            </View>
            <Pressable onPress={openPinAdjuster} style={styles.searchMapBtn}>
              <Text style={styles.searchMapBtnText}>Map</Text>
            </Pressable>
          </View>

          {searchingLocation && (
            <ActivityIndicator size="small" color="#10B981" style={{ marginVertical: 20 }} />
          )}

          <ScrollView style={styles.searchResultsList} keyboardShouldPersistTaps="handled">
            {searchResults.map((item) => (
              <Pressable
                key={item.id}
                style={styles.searchResultItem}
                onPress={() => selectSearchResult(item)}
              >
                <View style={styles.searchResultIconCircle}>
                  <Ionicons
                    name={
                      item.type === 'university' || item.type === 'college' || item.type === 'school'
                        ? 'school'
                        : item.type === 'shop' || item.type === 'mall' || item.type === 'supermarket'
                        ? 'basket'
                        : 'location'
                    }
                    size={20}
                    color="#4B5563"
                  />
                </View>
                <View style={styles.searchResultTextContainer}>
                  <Text style={styles.searchResultName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.searchResultAddress} numberOfLines={1}>
                    {item.address}
                  </Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* 10. MAP PIN ADJUSTER MODAL */}
      <Modal
        visible={pinAdjusterVisible}
        animationType="slide"
        onRequestClose={() => setPinAdjusterVisible(false)}
      >
        <View style={styles.adjusterContainer}>
          {/* Full Screen Adjuster Map */}
          <WebView
            style={styles.adjusterMap}
            source={{ html: getAdjusterLeafletHtml(adjusterCoords.latitude, adjusterCoords.longitude) }}
            onMessage={handleAdjusterMapMessage}
            scrollEnabled={false}
            overScrollMode="never"
          />

          {/* Centered marker overlay */}
          <View style={styles.adjusterPinContainer} pointerEvents="none">
            <Ionicons name="location" size={44} color="#EF4444" style={styles.pinIcon} />
          </View>

          {/* Top Header floating banner */}
          <View style={[styles.adjusterHeader, { top: insets.top > 0 ? insets.top + 10 : 20 }]}>
            <Pressable onPress={() => setPinAdjusterVisible(false)} style={styles.adjusterBackBtn}>
              <Ionicons name="arrow-back" size={24} color="#111827" />
            </Pressable>
            <Text style={styles.adjusterHeaderTitle}>Swipe to move map</Text>
            <View style={{ width: 32 }} />
          </View>

          {/* Bottom address adjustment confirmation card */}
          <View style={[styles.adjusterBottomCard, { paddingBottom: insets.bottom > 0 ? insets.bottom + 16 : 24 }]}>
            <Text style={styles.adjusterCardTitle}>DESTINATION ADDRESS</Text>
            <View style={styles.adjusterAddressRow}>
              <Ionicons name="flag" size={20} color="#111827" style={{ marginRight: 10 }} />
              <Text style={styles.adjusterAddressText} numberOfLines={2}>
                {adjusterAddress || 'Loading address...'}
              </Text>
            </View>

            <Pressable style={styles.adjusterDoneBtn} onPress={confirmAdjustedLocation}>
              <Text style={styles.adjusterDoneBtnText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    width: width,
    height: height,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 10,
    fontWeight: '600',
  },
  centerMarkerContainer: {
    position: 'absolute',
    left: '50%',
    top: '35%', // Positioned exactly in the center of the open map area (above bottom sheet)
    marginLeft: -20,
    marginTop: -40,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  pinIcon: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  pinShadow: {
    position: 'absolute',
    bottom: -2,
    width: 8,
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 4,
  },
  menuBtn: {
    position: 'absolute',
    left: 16,
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
  locateBtn: {
    position: 'absolute',
    right: 16,
    bottom: 460, // Above the bottom sheet on all screen sizes
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
  activeTaskBanner: {
    position: 'absolute',
    left: 80,
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
  bannerIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 10,
  },
  bannerText: {
    fontSize: 13,
    color: '#1F2937',
    flex: 1,
  },
  boldText: {
    fontWeight: '700',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 16,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 20,
    zIndex: 4,
  },
  sheetHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
    marginBottom: 10,
  },
  sheetTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 10,
  },
  categoriesScroll: {
    paddingTop: 6, // Adds top headroom so scaled-up selected categories are not clipped
    paddingBottom: 10,
    gap: 8,
  },
  categoryCard: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 64,
    marginRight: 6,
  },
  categoryCardSelected: {
    transform: [{ scale: 1.05 }],
  },
  categoryIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  categoryLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#4B5563',
    textAlign: 'center',
  },
  categoryLabelSelected: {
    color: '#10B981',
    fontWeight: '800',
  },
  inputContainer: {
    marginTop: 10,
    gap: 10,
  },
  addressPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 12,
    height: 42,
    paddingHorizontal: 12,
  },
  addressText: {
    fontSize: 13,
    color: '#374151',
    flex: 1,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  budgetInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 12,
    height: 42,
    paddingHorizontal: 12,
    flex: 0.44,
  },
  currencyPrefix: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginRight: 4,
  },
  budgetInput: {
    flex: 1,
    fontSize: 13,
    color: '#111827',
    fontWeight: '600',
  },
  paymentSelectorContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    height: 42,
    padding: 3,
    flex: 0.54,
    gap: 6, // Increased gap for a cleaner separation of options
  },
  paymentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    paddingHorizontal: 4,
  },
  paymentBtnSelected: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  paymentBtnLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 3,
  },
  paymentLabelSelected: {
    color: '#10B981',
    fontWeight: '800',
  },
  descriptionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
  },
  descriptionInput: {
    flex: 1,
    fontSize: 13,
    color: '#111827',
    padding: 0,
    textAlignVertical: 'center',
  },
  actionButton: {
    backgroundColor: '#082C18',
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },

  // CUSTOM DRAWER STYLING
  drawerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 998,
  },
  drawerPanel: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: width * 0.75,
    backgroundColor: '#FFFFFF',
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 16,
  },
  drawerHeader: {
    backgroundColor: '#082C18',
    padding: 20,
    alignItems: 'center',
  },
  drawerAvatarCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#34D399',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    marginBottom: 10,
  },
  drawerAvatarText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#082C18',
  },
  drawerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  drawerPhone: {
    fontSize: 12,
    color: '#A7F3D0',
    marginBottom: 8,
  },
  drawerVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 211, 153, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  drawerVerifiedLabel: {
    color: '#34D399',
    fontSize: 10,
    fontWeight: '600',
  },
  drawerItemsContainer: {
    padding: 16,
    flex: 1,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  drawerItemIcon: {
    marginRight: 14,
  },
  drawerItemLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  drawerDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 10,
  },
  logoutItem: {
    marginTop: 'auto',
  },
  drawerLogoutLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
  },

  // HISTORY MODAL STYLING
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyBox: {
    width: width * 0.88,
    height: height * 0.7,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  historyBoxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 12,
    marginBottom: 12,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  historyCloseBtn: {
    padding: 4,
  },
  historyList: {
    paddingBottom: 10,
  },
  emptyHistory: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyHistoryText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 10,
  },
  historyItemCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    padding: 12,
    marginBottom: 10,
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  historyItemCategory: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  historyStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  historyStatusText: {
    fontSize: 9,
    fontWeight: '700',
  },
  historyItemDesc: {
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 16,
    marginBottom: 8,
  },
  historyItemMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 8,
  },
  historyItemCost: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
  },
  historyItemTime: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  clearHistoryBtn: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#EF4444',
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearHistoryBtnText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '700',
  },

  // COLLAPSIBLE SHEET INTERNALS
  sheetHandleContainer: {
    width: '100%',
    paddingVertical: 8,
    alignItems: 'center',
  },
  collapsedHeader: {
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
    width: '100%',
  },
  collapsedAddressText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
    paddingHorizontal: 20,
    textAlign: 'center',
  },
  collapsedSubText: {
    fontSize: 10,
    color: '#10B981',
    fontWeight: '700',
  },
  locateBtnPressable: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // SEARCH LOCATION MODAL
  searchModalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  searchHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 8,
  },
  searchBackBtn: {
    padding: 6,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
  },
  searchTextInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    padding: 0,
  },
  searchClearBtn: {
    padding: 4,
  },
  searchMapBtn: {
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchMapBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },
  searchResultsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  searchResultIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  searchResultTextContainer: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  searchResultAddress: {
    fontSize: 12,
    color: '#6B7280',
  },

  // MAP PIN ADJUSTER MODAL
  adjusterContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#EAE6DF',
  },
  adjusterMap: {
    width: width,
    height: height,
  },
  adjusterPinContainer: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    marginLeft: -22,
    marginTop: -44,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  adjusterHeader: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 5,
  },
  adjusterBackBtn: {
    padding: 6,
  },
  adjusterHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  adjusterBottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 5,
  },
  adjusterCardTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  adjusterAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  adjusterAddressText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 18,
  },
  adjusterDoneBtn: {
    backgroundColor: '#EF4444',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  adjusterDoneBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
