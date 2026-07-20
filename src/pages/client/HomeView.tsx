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
import * as ImagePicker from 'expo-image-picker';
import NetInfo from '@react-native-community/netinfo';
import { getPaymentPreferencesFromBackend, PaymentPreference } from '@/services/task';
import useCategoryStore, { getCategoryStyle } from '@/store/categoryStore';
import { getLocationById } from '@/services/location';
import { useAuth } from '@/context/auth';
import { usePostJob, Task } from '@/context/post-job';
import ActiveTaskScreen from '@/pages/client/ActiveTaskScreen';
import DrawerPanel from '@/components/client/DrawerPanel';
import SearchLocationModal from '@/components/client/SearchLocationModal';
import PinAdjusterModal from '@/components/client/PinAdjusterModal';
import { Pro } from '@/types';

const { width, height } = Dimensions.get('window');

const SHEET_HEIGHT = height * 0.8;
const DEFAULT_HEIGHT = 420;
const COLLAPSED_HEIGHT = 130;

const MOCK_IMAGES = [
  'https://picsum.photos/300?random=1',
  'https://picsum.photos/300?random=2',
  'https://picsum.photos/300?random=3',
  'https://picsum.photos/300?random=4',
  'https://picsum.photos/300?random=5',
];

interface HomeViewProps {
  userName: string;
  onNavigateToTab?: (tab: 'home' | 'browse' | 'messages' | 'profile') => void;
  onOpenPostJob?: (initialCategory?: string) => void;
  onSelectPro?: (proName: string) => void;
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


const getPaymentPrefStyle = (name: string) => {
  const normalized = name.trim().toLowerCase();
  const styles: Record<string, { icon: string; logoColor: string }> = {
    'cash': { icon: 'cash-outline', logoColor: '#059669' },
    'jazzcash': { icon: 'wallet-outline', logoColor: '#EAB308' },
    'easypaisa': { icon: 'card-outline', logoColor: '#2563EB' },
  };

  if (styles[normalized]) return styles[normalized];

  for (const key of Object.keys(styles)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return styles[key];
    }
  }

  return { icon: 'card-outline', logoColor: '#6B7280' };
};

const CategorySkeleton = ({ grid, opacity }: { grid?: boolean; opacity: Animated.Value }) => {
  return (
    <Animated.View
      style={[
        grid ? styles.skeletonGridCard : styles.skeletonCard,
        { opacity },
      ]}
    />
  );
};



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

  // 3-state bottom sheet: 'collapsed', 'default', 'expanded'
  const [sheetState, setSheetState] = useState<'collapsed' | 'default' | 'expanded'>('default');
  const [lastNonDefaultState, setLastNonDefaultState] = useState<'collapsed' | 'expanded'>('expanded');
  const sheetTranslateY = useRef(new Animated.Value(SHEET_HEIGHT - DEFAULT_HEIGHT)).current;

  // Ref to hold current state to prevent PanResponder stale closures
  const stateRef = useRef({ sheetState, lastNonDefaultState });
  stateRef.current = { sheetState, lastNonDefaultState };

  // Search & Adjust Location States
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [pinAdjusterVisible, setPinAdjusterVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchingLocation, setSearchingLocation] = useState(false);

  // Bottom sheet categories toggle
  const [showAllCategories, setShowAllCategories] = useState(false);

  // Shimmering Shared Animation
  const shimmerAnim = useRef(new Animated.Value(0.3)).current;

  // Categories from the shared Zustand store (fetched once per session)
  const { categories, loading: loadingCategories, ensureCategories } = useCategoryStore();

  // Dynamic Payment Preferences API State
  const [paymentPreferences, setPaymentPreferences] = useState<PaymentPreference[]>([]);
  const [loadingPaymentPrefs, setLoadingPaymentPrefs] = useState(true);
  const [selectedPaymentPrefId, setSelectedPaymentPrefId] = useState<number | null>(null);

  // Production-Ready NetInfo State
  const [isConnected, setIsConnected] = useState(true);

  // Bottom sheet direct location fields (when expanded)
  const [locStreet, setLocStreet] = useState('');
  const [locArea, setLocArea] = useState('');
  const [locCity, setLocCity] = useState('');
  const [locSearchLoading, setLocSearchLoading] = useState(false);

  // Form Attachments State
  const [attachments, setAttachments] = useState<Array<{ id: string; uri: string; uploading: boolean }>>([]);

  const getTranslateYValue = (state: 'collapsed' | 'default' | 'expanded') => {
    switch (state) {
      case 'expanded':
        return 0;
      case 'default':
        return SHEET_HEIGHT - DEFAULT_HEIGHT;
      case 'collapsed':
        return SHEET_HEIGHT - COLLAPSED_HEIGHT;
    }
  };

  // Animated swipe handling via PanResponder
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only capture vertical drag movements greater than 5px
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderRelease: (_, gestureState) => {
        const { sheetState: currentSheetState, lastNonDefaultState: currentLastNonDefault } = stateRef.current;
        const isTap = Math.abs(gestureState.dx) < 15 && Math.abs(gestureState.dy) < 15;
        const isSwipeDown = gestureState.dy > 25 || gestureState.vy > 0.25;
        const isSwipeUp = gestureState.dy < -25 || gestureState.vy < -0.25;

        if (isTap) {
          // Tap cycle:
          // 'collapsed' -> 'default'
          // 'expanded' -> 'default'
          // 'default' (last was 'collapsed') -> 'expanded'
          // 'default' (last was 'expanded') -> 'collapsed'
          if (currentSheetState === 'collapsed' || currentSheetState === 'expanded') {
            setSheetState('default');
          } else {
            setSheetState(currentLastNonDefault === 'collapsed' ? 'expanded' : 'collapsed');
          }
        } else if (isSwipeDown) {
          // Dragged/Swiped down
          if (currentSheetState === 'expanded') {
            setSheetState('default');
          } else {
            setSheetState('collapsed');
          }
        } else if (isSwipeUp) {
          // Dragged/Swiped up
          if (currentSheetState === 'collapsed') {
            setSheetState('default');
          } else {
            setSheetState('expanded');
          }
        }
      },
    })
  ).current;

  // Track the last non-default state for the tap cycle history
  useEffect(() => {
    if (sheetState !== 'default') {
      setLastNonDefaultState(sheetState);
    }
  }, [sheetState]);

  // Animate bottom sheet collapse/expand/fullscreen
  useEffect(() => {
    Animated.spring(sheetTranslateY, {
      toValue: getTranslateYValue(sheetState),
      useNativeDriver: true,
      tension: 40,
      friction: 8,
    }).start();
  }, [sheetState]);

  // Form Inputs State
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [budget, setBudget] = useState('');
  const [description, setDescription] = useState('');

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

  // Shimmer loop animation
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  // Subscribe to NetInfo connection status
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected = !!state.isConnected && (state.isInternetReachable !== false);
      setIsConnected(connected);
    });

    // One-time check on mount
    NetInfo.fetch().then((state) => {
      const connected = !!state.isConnected && (state.isInternetReachable !== false);
      setIsConnected(connected);
    });

    return () => unsubscribe();
  }, []);

  // Ensure categories are loaded (no-op after first successful fetch this session)
  useEffect(() => {
    ensureCategories().then(() => {
      const { categories: cats } = useCategoryStore.getState();
      if (cats.length > 0 && !activeCategory) {
        setActiveCategory(cats[0].name);
      }
    });
  }, []);

  // Fetch payment preferences from Backend API
  useEffect(() => {
    let isMounted = true;
    const fetchPaymentPrefs = async () => {
      try {
        setLoadingPaymentPrefs(true);
        const data = await getPaymentPreferencesFromBackend();
        if (isMounted) {
          setPaymentPreferences(data);
          if (data.length > 0 && selectedPaymentPrefId === null) {
            setSelectedPaymentPrefId(data[0].id);
          }
        }
      } catch (err) {
        console.error('[HomeView] Error loading payment preferences from API:', err);
        if (isMounted) {
          setPaymentPreferences([]);
        }
      } finally {
        if (isMounted) {
          setLoadingPaymentPrefs(false);
        }
      }
    };

    fetchPaymentPrefs();
    return () => {
      isMounted = false;
    };
  }, []);

  // Navigation / Drawer / History Modals State
  const [drawerOpen, setDrawerOpen] = useState(false);
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
        // 1. Try to fetch user's saved location coordinates from backend first
        if (user && user.location_id) {
          try {
            console.log(`[HomeView] Fetching user saved location profile for ID: ${user.location_id}`);
            const savedLoc = await getLocationById(user.location_id);
            if (savedLoc && savedLoc.latitude !== undefined && savedLoc.longitude !== undefined) {
              const savedCoords = {
                latitude: Number(savedLoc.latitude),
                longitude: Number(savedLoc.longitude),
              };
              console.log('[HomeView] Successfully loaded saved location coordinates:', savedCoords);
              setMapCoords(savedCoords);
              setInitialCoords(savedCoords);
              if (savedLoc.formatted_address) {
                setAddress(savedLoc.formatted_address);
              } else {
                reverseGeocode(savedCoords.latitude, savedCoords.longitude);
              }
              setLoadingLocation(false);
              return; // Initialized successfully with user's saved location
            }
          } catch (locErr) {
            console.warn('[HomeView] Failed to fetch user saved location profile. Falling back to GPS:', locErr);
          }
        }

        // 2. Fallback to GPS lookup if saved location is unavailable
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
        let loc = null;
        try {
          loc = await Promise.race([
            Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
            new Promise<any>((_, reject) => setTimeout(() => reject(new Error('timeout')), 2500))
          ]);
        } catch (e) {
          console.log('[HomeView] Startup GPS request timed out or failed. Fetching cached position as fallback...');
          loc = await Location.getLastKnownPositionAsync();
        }

        if (!loc) {
          throw new Error('Could not retrieve any coordinate reference.');
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
      let loc = null;
      try {
        loc = await Promise.race([
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
          new Promise<any>((_, reject) => setTimeout(() => reject(new Error('timeout')), 2500))
        ]);
      } catch (e) {
        console.log('[HomeView] Re-center GPS request timed out or failed. Fetching cached position as fallback...');
        loc = await Location.getLastKnownPositionAsync();
      }

      if (!loc) {
        throw new Error('Re-center failed to fetch location.');
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

        // Update local sheet input fields when map position is geocoded
        setLocStreet(item.street || item.name || '');
        setLocArea(item.district || item.subregion || '');
        setLocCity(item.city || '');
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

  const updateMapFromFields = async () => {
    const queryParts = [locStreet, locArea, locCity].filter(Boolean);
    if (queryParts.length === 0) {
      Alert.alert('Empty Location', 'Please enter at least one location field.');
      return;
    }
    const query = queryParts.join(', ');
    setLocSearchLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=pk&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'en',
            'User-Agent': 'KaamKrwaoApp/1.0',
          },
        }
      );
      const data = await response.json();
      if (data && data.length > 0) {
        const item = data[0];
        const newCoords = {
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
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
        setAddress(item.display_name);

        // Update fields if returned details are available
        const addr = item.address;
        if (addr) {
          setLocStreet(addr.road || addr.suburb || locStreet);
          setLocArea(addr.neighbourhood || addr.subregion || locArea);
          setLocCity(addr.city || addr.town || addr.county || locCity);
        }
        Keyboard.dismiss();
      } else {
        Alert.alert('Not Found', 'Could not locate this address on the map. Try checking the spelling.');
      }
    } catch (error) {
      console.error('Update map from fields error: ', error);
      Alert.alert('Error', 'Unable to search for this location. Please check your network.');
    } finally {
      setLocSearchLoading(false);
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
    const selectedCategoryObj = categories.find(c => c.name === activeCategory);
    if (!selectedCategoryObj) {
      Alert.alert('Selection Required', 'Please select a valid category.');
      return;
    }

    const selectedPrefObj = paymentPreferences.find(p => p.id === selectedPaymentPrefId);
    if (!selectedPrefObj) {
      Alert.alert('Payment Selection Required', 'Please select a payment preference.');
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

    const attachmentUris = attachments.map(item => item.uri);
    createTask(
      selectedCategoryObj.id,
      selectedCategoryObj.name,
      selectedPrefObj.id,
      selectedPrefObj.name,
      description,
      Number(budget),
      address,
      attachmentUris
    );
    setViewActiveTaskScreen(true);

    // Clear inputs for next time
    setBudget('');
    setDescription('');
    setAttachments([]);
  };

  const handleAddAttachment = async () => {
    if (attachments.length >= 3) {
      Alert.alert('Limit Reached', 'You can attach up to 3 images only.');
      return;
    }

    // 1. Request permissions to access the media library
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Gallery permissions are required to attach images.');
      return;
    }

    // 2. Open gallery picker UI
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 3 - attachments.length,
      quality: 0.4, // Compress image to prevent 504 Gateway Timeout over dev tunnels
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const newAttachments = result.assets.map(asset => ({
        id: Math.random().toString(),
        uri: asset.uri,
        uploading: true,
      }));

      // Set the attachment local file paths in state with upload animation
      setAttachments(prev => [...prev, ...newAttachments]);

      // Simulate network request upload latency (1.5 seconds) for each photo
      newAttachments.forEach((newAsset) => {
        setTimeout(() => {
          setAttachments(prev =>
            prev.map(item => item.id === newAsset.id ? { ...item, uploading: false } : item)
          );
        }, 1500);
      });
    }
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments(prev => prev.filter(item => item.id !== id));
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
    { top: insets.top > 0 ? insets.top + 10 : 20 }
  ];

  const valDefault = SHEET_HEIGHT - DEFAULT_HEIGHT;
  const valCollapsed = SHEET_HEIGHT - COLLAPSED_HEIGHT;

  const bottomSheetStyle = [
    styles.bottomSheet,
    {
      transform: [{ translateY: sheetTranslateY }],
      bottom: keyboardHeight,
      height: SHEET_HEIGHT,
      paddingBottom: insets.bottom > 0 ? insets.bottom + 8 : 16
    }
  ];

  const locateBtnStyle = [
    styles.locateBtn,
    {
      bottom: keyboardHeight > 0 ? keyboardHeight + DEFAULT_HEIGHT + 20 : DEFAULT_HEIGHT + 20,
      opacity: sheetTranslateY.interpolate({
        inputRange: [0, valDefault, valCollapsed],
        outputRange: [0, 1, 1],
        extrapolate: 'clamp',
      }),
      transform: [{
        translateY: sheetTranslateY.interpolate({
          inputRange: [0, valDefault, valCollapsed],
          outputRange: [100, 0, valCollapsed - valDefault],
          extrapolate: 'clamp',
        })
      }],
      pointerEvents: (sheetState === 'expanded' ? 'none' : 'auto') as any,
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
            <Ionicons name="pin" size={40} color="#EF4444" style={styles.pinIcon} />
          </View>
        )}
      </View>

      {/* NO INTERNET CONNECTION FLOATING INDICATOR */}
      {!isConnected && (
        <View style={[styles.noInternetBanner, { top: insets.top > 0 ? insets.top + 68 : 78 }]}>
          <Ionicons name="wifi-outline" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.noInternetText}>No Internet Connection</Text>
        </View>
      )}

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
          {sheetState === 'collapsed' && (
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
          style={{ maxHeight: sheetState === 'expanded' ? SHEET_HEIGHT - 60 : height * 0.4 }}
          contentContainerStyle={{ paddingBottom: insets.bottom > 0 ? insets.bottom + 10 : 16 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          scrollEnabled={sheetState !== 'collapsed'}
        >
          {/* Scrolling Categories Selection */}
          <View style={styles.sheetHeaderWithAction}>
            <Text style={styles.sheetTitle}>What service do you need?</Text>
          </View>

          {sheetState === 'expanded' ? (
            <>
              {showAllCategories ? (
                <View style={styles.categoriesGrid}>
                  {loadingCategories ? (
                    [1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                      <CategorySkeleton key={i} grid opacity={shimmerAnim} />
                    ))
                  ) : (
                    categories.map((cat) => {
                      const style = getCategoryStyle(cat.name);
                      const isSelected = activeCategory === cat.name;
                      return (
                        <Pressable
                          key={cat.id}
                          style={[styles.categoryGridCard, isSelected && styles.categoryGridCardSelected]}
                          onPress={() => setActiveCategory(cat.name)}
                        >
                          <View style={[styles.categoryIconCircle, { backgroundColor: style.color + '15' }]}>
                            <Ionicons name={style.icon as any} size={22} color={isSelected ? '#10B981' : style.color} />
                          </View>
                          <Text style={[styles.categoryGridLabel, isSelected && styles.categoryGridLabelSelected]} numberOfLines={1}>
                            {cat.name}
                          </Text>
                        </Pressable>
                      );
                    })
                  )}
                </View>
              ) : (
                <View style={styles.categoriesGridScrollContainer}>
                  <ScrollView
                    nestedScrollEnabled
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.categoriesGrid}
                  >
                    {loadingCategories ? (
                      [1, 2, 3, 4].map((i) => (
                        <CategorySkeleton key={i} grid opacity={shimmerAnim} />
                      ))
                    ) : (
                      categories.map((cat) => {
                        const style = getCategoryStyle(cat.name);
                        const isSelected = activeCategory === cat.name;
                        return (
                          <Pressable
                            key={cat.id}
                            style={[styles.categoryGridCard, isSelected && styles.categoryGridCardSelected]}
                            onPress={() => setActiveCategory(cat.name)}
                          >
                            <View style={[styles.categoryIconCircle, { backgroundColor: style.color + '15' }]}>
                              <Ionicons name={style.icon as any} size={22} color={isSelected ? '#10B981' : style.color} />
                            </View>
                            <Text style={[styles.categoryGridLabel, isSelected && styles.categoryGridLabelSelected]} numberOfLines={1}>
                              {cat.name}
                            </Text>
                          </Pressable>
                        );
                      })
                    )}
                  </ScrollView>
                </View>
              )}

              {/* Render the See All button below the grid when expanded */}
              <Pressable
                onPress={() => setShowAllCategories(!showAllCategories)}
                style={[styles.seeAllBtn, { alignSelf: 'flex-end', marginTop: 10, marginBottom: 8 }]}
              >
                <Text style={styles.seeAllBtnText}>
                  {showAllCategories ? 'Show Less' : 'See All'}
                </Text>
                <Ionicons
                  name={showAllCategories ? 'chevron-up' : 'chevron-down'}
                  size={12}
                  color="#10B981"
                  style={{ marginLeft: 4 }}
                />
              </Pressable>
            </>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesScroll}
            >
              {loadingCategories ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <CategorySkeleton key={i} opacity={shimmerAnim} />
                ))
              ) : (
                categories.map((cat) => {
                  const style = getCategoryStyle(cat.name);
                  const isSelected = activeCategory === cat.name;
                  return (
                    <Pressable
                      key={cat.id}
                      style={[styles.categoryCard, isSelected && styles.categoryCardSelected]}
                      onPress={() => setActiveCategory(cat.name)}
                    >
                      <View style={[styles.categoryIconCircle, { backgroundColor: style.color + '15' }]}>
                        <Ionicons name={style.icon as any} size={22} color={isSelected ? '#10B981' : style.color} />
                      </View>
                      <Text style={[styles.categoryLabel, isSelected && styles.categoryLabelSelected]}>
                        {cat.name}
                      </Text>
                    </Pressable>
                  );
                })
              )}
            </ScrollView>
          )}

          <View style={styles.inputContainer}>
            {/* Location / Address display (Tap to search in default/collapsed, text input in expanded) */}
            {sheetState === 'expanded' ? (
              <View style={styles.sheetLocFormContainer}>
                <Text style={styles.inputSectionTitle}>Update Location on Map</Text>

                <View style={styles.sheetLocFormRow}>
                  <View style={[styles.sheetLocInputWrapper, { flex: 1 }]}>
                    <Text style={styles.sheetLocFieldLabel}>House / Street / Building</Text>
                    <TextInput
                      style={styles.sheetLocInput}
                      placeholder="e.g. House 42, Street 3"
                      placeholderTextColor="#9CA3AF"
                      value={locStreet}
                      onChangeText={setLocStreet}
                    />
                  </View>
                </View>

                <View style={styles.sheetLocFormRow}>
                  <View style={[styles.sheetLocInputWrapper, { flex: 0.5 }]}>
                    <Text style={styles.sheetLocFieldLabel}>Area / Neighborhood</Text>
                    <TextInput
                      style={styles.sheetLocInput}
                      placeholder="e.g. DHA Phase 5"
                      placeholderTextColor="#9CA3AF"
                      value={locArea}
                      onChangeText={setLocArea}
                    />
                  </View>
                  <View style={[styles.sheetLocInputWrapper, { flex: 0.5 }]}>
                    <Text style={styles.sheetLocFieldLabel}>City</Text>
                    <TextInput
                      style={styles.sheetLocInput}
                      placeholder="e.g. Lahore"
                      placeholderTextColor="#9CA3AF"
                      value={locCity}
                      onChangeText={setLocCity}
                    />
                  </View>
                </View>



                <Pressable
                  style={[styles.sheetLocSubmitBtn, locSearchLoading && { opacity: 0.7 }]}
                  onPress={updateMapFromFields}
                  disabled={locSearchLoading}
                >
                  {locSearchLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="map-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.sheetLocSubmitBtnText}>Locate & Update Map</Text>
                    </>
                  )}
                </Pressable>

                {/* Display resolved address */}
                <View style={styles.sheetCurrentAddressBanner}>
                  <Ionicons name="location" size={14} color="#EF4444" style={{ marginRight: 6 }} />
                  <Text style={styles.sheetCurrentAddressText} numberOfLines={2}>
                    Current Map Center: {address}
                  </Text>
                </View>
              </View>
            ) : (
              <Pressable style={styles.addressPill} onPress={openSearchModal}>
                <Ionicons name="location" size={18} color="#EF4444" style={{ marginRight: 8 }} />
                <Text style={styles.addressText} numberOfLines={1}>
                  {address}
                </Text>
              </Pressable>
            )}

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
                {loadingPaymentPrefs ? (
                  [1, 2, 3].map((i) => (
                    <Animated.View
                      key={i}
                      style={[styles.paymentBtnSkeleton, { opacity: shimmerAnim }]}
                    />
                  ))
                ) : (
                  paymentPreferences.map((pm) => {
                    const isSelected = selectedPaymentPrefId === pm.id;
                    const style = getPaymentPrefStyle(pm.name);
                    return (
                      <Pressable
                        key={pm.id}
                        style={[styles.paymentBtn, isSelected && styles.paymentBtnSelected]}
                        onPress={() => setSelectedPaymentPrefId(pm.id)}
                      >
                        <Ionicons name={style.icon as any} size={18} color={isSelected ? '#10B981' : style.logoColor} />
                        <Text style={[styles.paymentBtnLabel, isSelected && styles.paymentLabelSelected]}>
                          {pm.name}
                        </Text>
                      </Pressable>
                    );
                  })
                )}
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

            {/* Attachments Section */}
            <View style={styles.attachmentsContainer}>
              <Text style={styles.attachmentsTitle}>Attachments ({attachments.length}/3)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.attachmentsRow}>
                {attachments.map((item) => (
                  <View key={item.id} style={styles.attachmentCard}>
                    <Image source={{ uri: item.uri }} style={styles.attachmentImage} />

                    {item.uploading ? (
                      <View style={styles.uploadOverlay}>
                        <ActivityIndicator size="small" color="#FFFFFF" />
                        <Text style={styles.uploadText}>Uploading</Text>
                      </View>
                    ) : (
                      <Pressable
                        style={styles.removeBtn}
                        onPress={() => handleRemoveAttachment(item.id)}
                      >
                        <Ionicons name="close-circle" size={20} color="#EF4444" />
                      </Pressable>
                    )}
                  </View>
                ))}

                {attachments.length < 3 && (
                  <Pressable style={styles.addAttachmentBtn} onPress={handleAddAttachment}>
                    <Ionicons name="camera-outline" size={20} color="#6B7280" />
                    <Text style={styles.addAttachmentText}>Add Photo</Text>
                  </Pressable>
                )}
              </ScrollView>
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
        onOpenHistory={() => router.push('/task-history')}
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
  // 3-stage sheet styles
  sheetSearchContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginVertical: 4,
  },
  inputSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4B5563',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sheetSearchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    height: 40,
  },
  sheetSearchInput: {
    flex: 1,
    height: '100%',
    fontSize: 13,
    color: '#111827',
    paddingHorizontal: 8,
  },
  sheetSearchResultsList: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  sheetSearchResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sheetSearchResultIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  sheetSearchResultNameText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  sheetSearchResultAddrText: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },
  noResultsText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  sheetCurrentAddressBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  sheetCurrentAddressText: {
    fontSize: 12,
    color: '#4B5563',
    flex: 1,
    fontWeight: '500',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 6,
    marginVertical: 4,
  },
  categoryGridCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 12,
    width: '45.5%',
    marginHorizontal: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 1,
    elevation: 1,
  },
  categoryGridCardSelected: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
    transform: [{ scale: 1.02 }],
  },
  categoryGridLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
    flex: 1,
  },
  categoryGridLabelSelected: {
    color: '#065F46',
    fontWeight: '700',
  },
  // 3-stage sheet multi-field styles
  sheetLocFormContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginVertical: 4,
    gap: 8,
  },
  sheetLocFormRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sheetLocInputWrapper: {
    flexDirection: 'column',
    gap: 4,
  },
  sheetLocFieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4B5563',
    textTransform: 'uppercase',
  },
  sheetLocInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    height: 38,
    paddingHorizontal: 10,
    fontSize: 12,
    color: '#111827',
  },
  sheetLocSubmitBtn: {
    backgroundColor: '#10B981',
    height: 38,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  sheetLocSubmitBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  categoriesGridScrollContainer: {
    height: 135,
    width: '100%',
    marginVertical: 4,
  },
  sheetHeaderWithAction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
  },
  seeAllBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  // Attachment styles
  attachmentsContainer: {
    marginTop: 10,
    marginBottom: 6,
  },
  attachmentsTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4B5563',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  attachmentsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  attachmentCard: {
    width: 60,
    height: 60,
    borderRadius: 10,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  attachmentImage: {
    width: '100%',
    height: '100%',
  },
  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
  },
  removeBtn: {
    position: 'absolute',
    top: 2,
    right: 2,
    zIndex: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },
  addAttachmentBtn: {
    width: 60,
    height: 60,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#9CA3AF',
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
  },
  addAttachmentText: {
    fontSize: 8,
    fontWeight: '600',
    color: '#6B7280',
  },
  skeletonCard: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    marginRight: 6,
  },
  skeletonGridCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    width: '45.5%',
    height: 46,
    marginHorizontal: 6,
    marginVertical: 4,
  },
  paymentBtnSkeleton: {
    flex: 1,
    height: 36,
    backgroundColor: '#E5E7EB',
    borderRadius: 9,
  },
  noInternetBanner: {
    position: 'absolute',
    left: '10%',
    right: '10%',
    alignSelf: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 6,
    zIndex: 10,
  },
  noInternetText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
