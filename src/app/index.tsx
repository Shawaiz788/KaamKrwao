import React from 'react';
import {
  Text,
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

type ServiceItem = {
  name: string;
  icon: React.ReactNode;
  bgColor: string;
};

export default function WelcomeScreen() {
  const { isSignedIn } = useAuth();
  const router = useRouter();

  const handleContinue = () => {
    if (isSignedIn) {
      router.replace('/(protected)');
    } else {
      router.push('/sign-in');
    }
  };

  const services: ServiceItem[] = [
    {
      name: 'Electrician',
      icon: <MaterialCommunityIcons name="flash" size={24} color="#FF9800" />,
      bgColor: '#FFF3E0',
    },
    {
      name: 'Plumber',
      icon: <FontAwesome5 name="wrench" size={24} color="#9C27B0" />,
      bgColor: '#F3E5F5',
    },
    {
      name: 'AC Service',
      icon: <Ionicons name="snow" size={24} color="#2196F3" />,
      bgColor: '#E3F2FD',
    },
    {
      name: 'Tutor',
      icon: <Ionicons name="book" size={24} color="#E91E63" />,
      bgColor: '#FCE4EC',
    },
    {
      name: 'Mehndi',
      icon: <Ionicons name="leaf" size={24} color="#4CAF50" />,
      bgColor: '#E8F5E9',
    },
    {
      name: 'Cleaning',
      icon: <Ionicons name="sparkles" size={24} color="#FFD700" />,
      bgColor: '#FFFDE7',
    },
    {
      name: 'Carpenter',
      icon: <FontAwesome5 name="hammer" size={24} color="#795548" />,
      bgColor: '#EFEBE9',
    },
    {
      name: 'Painting',
      icon: <FontAwesome5 name="paint-brush" size={24} color="#009688" />,
      bgColor: '#E0F2F1',
    },
    {
      name: '+ 15 More',
      icon: <Ionicons name="grid-outline" size={24} color="#607D8B" />,
      bgColor: '#ECEFF1',
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#072212" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.headerContainer}>
          {/* Overlapping circle decorations for abstract premium background */}
          <View style={[styles.circleDeco, styles.circle1]} />
          <View style={[styles.circleDeco, styles.circle2]} />

          <View style={styles.headerTopRow}>
            {/* Logo */}
            <View style={styles.logoContainer}>
              <View style={styles.logoIconBg}>
                <Ionicons name="checkmark-sharp" size={22} color="#FFFFFF" />
              </View>
              <Text style={styles.logoText}>HAAN</Text>
            </View>

            {/* Language Selector */}
            <Pressable style={styles.langSelector}>
              <Ionicons name="globe-outline" size={16} color="#FFFFFF" />
              <Text style={styles.langSelectorText}>اردو</Text>
            </Pressable>
          </View>

          {/* Badge */}
          <View style={styles.badgeContainer}>
            <View style={styles.orangeBadge}>
              <Text style={styles.orangeBadgeText}>Yes,It's Fixed!</Text>
            </View>
          </View>
        </View>

        {/* Trust Banner */}
        <View style={styles.trustBanner}>
          <View style={styles.trustItem}>
            <Ionicons name="checkmark-circle-sharp" size={14} color="#FFFFFF" />
            <Text style={styles.trustText}>CNIC Verified</Text>
          </View>
          <View style={styles.dividerDot} />

          <View style={styles.trustItem}>
            <Ionicons name="flash-sharp" size={13} color="#FFFFFF" />
            <Text style={styles.trustText}>10-min Response</Text>
          </View>
          <View style={styles.dividerDot} />

          <View style={styles.trustItem}>
            <Ionicons name="star-sharp" size={13} color="#FFFFFF" />
            <Text style={styles.trustText}>Avg 4.7★ Rating</Text>
          </View>
        </View>

        {/* Content Body */}
        <View style={styles.contentBody}>
          {/* Services Title */}
          <Text style={styles.sectionTitle}>Services We Fix</Text>

          {/* Services Grid (3x3) */}
          <View style={styles.gridContainer}>
            {services.map((item, index) => (
              <View key={index} style={styles.serviceCard}>
                <View style={[styles.iconWrapper, { backgroundColor: item.bgColor }]}>
                  {item.icon}
                </View>
                <Text style={styles.serviceName} numberOfLines={1} adjustsFontSizeToFit>
                  {item.name}
                </Text>
              </View>
            ))}
          </View>

          {/* Stats Card */}
          <View style={styles.statsCard}>
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>3,200+</Text>
                <Text style={styles.statLabel}>Verified Pros</Text>
              </View>
              <View style={styles.verticalDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>50,000+</Text>
                <Text style={styles.statLabel}>Jobs Done</Text>
              </View>
            </View>

          </View>
        </View>
      </ScrollView>

      {/* Persistent Bottom Action Area */}
      <View style={styles.bottomActionContainer}>
        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.primaryButtonPressed
          ]}
          onPress={handleContinue}
        >
          <Text style={styles.primaryButtonText}>
            {isSignedIn ? 'Go to Dashboard' : 'Get Started'}
          </Text>
          <Ionicons name="arrow-forward-sharp" size={20} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.termsText}>
          By continuing, you agree to our Terms of Service & Privacy Policy
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  headerContainer: {
    backgroundColor: '#072212',
    height: 170,
    paddingHorizontal: 20,
    paddingTop: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  circleDeco: {
    position: 'absolute',
    borderRadius: 200,
    backgroundColor: 'rgba(28, 163, 80, 0.08)',
  },
  circle1: {
    width: 250,
    height: 250,
    top: -50,
    right: -50,
  },
  circle2: {
    width: 180,
    height: 180,
    bottom: -60,
    left: -20,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIconBg: {
    backgroundColor: '#1CA350',
    width: 34,
    height: 34,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    shadowColor: '#1CA350',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  langSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  langSelectorText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  badgeContainer: {
    marginTop: 28,
    alignItems: 'flex-start',
    zIndex: 2,
  },
  orangeBadge: {
    backgroundColor: 'rgba(255, 122, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 122, 0, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  orangeBadgeText: {
    color: '#FF9100',
    fontSize: 13,
    fontWeight: '700',
  },
  trustBanner: {
    backgroundColor: '#16A34A',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trustText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 5,
  },
  dividerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  contentBody: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#1A1D20',
    marginBottom: 16,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  serviceCard: {
    width: '30%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    shadowColor: '#0A1C10',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333333',
    textAlign: 'center',
  },
  statsCard: {
    backgroundColor: '#072212',
    borderRadius: 20,
    padding: 20,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: 'bold',
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  verticalDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  statsCardDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 14,
  },
  tagline: {
    color: '#1CA350',
    fontSize: 15,
    fontStyle: 'italic',
    fontWeight: '600',
    textAlign: 'center',
  },
  bottomActionContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  primaryButton: {
    backgroundColor: '#16A34A',
    flexDirection: 'row',
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
  },
  termsText: {
    textAlign: 'center',
    color: '#888888',
    fontSize: 11,
    marginTop: 12,
  },
});