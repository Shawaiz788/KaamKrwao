import React, { useState, useEffect } from 'react';
import {
  Text,
  StyleSheet,
  View,
  Pressable,
  StatusBar,
  Dimensions,
  Platform,
  ActivityIndicator,
  Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../provider/auth'; // Updated import
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
  const { user } = useAuth(); // Updated hook
  const router = useRouter();
  const [selectedLang, setSelectedLang] = useState<'english' | 'urdu'>('english');

  useEffect(() => {
    if (user) {
      const isProfileIncomplete = !user.displayName;
      if (isProfileIncomplete) {
        router.replace('/profile-setup');
      } else {
        router.replace('/home');
      }
    }
  }, [user]);

  const handleContinue = () => {
    if (user) { // Check user presence
      const isProfileIncomplete = !user.displayName;
      if (isProfileIncomplete) {
        router.replace('/profile-setup');
      } else {
        router.replace('/home');
      }
    } else {
      router.push('/onboardings');
    }
  };

  if (user) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0B5A3E' }}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0B5A3E" />

      <View style={styles.container}>
        {/* Top/Center Branding Area */}
        <View style={styles.brandWrapper}>
          <View style={styles.logoBox}>
            <Image
              source={require('../../assets/KaamKrwao.png')}
              style={styles.logoImage}
            />
          </View>
          <Text style={styles.brandName}>KaamKarwao</Text>
          <Text style={styles.brandSubtitle}>Find trusted local services</Text>
        </View>

        {/* Bottom Controls Area */}
        <View style={styles.controlsWrapper}>
          <Text style={styles.langLabel}>Choose your language</Text>

          <View style={styles.langRow}>
            <Pressable
              style={[
                styles.langButton,
                selectedLang === 'english' ? styles.langButtonActive : styles.langButtonInactive
              ]}
              onPress={() => setSelectedLang('english')}
            >
              <Text
                style={[
                  styles.langButtonText,
                  selectedLang === 'english' ? styles.langButtonTextActive : styles.langButtonTextInactive
                ]}
              >
                English
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.langButton,
                selectedLang === 'urdu' ? styles.langButtonActive : styles.langButtonInactive
              ]}
              onPress={() => setSelectedLang('urdu')}
            >
              <Text
                style={[
                  styles.langButtonText,
                  selectedLang === 'urdu' ? styles.langButtonTextActive : styles.langButtonTextInactive
                ]}
              >
                اردو
              </Text>
            </Pressable>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.primaryButtonPressed
            ]}
            onPress={handleContinue}
          >
            <View style={styles.primaryButtonContent}>
              <Text style={styles.primaryButtonText}>Get Started</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={styles.arrowIcon} />
            </View>
          </Pressable>

          <View style={styles.trustFooter}>
            <View style={styles.trustColumn}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#0B5A3E" />
              <Text style={styles.trustText}>Verified</Text>
            </View>
            <View style={styles.trustColumn}>
              <Ionicons name="people-outline" size={20} color="#0B5A3E" />
              <Text style={styles.trustText}>Trusted</Text>
            </View>
            <View style={styles.trustColumn}>
              <Ionicons name="wallet-outline" size={20} color="#0B5A3E" />
              <Text style={styles.trustText}>Easy Pay</Text>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0B5A3E',
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  brandWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
    paddingHorizontal: 24,
  },
  logoBox: {
    width: 90,
    height: 90,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  rotatedContainer: {
    transform: [{ rotate: '-15deg' }],
  },
  logoImage: {
    width: 90,
    height: 90,
    borderRadius: 24,
    resizeMode: 'contain',
    overflow: 'hidden'
  },
  hammerEmoji: {
    fontSize: 38,
  },
  brandName: {
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginTop: 18,
    textAlign: 'center',
  },
  brandSubtitle: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
  controlsWrapper: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: Platform.OS === 'ios' ? 24 : 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 5,
  },
  langLabel: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  langRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  langButton: {
    width: '48%',
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  langButtonActive: {
    backgroundColor: '#0B5A3E',
    borderColor: '#0B5A3E',
  },
  langButtonInactive: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  langButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  langButtonTextActive: {
    color: '#FFFFFF',
  },
  langButtonTextInactive: {
    color: '#374151',
  },
  primaryButton: {
    backgroundColor: '#D97706',
    width: '100%',
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  primaryButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 6,
  },
  arrowIcon: {
    marginTop: 1,
  },
  trustFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 32,
    width: '100%',
  },
  trustColumn: {
    alignItems: 'center',
    flex: 1,
  },
  trustText: {
    color: '#4B5563',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
  },
});
