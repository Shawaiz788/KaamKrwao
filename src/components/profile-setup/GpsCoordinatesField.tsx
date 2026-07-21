import React from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface GpsCoordinatesFieldProps {
  latitude: number | null;
  longitude: number | null;
  loadingGps: boolean;
  onOpenMap: () => void;
  onFetchGps: () => void;
}

export default function GpsCoordinatesField({
  latitude,
  longitude,
  loadingGps,
  onOpenMap,
  onFetchGps,
}: GpsCoordinatesFieldProps) {
  return (
    <View style={styles.inputWrapper}>
      <Text style={styles.label}>Pin Location / GPS Coordinates</Text>
      <View style={styles.gpsRow}>
        <TextInput
          style={[
            styles.textInput,
            styles.inputFieldContainer,
            { flex: 1, marginRight: 8, backgroundColor: '#F3F4F6', color: '#4B5563', paddingHorizontal: 8 },
          ]}
          placeholder="Lat"
          placeholderTextColor="#9CA3AF"
          editable={false}
          value={latitude !== null ? latitude.toFixed(6) : ''}
        />
        <TextInput
          style={[
            styles.textInput,
            styles.inputFieldContainer,
            { flex: 1, marginRight: 8, backgroundColor: '#F3F4F6', color: '#4B5563', paddingHorizontal: 8 },
          ]}
          placeholder="Lng"
          placeholderTextColor="#9CA3AF"
          editable={false}
          value={longitude !== null ? longitude.toFixed(6) : ''}
        />
        <Pressable style={styles.mapTriggerBtn} onPress={onOpenMap}>
          <Ionicons name="map-outline" size={20} color="#FFFFFF" />
        </Pressable>
        <Pressable
          style={[styles.gpsBtnSquare, loadingGps && styles.gpsBtnLoading]}
          onPress={onFetchGps}
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
  );
}

const styles = StyleSheet.create({
  inputWrapper: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  gpsRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  textInput: {
    flex: 1,
    height: '100%',
    color: '#111827',
    fontSize: 15,
    fontWeight: '500',
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
