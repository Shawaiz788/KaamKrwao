import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

interface HomeViewProps {
  userName: string;
  onNavigateToTab: (tab: 'home' | 'browse' | 'messages' | 'profile') => void;
  onOpenPostJob: (initialCategory?: string) => void;
  onSelectPro: (proName: string) => void;
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
  {
    id: '3',
    name: 'Nadia Mehndi Art',
    category: 'Mehndi Artist',
    rating: 4.9,
    reviews: 203,
    location: 'E-7 Markaz, Islamabad',
    price: 'Rs. 2,000',
    timeEstimate: '~15 min',
    policeVerified: true,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
  },
  {
    id: '4',
    name: 'Safe Hands AC Care',
    category: 'AC Service',
    rating: 4.7,
    reviews: 54,
    location: 'Gulberg III, Lahore',
    price: 'Rs. 1,800',
    timeEstimate: '~10 min',
    policeVerified: true,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  },
  {
    id: '5',
    name: 'Clean Queen Services',
    category: 'Cleaning',
    rating: 4.8,
    reviews: 112,
    location: 'Bahria Town, Rawalpindi',
    price: 'Rs. 1,400',
    timeEstimate: '~20 min',
    policeVerified: false,
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
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

export default function HomeView({
  userName,
  onNavigateToTab,
  onOpenPostJob,
  onSelectPro,
}: HomeViewProps) {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 100 }}
      bounces={true}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Container */}
      <View style={[styles.header, { paddingTop: insets.top > 0 ? insets.top + 10 : 20 }]}>
        <View style={styles.headerTopRow}>
          <View style={styles.logoContainer}>
            <Text style={styles.greetingText}>Hi, {userName || 'User'} 👋</Text>
            <View style={styles.brandRow}>
              <View style={styles.checkmarkBadge}>
                <Ionicons name="checkmark" size={14} color="#082C18" />
              </View>
              <Text style={styles.brandName}>HAAN</Text>
            </View>
          </View>

          <View style={styles.headerControls}>
            <Pressable style={styles.locationPill}>
              <Ionicons name="location" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.locationText}>Lahore</Text>
              <Ionicons name="chevron-down" size={12} color="#FFFFFF" style={{ marginLeft: 4 }} />
            </Pressable>

            <Pressable style={styles.notificationBtn}>
              <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />
              <View style={styles.notificationBadge} />
            </Pressable>
          </View>
        </View>

        {/* Search Bar */}
        <Pressable style={styles.searchBar} onPress={() => onNavigateToTab('browse')}>
          <Ionicons name="search-outline" size={20} color="#9CA3AF" style={{ marginRight: 8 }} />
          <Text style={styles.searchPlaceholder}>Search services...</Text>
        </Pressable>
      </View>

      {/* Main Content Area */}
      <View style={styles.content}>
        {/* Categories Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <Pressable onPress={() => onNavigateToTab('browse')}>
            <Text style={styles.viewAllLink}>View all</Text>
          </Pressable>
        </View>

        <View style={styles.categoriesGrid}>
          {CATEGORIES.map((cat, index) => (
            <Pressable
              key={index}
              style={styles.categoryCard}
              onPress={() => {
                onOpenPostJob(cat.name);
              }}
            >
              <View style={[styles.categoryIconCircle]}>
                <Ionicons name={cat.icon as any} size={26} color={cat.color} />
              </View>
              <Text style={styles.categoryLabel}>{cat.name}</Text>
            </Pressable>
          ))}
        </View>

        {/* Post a Job Banner */}
        <Pressable style={styles.postJobBanner} onPress={() => onOpenPostJob()}>
          <View style={styles.bannerLeft}>
            <View style={styles.plusCircle}>
              <Ionicons name="add" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.bannerText}>
              <Text style={styles.bannerTitle}>Post a Job</Text>
              <Text style={styles.bannerSubtitle}>
                Post a job, get quotes within 10 minutes
              </Text>
            </View>
          </View>
          <View style={styles.bannerBadge}>
            <Text style={styles.bannerBadgeText}>⚡ 10 min</Text>
          </View>
        </Pressable>

        {/* Top Pros Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Top Pros Near You</Text>
          <Pressable onPress={() => onNavigateToTab('browse')}>
            <Text style={styles.viewAllLink}>View all</Text>
          </Pressable>
        </View>

        <View style={styles.prosList}>
          {MOCK_PROS.map((pro) => (
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
          ))}
        </View>
      </View>
    </ScrollView>
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
    paddingBottom: 25,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoContainer: {
    flex: 1,
  },
  greetingText: {
    color: '#D1D5DB',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkmarkBadge: {
    backgroundColor: '#34D399',
    width: 20,
    height: 20,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  brandName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 10,
  },
  locationText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  notificationBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 8,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#F97316',
    borderWidth: 1.5,
    borderColor: '#082C18',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    height: 48,
    borderRadius: 24,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchPlaceholder: {
    color: '#9CA3AF',
    fontSize: 14,
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  viewAllLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  categoryCard: {
    width: (width - 60) / 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  postJobBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#082C18',
    borderRadius: 20,
    padding: 16,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  plusCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bannerText: {
    flex: 1,
    paddingRight: 8,
  },
  bannerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  bannerSubtitle: {
    color: '#A7F3D0',
    fontSize: 11,
    fontWeight: '400',
  },
  bannerBadge: {
    backgroundColor: '#EA580C',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  bannerBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  prosList: {
    marginBottom: 30,
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
});
