import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeInRight,
} from 'react-native-reanimated';
import * as NavigationBar from 'expo-navigation-bar';


const { width, height } = Dimensions.get('window');

// Slide 1 Illustration (Handyman/Electrician profile & tools)
const Illustration1 = () => (
  <View style={styles.illustrationContainer}>
    {/* Background glowing shape */}
    <View style={styles.glowCircle} />

    {/* Large House Outline (geometric backdrop) */}
    <View style={styles.houseOutline}>
      <Ionicons name="home-outline" size={170} color="rgba(16, 185, 129, 0.08)" />
    </View>

    {/* Pakistan Verification Badge */}
    <View style={styles.pakBadge}>
      <Text style={styles.pakBadgeText}>🇵🇰 Pakistan's #1 Network</Text>
    </View>

    {/* Provider Profile Showcase Card */}
    <View style={styles.providerCard}>
      <View style={styles.profileRow}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person" size={20} color="#0F5C43" />
        </View>
        <View style={styles.providerDetails}>
          <View style={styles.nameRow}>
            <Text style={styles.providerName}>Junaid Ahmed</Text>
            <Ionicons name="checkmark-circle" size={14} color="#10B981" style={{ marginLeft: 3 }} />
          </View>
          <Text style={styles.providerType}>Verified Electrician</Text>
        </View>
      </View>
      <View style={styles.ratingRow}>
        <Ionicons name="star" size={12} color="#FBBF24" />
        <Text style={styles.ratingText}>4.9 (124 jobs completed)</Text>
      </View>
    </View>

    {/* Floating Tool Badge - Hammer */}
    <View style={[styles.floatingBadge, styles.badgeHammer]}>
      <Ionicons name="hammer" size={18} color="#0F5C43" />
    </View>

    {/* Floating Tool Badge - Wrench */}
    <View style={[styles.floatingBadge, styles.badgeWrench]}>
      <Ionicons name="build" size={18} color="#0F5C43" />
    </View>
  </View>
);

// Slide 2 Illustration (Location map pins & searching radar)
const Illustration2 = () => (
  <View style={styles.illustrationContainer}>
    {/* Radar Rings (Concentric Circles) */}
    <View style={[styles.radarRing, styles.radarRingLarge]} />
    <View style={[styles.radarRing, styles.radarRingMedium]} />
    <View style={[styles.radarRing, styles.radarRingSmall]} />

    {/* Glowing Center Core */}
    <View style={styles.glowingCenter} />

    {/* Central Location Pin */}
    <View style={styles.centerPinWrapper}>
      <Ionicons name="location" size={36} color="#10B981" />
      <View style={styles.pinShadow} />
    </View>

    {/* Location Label Badge */}
    <View style={styles.locationBadge}>
      <Ionicons name="navigate" size={10} color="#0F5C43" style={{ marginRight: 4 }} />
      <Text style={styles.locationBadgeText}>Sector F-7, Islamabad</Text>
    </View>

    {/* Floating nearby worker 1 */}
    <View style={[styles.nearbyWorker, styles.workerPos1]}>
      <View style={styles.avatarMini}>
        <Text style={styles.avatarText}>NK</Text>
      </View>
      <View style={styles.onlineDot} />
    </View>

    {/* Floating nearby worker 2 */}
    <View style={[styles.nearbyWorker, styles.workerPos2]}>
      <View style={styles.avatarMini}>
        <Text style={styles.avatarText}>AS</Text>
      </View>
      <View style={styles.onlineDot} />
    </View>

    {/* Floating nearby worker 3 */}
    <View style={[styles.nearbyWorker, styles.workerPos3]}>
      <View style={styles.avatarMini}>
        <Text style={styles.avatarText}>ZA</Text>
      </View>
      <View style={styles.onlineDot} />
    </View>

    {/* Booking Confirmed Popup Card */}
    <View style={styles.confirmationCard}>
      <View style={styles.cardHeaderRow}>
        <View style={styles.checkWrapper}>
          <Ionicons name="checkmark" size={14} color="#FFFFFF" />
        </View>
        <Text style={styles.confirmationTitle}>Booking Confirmed</Text>
      </View>
      <Text style={styles.confirmationDetails}>Arsalan is arriving in 20 min</Text>
      <View style={styles.starsRow}>
        <Ionicons name="star" size={11} color="#FBBF24" />
        <Ionicons name="star" size={11} color="#FBBF24" />
        <Ionicons name="star" size={11} color="#FBBF24" />
        <Ionicons name="star" size={11} color="#FBBF24" />
        <Ionicons name="star" size={11} color="#FBBF24" />
      </View>
    </View>
  </View>
);

// Slide 3 Illustration (Provider earnings dashboard & job requests)
const Illustration3 = () => (
  <View style={styles.illustrationContainer}>
    {/* Background glowing shape */}
    <View style={styles.glowCircle} />

    {/* Accept Request Card Component */}
    <View style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <View style={styles.alertPulse} />
        <Text style={styles.requestLabel}>New Job Request</Text>
      </View>
      <Text style={styles.requestTitle}>AC Maintenance & Repair</Text>
      <Text style={styles.requestLocation}>Sector G-11 • Zainab A.</Text>

      <View style={styles.acceptMockBtn}>
        <Text style={styles.acceptMockBtnText}>Accept Request</Text>
      </View>
    </View>

    {/* Floating Wallet Earnings Card */}
    <View style={styles.walletCard}>
      <View style={styles.walletHeader}>
        <Ionicons name="wallet-outline" size={12} color="#0F5C43" />
        <Text style={styles.walletLabel}>My Wallet</Text>
      </View>
      <Text style={styles.walletAmount}>Rs. 24,500</Text>

      {/* Micro-sparkline columns */}
      <View style={styles.sparklineRow}>
        <View style={[styles.sparklineBar, { height: 8 }]} />
        <View style={[styles.sparklineBar, { height: 14 }]} />
        <View style={[styles.sparklineBar, { height: 11 }]} />
        <View style={[styles.sparklineBar, { height: 18 }]} />
        <View style={[styles.sparklineBar, { height: 26, backgroundColor: '#10B981' }]} />
      </View>
    </View>

    {/* Customer Review Bubble */}
    <View style={styles.reviewBubble}>
      <Text style={styles.reviewText}>Bohot acchi service! ⭐⭐⭐⭐⭐</Text>
      <View style={styles.bubbleTail} />
    </View>

    {/* Success Badge */}
    <View style={styles.badgeSuccess}>
      <Ionicons name="trophy" size={11} color="#FBBF24" style={{ marginRight: 4 }} />
      <Text style={styles.badgeSuccessText}>Top Partner</Text>
    </View>
  </View>
);

export default function OnboardingScreen1() {
  const router = useRouter();
  const [page, setPage] = useState(1);

  // Use light button icons on Android to remove the contrast background scrim and make the navigation bar transparent over our green background
  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setButtonStyleAsync('light');
    }
    return () => {
      if (Platform.OS === 'android') {
        NavigationBar.setButtonStyleAsync('dark');
      }
    };
  }, []);

  // Shared Animation Values (Progress Indicators)
  const progress1 = useSharedValue(1);
  const progress2 = useSharedValue(0);
  const progress3 = useSharedValue(0);

  // Trigger animations when the page switches
  useEffect(() => {
    progress1.value = withTiming(page >= 1 ? 1 : 0, { duration: 350 });
    progress2.value = withTiming(page >= 2 ? 1 : 0, { duration: 350 });
    progress3.value = withTiming(page >= 3 ? 1 : 0, { duration: 350 });
  }, [page]);

  // Animated Styles
  const animatedProgressStyle1 = useAnimatedStyle(() => ({
    width: `${progress1.value * 100}%`,
  }));
  const animatedProgressStyle2 = useAnimatedStyle(() => ({
    width: `${progress2.value * 100}%`,
  }));
  const animatedProgressStyle3 = useAnimatedStyle(() => ({
    width: `${progress3.value * 100}%`,
  }));

  const handleNext = () => {
    if (page < 3) {
      setPage(page + 1);
    } else {
      router.replace('/(auth)/sign-in');
    }
  };

  const handleBack = () => {
    if (page > 1) {
      setPage(page - 1);
    } else {
      router.back();
    }
  };

  const handleSkip = () => {
    router.replace('/(auth)/sign-in');
  };

  const getCardBgColor = () => {
    if (page === 1) return '#FDFBF7';
    if (page === 2) return '#F4F7F5';
    return '#FCFCFC';
  };

  const getPageTitle = () => {
    if (page === 1) return "Pakistan Ka Apna\nService Platform";
    if (page === 2) return "Hire Any Service\nIn Minutes";
    return "Professionals -\nGrow Your Business";
  };

  const getPageSubtitle = () => {
    if (page === 1) {
      return "Ghar baithe hire karein background-verified local professionals. Fast, reliable, and premium quality.";
    }
    if (page === 2) {
      return "Plumber, electrician, painter - compare verified ratings and book nearby help instantly.";
    }
    return "List your skills, accept local jobs, and build a trusted reputation. Hundreds of daily requests.";
  };

  const getButtonText = () => {
    if (page === 3) return "Get Started";
    return "Continue";
  };

  const getButtonIcon = () => {
    if (page === 3) return "rocket-outline";
    return "arrow-forward";
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0F5C43" />

      {/* Elegant Header with Segmented Progress */}
      <View style={styles.header}>
        <View style={styles.progressContainer}>
          <View style={styles.progressSegmentTrack}>
            <Animated.View style={[styles.progressSegmentFill, animatedProgressStyle1]} />
          </View>
          <View style={styles.progressSegmentTrack}>
            <Animated.View style={[styles.progressSegmentFill, animatedProgressStyle2]} />
          </View>
          <View style={styles.progressSegmentTrack}>
            <Animated.View style={[styles.progressSegmentFill, animatedProgressStyle3]} />
          </View>
        </View>
        <Pressable style={styles.skipBtn} onPress={handleSkip} hitSlop={12}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      {/* Main Container / Hero Card */}
      <View style={styles.cardWrapper}>
        <View style={[styles.heroCard, { backgroundColor: getCardBgColor() }]}>

          {/* Animated Card Content (Smooth slide and fade transition) */}
          {page === 1 && (
            <Animated.View
              key="page1"
              entering={FadeInRight.duration(300)}
              style={styles.innerCard}
            >
              <Illustration1 />
              <View style={styles.textContainer}>
                <Text style={styles.slideTitle}>{getPageTitle()}</Text>
                <Text style={styles.slideSubtitle}>{getPageSubtitle()}</Text>
              </View>
            </Animated.View>
          )}

          {page === 2 && (
            <Animated.View
              key="page2"
              entering={FadeInRight.duration(300)}
              style={styles.innerCard}
            >
              <Illustration2 />
              <View style={styles.textContainer}>
                <Text style={styles.slideTitle}>{getPageTitle()}</Text>
                <Text style={styles.slideSubtitle}>{getPageSubtitle()}</Text>
              </View>
            </Animated.View>
          )}

          {page === 3 && (
            <Animated.View
              key="page3"
              entering={FadeInRight.duration(300)}
              style={styles.innerCard}
            >
              <Illustration3 />
              <View style={styles.textContainer}>
                <Text style={styles.slideTitle}>{getPageTitle()}</Text>
                <Text style={styles.slideSubtitle}>{getPageSubtitle()}</Text>
              </View>
            </Animated.View>
          )}

        </View>
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <Pressable style={styles.backBtn} onPress={handleBack} accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </Pressable>

        <Pressable style={styles.nextBtnWrapper} onPress={handleNext}>
          <LinearGradient
            colors={['#10B981', '#059669']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.nextBtnGradient}
          >
            <Text style={styles.nextBtnText}>{getButtonText()}</Text>
            <Ionicons name={getButtonIcon() as any} size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
          </LinearGradient>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F5C43',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    flex: 1,
    height: 3,
    gap: 6,
    marginRight: 24,
  },
  progressSegmentTrack: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressSegmentFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 2,
  },
  skipBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  skipText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  cardWrapper: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  heroCard: {
    borderRadius: 32,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  innerCard: {
    justifyContent: 'center',
  },
  illustrationContainer: {
    height: height * 0.33,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderRadius: 24,
    backgroundColor: 'rgba(15, 92, 67, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(15, 92, 67, 0.05)',
  },
  glowCircle: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  houseOutline: {
    position: 'absolute',
    opacity: 0.9,
  },
  pakBadge: {
    position: 'absolute',
    top: 14,
    backgroundColor: '#FFFFFF',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(15, 92, 67, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  pakBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F5C43',
  },
  providerCard: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(15, 92, 67, 0.08)',
    shadowColor: '#0F5C43',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E6F4F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  providerDetails: {
    marginLeft: 10,
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  providerName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },
  providerType: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 6,
  },
  ratingText: {
    fontSize: 10,
    color: '#4B5563',
    fontWeight: '600',
    marginLeft: 4,
  },
  floatingBadge: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(15, 92, 67, 0.08)',
  },
  badgeHammer: {
    top: 55,
    left: 24,
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  badgeWrench: {
    top: 90,
    right: 28,
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  radarRing: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.1)',
    borderStyle: 'dashed',
  },
  radarRingLarge: {
    width: 250,
    height: 250,
  },
  radarRingMedium: {
    width: 170,
    height: 170,
  },
  radarRingSmall: {
    width: 90,
    height: 90,
  },
  glowingCenter: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  centerPinWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateY: -10 }],
  },
  pinShadow: {
    width: 12,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    marginTop: -2,
  },
  locationBadge: {
    position: 'absolute',
    top: 14,
    backgroundColor: '#FFFFFF',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(15, 92, 67, 0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  locationBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F5C43',
  },
  nearbyWorker: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  avatarMini: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#4B5563',
  },
  onlineDot: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  workerPos1: {
    top: 50,
    left: 45,
  },
  workerPos2: {
    bottom: 120,
    right: 50,
  },
  workerPos3: {
    top: 80,
    right: 70,
  },
  confirmationCard: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.15)',
    shadowColor: '#0F5C43',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  checkWrapper: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  confirmationTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
  },
  confirmationDetails: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
    marginLeft: 24,
    marginBottom: 4,
  },
  starsRow: {
    flexDirection: 'row',
    marginLeft: 24,
    gap: 2,
  },
  requestCard: {
    position: 'absolute',
    top: 14,
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(15, 92, 67, 0.08)',
    shadowColor: '#0F5C43',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  alertPulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
    marginRight: 6,
  },
  requestLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#EF4444',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  requestTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  requestLocation: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 10,
  },
  acceptMockBtn: {
    backgroundColor: '#10B981',
    borderRadius: 10,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptMockBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  walletCard: {
    position: 'absolute',
    bottom: 14,
    left: 16,
    width: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(15, 92, 67, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  walletLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: '#6B7280',
    marginLeft: 3,
    textTransform: 'uppercase',
  },
  walletAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F5C43',
    marginBottom: 6,
  },
  sparklineRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 26,
    gap: 3,
  },
  sparklineBar: {
    flex: 1,
    backgroundColor: '#E6F4F0',
    borderRadius: 2,
  },
  reviewBubble: {
    position: 'absolute',
    bottom: 48,
    right: 16,
    width: 140,
    backgroundColor: '#0F5C43',
    borderRadius: 14,
    borderBottomRightRadius: 2,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  reviewText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 12,
  },
  bubbleTail: {
    position: 'absolute',
    right: 0,
    bottom: -6,
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 0,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#0F5C43',
  },
  badgeSuccess: {
    position: 'absolute',
    bottom: 14,
    right: 16,
    backgroundColor: '#FFFFFF',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  badgeSuccessText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#D97706',
  },
  textContainer: {
    marginTop: 20,
    paddingHorizontal: 4,
  },
  slideTitle: {
    color: '#0F5C43',
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 34,
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  slideSubtitle: {
    color: '#4B5563',
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '400',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 12 : 24,
    paddingTop: 12,
  },
  backBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextBtnWrapper: {
    flex: 1,
    marginLeft: 16,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  nextBtnGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  nextBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
