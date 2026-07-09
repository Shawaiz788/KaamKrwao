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
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { useAuth } from '../../provider/auth';
import { usePostJob, Task } from '../../provider/post-job';
import ActiveTaskScreen from './ActiveTaskScreen';
import DrawerPanel from './DrawerPanel';
import TaskHistoryModal from './TaskHistoryModal';
import SearchLocationModal from './SearchLocationModal';
import PinAdjusterModal from './PinAdjusterModal';

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

  // Keyboard height state to slide absolute bottom sheet up
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

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
            var targetLatLng = L.latLng(${newCoords.latitude}, ${newCoords.longitude});
            var targetPoint = map.project(targetLatLng, 15);
            var size = map.getSize();
            var offset = L.point(0, size.y * (0.5 - 0.35));
            var centerPoint = targetPoint.add(offset);
            var centerLatLng = map.unproject(centerPoint, 15);
            map.setView(centerLatLng, 15);
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

  const openSearchModal = () => {
    const defaultPlaceholder = 'Fetching location...';
    if (address && address !== defaultPlaceholder) {
      setSearchQuery(address);
      searchLocations(address);
    } else {
      setSearchQuery('');
      setSearchResults([]);
    }
    setSearchModalVisible(true);
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
            var targetLatLng = L.latLng(${newCoords.latitude}, ${newCoords.longitude});
            var targetPoint = map.project(targetLatLng, 15);
            var size = map.getSize();
            var offset = L.point(0, size.y * (0.5 - 0.35));
            var centerPoint = targetPoint.add(offset);
            var centerLatLng = map.unproject(centerPoint, 15);
            map.setView(centerLatLng, 15);
          }
          true;
        `;
        webViewRef.current.injectJavaScript(jsCode);
      }
    }
    setAddress(item.address);
    setSearchModalVisible(false);
  };

  const confirmAdjustedLocation = (coords: { latitude: number; longitude: number }, addressStr: string) => {
    setMapCoords(coords);
    if (webViewRef.current) {
      const jsCode = `
        if (map) {
          var targetLatLng = L.latLng(${coords.latitude}, ${coords.longitude});
          var targetPoint = map.project(targetLatLng, 15);
          var size = map.getSize();
          var offset = L.point(0, size.y * (0.5 - 0.35));
          var centerPoint = targetPoint.add(offset);
          var centerLatLng = map.unproject(centerPoint, 15);
          map.setView(centerLatLng, 15);
        }
        true;
      `;
      webViewRef.current.injectJavaScript(jsCode);
    }
    setAddress(addressStr);
    setPinAdjusterVisible(false);
    setSearchModalVisible(false);
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

  // Dynamic styles extracted to render calculations (best practice)
  const activeTaskBannerStyle = [
    styles.activeTaskBanner,
    { top: insets.top > 0 ? insets.top + 15 : 25 }
  ];

  const bottomSheetStyle = [
    styles.bottomSheet,
    {
      transform: [{ translateY: sheetTranslateY }],
      bottom: keyboardHeight,
      paddingBottom: insets.bottom > 0 ? insets.bottom + 8 : 16
    }
  ];

  const locateBtnStyle = [
    styles.locateBtn,
    {
      bottom: keyboardHeight > 0 ? keyboardHeight + 460 : 460,
      transform: [{
        translateY: sheetTranslateY.interpolate({
          inputRange: [0, 250],
          outputRange: [0, 200],
        })
      }]
    }
  ];

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
        <Animated.View style={locateBtnStyle}>
          <Pressable onPress={reCenterMap} style={styles.locateBtnPressable}>
            <Ionicons name="locate" size={24} color="#10B981" />
          </Pressable>
        </Animated.View>
      )}

      {/* 4. FLOATING ACTIVE TASK FEEDBACK BAR */}
      {activeTask && !viewActiveTaskScreen && (
        <Pressable
          style={activeTaskBannerStyle}
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
      <Animated.View style={bottomSheetStyle}>
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

        {/* Scrollable contents to handle short keyboard viewports */}
        <ScrollView
          style={{ maxHeight: height * 0.4 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          scrollEnabled={!sheetCollapsed}
        >
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
            <Pressable style={styles.addressPill} onPress={openSearchModal}>
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
        </ScrollView>
      </Animated.View>

      {/* 6. CUSTOM SLIDE-OUT DRAWER */}
      <DrawerPanel
        open={drawerOpen}
        onClose={() => toggleDrawer(false)}
        user={user}
        activeTask={activeTask}
        onOpenActiveRequest={() => setViewActiveTaskScreen(true)}
        onOpenHistory={() => setHistoryVisible(true)}
        onSignOut={handleSignOut}
        drawerAnim={drawerAnim}
        insets={insets}
        router={router}
      />

      {/* 7. ACTIVE TASK FULL SCREEN OVERLAY */}
      {viewActiveTaskScreen && (
        <Modal visible={viewActiveTaskScreen} animationType="slide">
          <ActiveTaskScreen onBack={() => setViewActiveTaskScreen(false)} />
        </Modal>
      )}

      {/* 8. TASK HISTORY MODAL OVERLAY */}
      <TaskHistoryModal
        visible={historyVisible}
        onClose={() => setHistoryVisible(false)}
        taskHistory={taskHistory}
        clearHistory={clearHistory}
      />

      {/* 9. SEARCH LOCATION MODAL */}
      <SearchLocationModal
        visible={searchModalVisible}
        onClose={() => setSearchModalVisible(false)}
        searchQuery={searchQuery}
        onSearchQueryChange={searchLocations}
        searchResults={searchResults}
        searchingLocation={searchingLocation}
        onSelectResult={selectSearchResult}
        openPinAdjuster={() => setPinAdjusterVisible(true)}
        insets={insets}
      />

      {/* 10. MAP PIN ADJUSTER MODAL */}
      <PinAdjusterModal
        visible={pinAdjusterVisible}
        onClose={() => setPinAdjusterVisible(false)}
        initialCoords={mapCoords}
        initialAddress={address}
        onConfirm={confirmAdjustedLocation}
        insets={insets}
      />
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
    paddingHorizontal: 8,
    flex: 0.35,
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
    flex: 0.63,
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
});
