import { useState, useEffect } from 'react';
import { Alert, Keyboard } from 'react-native';
import * as Location from 'expo-location';
import { getLocationById } from '@/services/location';

interface UseHomeViewLocationProps {
  user: any;
  webViewRef: React.RefObject<any>;
}

export function useHomeViewLocation({ user, webViewRef }: UseHomeViewLocationProps) {
  const [mapCoords, setMapCoords] = useState({
    latitude: 31.5204,
    longitude: 74.3587,
  });
  const [initialCoords, setInitialCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [address, setAddress] = useState('Fetching location...');

  // Search & Adjust Location States
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [pinAdjusterVisible, setPinAdjusterVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchingLocation, setSearchingLocation] = useState(false);

  // Bottom sheet direct location fields (when expanded)
  const [locStreet, setLocStreet] = useState('');
  const [locArea, setLocArea] = useState('');
  const [locCity, setLocCity] = useState('');
  const [locSearchLoading, setLocSearchLoading] = useState(false);

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

  const reCenterMap = async () => {
    try {
      setLoadingLocation(true);

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

  return {
    mapCoords,
    setMapCoords,
    initialCoords,
    setInitialCoords,
    loadingLocation,
    setLoadingLocation,
    address,
    setAddress,
    searchModalVisible,
    setSearchModalVisible,
    pinAdjusterVisible,
    setPinAdjusterVisible,
    searchQuery,
    searchResults,
    searchingLocation,
    locStreet,
    setLocStreet,
    locArea,
    setLocArea,
    locCity,
    setLocCity,
    locSearchLoading,
    reverseGeocode,
    reCenterMap,
    searchLocations,
    openSearchModal,
    selectSearchResult,
    confirmAdjustedLocation,
    updateMapFromFields,
    handleMapMessage,
  };
}
