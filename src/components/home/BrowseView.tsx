import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Image,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MOCK_PROS, CATEGORIES, Pro } from './HomeView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from 'expo-router';

interface BrowseViewProps {
  initialCategory?: string;
  onSelectPro: (proName: string) => void;
}

const CITIES = ['All Cities', 'Lahore', 'Karachi', 'Islamabad', 'Rawalpindi'];

export default function BrowseView({
  initialCategory = 'All',
  onSelectPro,
}: BrowseViewProps) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    });
    return unsubscribe;
  }, [navigation]);

  const [selectedCity, setSelectedCity] = useState('All Cities');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPros, setFilteredPros] = useState<Pro[]>(MOCK_PROS);

  // Apply filters whenever states change
  useEffect(() => {
    let result = MOCK_PROS;

    // Filter by city
    if (selectedCity !== 'All Cities') {
      result = result.filter((pro) =>
        pro.location.toLowerCase().includes(selectedCity.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'All') {
      result = result.filter((pro) => {
        // Mehndi matches Mehndi Artist, etc.
        const catName = selectedCategory.toLowerCase();
        return pro.category.toLowerCase().includes(catName) || catName.includes(pro.category.toLowerCase());
      });
    }

    // Filter by search query
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (pro) =>
          pro.name.toLowerCase().includes(query) ||
          pro.category.toLowerCase().includes(query) ||
          pro.location.toLowerCase().includes(query)
      );
    }

    setFilteredPros(result);
  }, [selectedCity, selectedCategory, searchQuery]);

  return (
    <View style={styles.container}>
      {/* Header Container */}
      <View style={[styles.header, { paddingTop: insets.top > 0 ? insets.top + 10 : 20 }]}>
        <Text style={styles.headerTitle}>Browse</Text>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color="#9CA3AF" style={{ marginRight: 8 }} />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Search services..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery !== '' && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </Pressable>
          )}
        </View>

        {/* Cities Horizontal Scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.citiesScroll}
          contentContainerStyle={styles.citiesScrollContent}
        >
          {CITIES.map((city) => {
            const isActive = selectedCity === city;
            return (
              <Pressable
                key={city}
                style={[styles.cityBadge, isActive ? styles.cityBadgeActive : styles.cityBadgeInactive]}
                onPress={() => setSelectedCity(city)}
              >
                <Text style={[styles.cityText, isActive ? styles.cityTextActive : styles.cityTextInactive]}>
                  {city}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Category Selection Filter (Below header, light background) */}
      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          <Pressable
            style={[
              styles.filterBadge,
              selectedCategory === 'All' ? styles.filterBadgeActive : styles.filterBadgeInactive,
            ]}
            onPress={() => setSelectedCategory('All')}
          >
            <Text
              style={[
                styles.filterText,
                selectedCategory === 'All' ? styles.filterTextActive : styles.filterTextInactive,
              ]}
            >
              All
            </Text>
          </Pressable>

          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.name;
            return (
              <Pressable
                key={cat.name}
                style={[
                  styles.filterBadge,
                  isActive ? styles.filterBadgeActive : styles.filterBadgeInactive,
                  { flexDirection: 'row', alignItems: 'center' },
                ]}
                onPress={() => setSelectedCategory(cat.name)}
              >
                <Ionicons
                  name={cat.icon as any}
                  size={14}
                  color={isActive ? '#FFFFFF' : cat.color}
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={[
                    styles.filterText,
                    isActive ? styles.filterTextActive : styles.filterTextInactive,
                  ]}
                >
                  {cat.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Content Area */}
      <ScrollView style={styles.resultsContainer} contentContainerStyle={styles.resultsContent}>
        <Text style={styles.resultsCount}>
          {filteredPros.length} {filteredPros.length === 1 ? 'pro' : 'pros'} found
        </Text>

        {filteredPros.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={48} color="#9CA3AF" style={{ marginBottom: 12 }} />
            <Text style={styles.emptyTextTitle}>No pros found</Text>
            <Text style={styles.emptyTextSub}>Try adjusting your filters or search query</Text>
          </View>
        ) : (
          filteredPros.map((pro) => (
            <Pressable
              key={pro.id}
              style={styles.proCard}
              onPress={() => onSelectPro(pro.name)}
            >
              <View style={styles.proCardTop}>
                <View style={styles.avatarContainer}>
                  <Image source={{ uri: pro.avatar }} style={styles.proAvatar} />
                  {pro.policeVerified && (
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="checkmark-circle" size={14} color="#16A34A" />
                    </View>
                  )}
                </View>

                <View style={styles.proDetails}>
                  <Text style={styles.proName}>{pro.name}</Text>
                  <Text style={styles.proCategory}>{pro.category}</Text>

                  <View style={styles.ratingRow}>
                    <View style={styles.starsContainer}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Ionicons
                          key={star}
                          name={star <= Math.floor(pro.rating) ? 'star' : 'star-outline'}
                          size={14}
                          color="#F59E0B"
                          style={{ marginRight: 2 }}
                        />
                      ))}
                    </View>
                    <Text style={styles.ratingText}>
                      {pro.rating} ({pro.reviews})
                    </Text>
                  </View>

                  <View style={styles.locationRow}>
                    <Ionicons name="location-outline" size={12} color="#6B7280" style={{ marginRight: 4 }} />
                    <Text style={styles.locationTextSmall}>{pro.location}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.proCardBottom}>
                <View>
                  <Text style={styles.priceLabel}>Starting from</Text>
                  <Text style={styles.priceText}>{pro.price}</Text>
                </View>

                <View style={styles.badgeRow}>
                  <View style={styles.timeBadge}>
                    <Ionicons name="flash" size={12} color="#F97316" style={{ marginRight: 2 }} />
                    <Text style={styles.timeBadgeText}>{pro.timeEstimate}</Text>
                  </View>

                  {pro.policeVerified && (
                    <View style={styles.policeVerifiedBadge}>
                      <Text style={styles.policeVerifiedText}>Police Verified</Text>
                    </View>
                  )}
                </View>
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#082C18',
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    height: 48,
    borderRadius: 24,
    paddingHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
    padding: 0, // React Native TextInput default padding removal
  },
  citiesScroll: {
    marginBottom: 4,
  },
  citiesScrollContent: {
    paddingRight: 10,
  },
  cityBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
    marginRight: 8,
  },
  cityBadgeActive: {
    backgroundColor: '#FFFFFF',
  },
  cityBadgeInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  cityText: {
    fontSize: 13,
    fontWeight: '700',
  },
  cityTextActive: {
    color: '#082C18',
  },
  cityTextInactive: {
    color: '#E5E7EB',
  },
  filterSection: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  filterScrollContent: {
    paddingHorizontal: 20,
  },
  filterBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
  },
  filterBadgeActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  filterBadgeInactive: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  filterTextInactive: {
    color: '#4B5563',
  },
  resultsContainer: {
    flex: 1,
  },
  resultsContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
  },
  resultsCount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
  },
  proCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  proCardTop: {
    flexDirection: 'row',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 14,
  },
  proAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E5E7EB',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  proDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  proName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  proCategory: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: 6,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationTextSmall: {
    fontSize: 12,
    color: '#6B7280',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 12,
  },
  proCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#10B981',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 6,
  },
  timeBadgeText: {
    fontSize: 11,
    color: '#C2410C',
    fontWeight: '600',
  },
  policeVerifiedBadge: {
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  policeVerifiedText: {
    fontSize: 11,
    color: '#C2410C',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyTextTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 4,
  },
  emptyTextSub: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
});
