import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SearchLocationModalProps {
  visible: boolean;
  onClose: () => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  searchResults: any[];
  searchingLocation: boolean;
  onSelectResult: (item: any) => void;
  openPinAdjuster: () => void;
  insets: { top: number; bottom: number };
}

/**
 * Sub-component to render an individual search result card.
 */
function SearchResultItem({ item, onPress }: { item: any; onPress: () => void }) {
  const getIconName = (t: string): any => {
    const type = (t || '').toLowerCase();
    if (['university', 'college', 'school', 'kindergarten'].includes(type)) return 'school-outline';
    if (['shop', 'mall', 'supermarket', 'store', 'marketplace'].includes(type)) return 'basket-outline';
    if (['restaurant', 'cafe', 'fast_food', 'food'].includes(type)) return 'restaurant-outline';
    if (['hospital', 'clinic', 'pharmacy', 'doctors'].includes(type)) return 'medical-outline';
    if (['park', 'garden', 'pitch'].includes(type)) return 'leaf-outline';
    if (['residential', 'suburb', 'neighbourhood', 'house'].includes(type)) return 'home-outline';
    return 'location-outline';
  };

  return (
    <Pressable style={styles.searchResultItem} onPress={onPress}>
      <View style={styles.searchResultIconCircle}>
        <Ionicons name={getIconName(item.type)} size={18} color="#10B981" />
      </View>
      <View style={styles.searchResultTextContainer}>
        <Text style={styles.searchResultName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.searchResultAddress} numberOfLines={2}>
          {item.address}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
    </Pressable>
  );
}

export default function SearchLocationModal({
  visible,
  onClose,
  searchQuery,
  onSearchQueryChange,
  searchResults,
  searchingLocation,
  onSelectResult,
  openPinAdjuster,
  insets,
}: SearchLocationModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.searchModalContainer}>
        {/* Header Search Input Row */}
        <View style={[styles.searchHeaderRow, { paddingTop: insets.top > 0 ? insets.top + 10 : 20 }]}>
          <Pressable onPress={onClose} style={styles.searchBackBtn}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </Pressable>
          
          <View style={styles.searchInputWrapper}>
            <Ionicons name="search-outline" size={18} color="#9CA3AF" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchTextInput}
              placeholder="Search area, road, or landmark..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={onSearchQueryChange}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <Pressable 
                onPress={() => { onSearchQueryChange(''); }} 
                style={styles.searchClearBtn}
              >
                <Ionicons name="close-circle" size={18} color="#9CA3AF" />
              </Pressable>
            )}
          </View>
          
          <Pressable onPress={() => { onClose(); openPinAdjuster(); }} style={styles.searchMapBtn}>
            <Text style={styles.searchMapBtnText}>Map</Text>
          </Pressable>
        </View>

        {/* Searching Loader indicator */}
        {searchingLocation && (
          <ActivityIndicator size="small" color="#10B981" style={{ marginVertical: 20 }} />
        )}

        {/* Results List */}
        {!searchingLocation && searchQuery.length >= 2 && searchResults.length === 0 ? (
          <View style={styles.emptySearchContainer}>
            <Ionicons name="search-outline" size={40} color="#D1D5DB" />
            <Text style={styles.emptySearchTitle}>No locations found</Text>
            <Text style={styles.emptySearchSubText}>
              Try searching for a nearby area, sector, or main road name.
            </Text>
            <Pressable
              style={styles.pinFallbackBtn}
              onPress={() => {
                onClose();
                openPinAdjuster();
              }}
            >
              <Ionicons name="location" size={16} color="#10B981" style={{ marginRight: 6 }} />
              <Text style={styles.pinFallbackBtnText}>Select location on Map</Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView style={styles.searchResultsList} keyboardShouldPersistTaps="handled">
            {searchResults.map((item) => (
              <SearchResultItem 
                key={item.id} 
                item={item} 
                onPress={() => onSelectResult(item)} 
              />
            ))}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
  },
  searchBackBtn: {
    padding: 4,
    marginRight: 8,
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
    fontWeight: '500',
  },
  searchClearBtn: {
    padding: 2,
  },
  searchMapBtn: {
    marginLeft: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#082C18',
    borderRadius: 8,
  },
  searchMapBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  searchResultsList: {
    flex: 1,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  searchResultIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  searchResultTextContainer: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  searchResultAddress: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    lineHeight: 16,
  },
  emptySearchContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  emptySearchTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginTop: 12,
  },
  emptySearchSubText: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  pinFallbackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  pinFallbackBtnText: {
    color: '#065F46',
    fontWeight: '600',
    fontSize: 13,
  },
});
