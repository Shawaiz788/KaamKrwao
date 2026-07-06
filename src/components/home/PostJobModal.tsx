import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAreasByCity, Area } from '../../../api/location';

const { width } = Dimensions.get('window');

interface PostJobModalProps {
  visible: boolean;
  onClose: () => void;
  initialCategory?: string;
  onSuccess: (jobDetails: any) => void;
}

const POST_CATEGORIES = [
  { name: 'Electrician', icon: 'flash', color: '#F97316' },
  { name: 'Plumber', icon: 'build', color: '#A855F7' },
  { name: 'AC Service', icon: 'snow', color: '#3B82F6' },
  { name: 'Tutor', icon: 'school', color: '#10B981' },
  { name: 'Mehndi', icon: 'leaf', color: '#84CC16' },
  { name: 'Cleaning', icon: 'sparkles', color: '#EAB308' },
  { name: 'Painter', icon: 'brush', color: '#EC4899' },
  { name: 'Mason', icon: 'construct', color: '#EF4444' },
  { name: 'Generator/UPS', icon: 'options', color: '#6366F1' },
  { name: 'Car Detailing', icon: 'car', color: '#06B6D4' },
  { name: 'Event Setup', icon: 'color-palette', color: '#F43F5E' },
  { name: 'Driver', icon: 'navigate', color: '#14B8A6' },
];

const CITIES = ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi'];

const STATIC_AREAS: { [key: string]: string[] } = {
  Lahore: ['DHA Phase 5', 'Gulberg III', 'Model Town', 'Johar Town', 'Cantt', 'Bahria Town Lahore'],
  Karachi: ['Clifton Block 4', 'DHA Phase 6', 'PECHS', 'Gulshan-e-Iqbal', 'North Nazimabad'],
  Islamabad: ['F-7 Markaz', 'G-11 Sector', 'E-7 Sector', 'DHA Phase 2', 'Bahria Town Islamabad'],
  Rawalpindi: ['Bahria Town Rwp', 'Saddar', 'Satellite Town', 'Adyala Road'],
};

// Hardcoded City IDs for fetching from api/location.ts
const CITY_IDS: { [key: string]: number } = {
  Lahore: 1,
  Karachi: 2,
  Islamabad: 3,
  Rawalpindi: 4,
};

export default function PostJobModal({
  visible,
  onClose,
  initialCategory,
  onSuccess,
}: PostJobModalProps) {
  const [step, setStep] = useState(1);

  // Form Fields
  const [category, setCategory] = useState(initialCategory || '');
  const [description, setDescription] = useState('');
  const [selectedCity, setSelectedCity] = useState('Lahore');
  const [selectedArea, setSelectedArea] = useState('');
  const [landmark, setLandmark] = useState('');
  const [budget, setBudget] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [paymentPref, setPaymentPref] = useState('Cash on Service');

  // Dynamic API Fetch States
  const [areas, setAreas] = useState<string[]>(STATIC_AREAS['Lahore']);
  const [loadingAreas, setLoadingAreas] = useState(false);
  const [showAreaDropdown, setShowAreaDropdown] = useState(false);
  const [postedSuccess, setPostedSuccess] = useState(false);

  // Update category if initialCategory changes
  useEffect(() => {
    if (initialCategory) {
      setCategory(initialCategory);
    }
  }, [initialCategory]);

  // Fetch areas when selected city changes
  useEffect(() => {
    const fetchAreas = async () => {
      const cityId = CITY_IDS[selectedCity];
      if (!cityId) {
        setAreas(STATIC_AREAS[selectedCity] || []);
        return;
      }

      setLoadingAreas(true);
      try {
        const fetched = await getAreasByCity(cityId);
        if (fetched && Array.isArray(fetched) && fetched.length > 0) {
          setAreas(fetched.map((a: Area) => a.name));
        } else {
          setAreas(STATIC_AREAS[selectedCity] || []);
        }
      } catch (err) {
        console.log('Error fetching areas, using static fallback:', err);
        setAreas(STATIC_AREAS[selectedCity] || []);
      } finally {
        setLoadingAreas(false);
      }
    };

    fetchAreas();
    setSelectedArea(''); // Reset area selection on city change
  }, [selectedCity]);

  // Reset form when modal closes or opens
  const handleReset = () => {
    setStep(1);
    setCategory(initialCategory || '');
    setDescription('');
    setSelectedCity('Lahore');
    setSelectedArea('');
    setLandmark('');
    setBudget('');
    setPreferredDate('');
    setPaymentPref('Cash on Service');
    setPostedSuccess(false);
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      onClose();
      handleReset();
    }
  };

  const handlePostJob = () => {
    setPostedSuccess(true);
    setTimeout(() => {
      onSuccess({
        category,
        description,
        city: selectedCity,
        area: selectedArea,
        landmark,
        budget,
        date: preferredDate,
        paymentPreference: paymentPref,
      });
      handleReset();
      onClose();
    }, 2000);
  };

  const isStep1Valid = category !== '' && description.trim().length >= 5;
  const isStep2Valid = selectedCity !== '' && selectedArea !== '' && budget !== '' && preferredDate !== '';

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {postedSuccess ? (
          <View style={styles.successOverlay}>
            <View style={styles.successIconCircle}>
              <Ionicons name="checkmark" size={60} color="#FFFFFF" />
            </View>
            <Text style={styles.successTitle}>Job Posted Successfully!</Text>
            <Text style={styles.successSub}>
              HAAN pros will respond to your request within 10 minutes.
            </Text>
            <ActivityIndicator size="small" color="#FFFFFF" style={{ marginTop: 20 }} />
          </View>
        ) : (
          <>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerRow}>
                <Pressable onPress={handleBack} style={styles.backBtn}>
                  <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </Pressable>
                <Text style={styles.headerTitle}>Post a Job</Text>
                <View style={{ width: 24 }} />
              </View>

              {/* Progress Line Bar */}
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${(step / 3) * 100}%` },
                  ]}
                />
              </View>
              <Text style={styles.stepText}>Step {step} of 3</Text>
            </View>

            {/* Scrollable Form Content */}
            <ScrollView
              style={styles.formContent}
              contentContainerStyle={{ paddingBottom: 40 }}
              keyboardShouldPersistTaps="handled"
            >
              {/* STEP 1 */}
              {step === 1 && (
                <View>
                  <Text style={styles.sectionHeading}>What do you need fixed?</Text>

                  {/* Categories Selector Grid */}
                  <View style={styles.categoriesGrid}>
                    {POST_CATEGORIES.map((cat, idx) => {
                      const isSelected = category === cat.name;
                      return (
                        <Pressable
                          key={idx}
                          style={[
                            styles.categoryCard,
                            isSelected ? styles.categoryCardActive : styles.categoryCardInactive,
                          ]}
                          onPress={() => setCategory(cat.name)}
                        >
                          <Ionicons
                            name={cat.icon as any}
                            size={24}
                            color={isSelected ? '#FFFFFF' : cat.color}
                            style={{ marginBottom: 6 }}
                          />
                          <Text
                            style={[
                              styles.categoryLabel,
                              isSelected ? styles.categoryLabelActive : styles.categoryLabelInactive,
                            ]}
                          >
                            {cat.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  {/* Describe the Job */}
                  <Text style={styles.inputLabel}>Describe the job</Text>
                  <TextInput
                    style={styles.textArea}
                    multiline
                    numberOfLines={4}
                    placeholder="E.g. Need to fix a leaking pipe under the kitchen sink..."
                    placeholderTextColor="#9CA3AF"
                    value={description}
                    onChangeText={setDescription}
                    textAlignVertical="top"
                  />
                </View>
              )}

              {/* STEP 2 */}
              {step === 2 && (
                <View>
                  {/* City Selection */}
                  <Text style={styles.inputLabel}>City</Text>
                  <View style={styles.citiesRow}>
                    {CITIES.map((city) => {
                      const isSelected = selectedCity === city;
                      return (
                        <Pressable
                          key={city}
                          style={[
                            styles.cityPill,
                            isSelected ? styles.cityPillActive : styles.cityPillInactive,
                          ]}
                          onPress={() => setSelectedCity(city)}
                        >
                          <Text
                            style={[
                              styles.cityPillText,
                              isSelected ? styles.cityPillTextActive : styles.cityPillTextInactive,
                            ]}
                          >
                            {city}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  {/* Area / Sector Select */}
                  <Text style={styles.inputLabel}>Area / Sector</Text>
                  <Pressable
                    style={styles.dropdownTrigger}
                    onPress={() => setShowAreaDropdown(!showAreaDropdown)}
                  >
                    <Text style={selectedArea ? styles.dropdownTextSelected : styles.dropdownTextPlaceholder}>
                      {selectedArea || 'Area / Sector...'}
                    </Text>
                    {loadingAreas ? (
                      <ActivityIndicator size="small" color="#10B981" />
                    ) : (
                      <Ionicons name={showAreaDropdown ? 'chevron-up' : 'chevron-down'} size={20} color="#4B5563" />
                    )}
                  </Pressable>

                  {showAreaDropdown && (
                    <View style={styles.dropdownList}>
                      {areas.map((area, idx) => (
                        <Pressable
                          key={idx}
                          style={styles.dropdownItem}
                          onPress={() => {
                            setSelectedArea(area);
                            setShowAreaDropdown(false);
                          }}
                        >
                          <Text style={styles.dropdownItemText}>{area}</Text>
                        </Pressable>
                      ))}
                    </View>
                  )}

                  {/* Nearest Landmark */}
                  <Text style={styles.inputLabel}>Nearest Landmark</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="E.g. Near Al-Fatah supermarket, DHA"
                    placeholderTextColor="#9CA3AF"
                    value={landmark}
                    onChangeText={setLandmark}
                  />

                  {/* Budget */}
                  <Text style={styles.inputLabel}>Your Budget (PKR)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Rs. 5,000"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    value={budget}
                    onChangeText={setBudget}
                  />

                  {/* Preferred Date */}
                  <Text style={styles.inputLabel}>Preferred Date</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="dd/mm/yyyy"
                    placeholderTextColor="#9CA3AF"
                    value={preferredDate}
                    onChangeText={setPreferredDate}
                  />
                </View>
              )}

              {/* STEP 3 */}
              {step === 3 && (
                <View>
                  <Text style={styles.sectionHeading}>Review & Post</Text>

                  {/* Summary Card */}
                  <View style={styles.reviewCard}>
                    <View style={styles.reviewRow}>
                      <Text style={styles.reviewLabel}>Category</Text>
                      <Text style={styles.reviewValue}>{category}</Text>
                    </View>
                    <View style={styles.reviewDivider} />

                    <View style={styles.reviewRow}>
                      <Text style={styles.reviewLabel}>Location</Text>
                      <Text style={styles.reviewValue}>
                        {selectedArea}, {selectedCity}
                      </Text>
                    </View>
                    <View style={styles.reviewDivider} />

                    <View style={styles.reviewRow}>
                      <Text style={styles.reviewLabel}>Landmark</Text>
                      <Text style={styles.reviewValue}>{landmark || 'None'}</Text>
                    </View>
                    <View style={styles.reviewDivider} />

                    <View style={styles.reviewRow}>
                      <Text style={styles.reviewLabel}>Budget</Text>
                      <Text style={styles.reviewValue}>Rs. {budget}</Text>
                    </View>
                    <View style={styles.reviewDivider} />

                    <View style={styles.reviewRow}>
                      <Text style={styles.reviewLabel}>Date</Text>
                      <Text style={styles.reviewValue}>{preferredDate}</Text>
                    </View>
                  </View>

                  {/* Payment Preference */}
                  <Text style={styles.inputLabel}>Payment Preference</Text>
                  <View style={styles.paymentGrid}>
                    {[
                      { name: 'Cash on Service', icon: 'cash-outline' },
                      { name: 'JazzCash', icon: 'phone-portrait-outline' },
                      { name: 'Easypaisa', icon: 'wallet-outline' },
                      { name: 'Bank Transfer', icon: 'business-outline' },
                    ].map((payment) => {
                      const isSelected = paymentPref === payment.name;
                      return (
                        <Pressable
                          key={payment.name}
                          style={[
                            styles.paymentCard,
                            isSelected ? styles.paymentCardActive : styles.paymentCardInactive,
                          ]}
                          onPress={() => setPaymentPref(payment.name)}
                        >
                          <Ionicons
                            name={payment.icon as any}
                            size={20}
                            color={isSelected ? '#10B981' : '#4B5563'}
                            style={{ marginRight: 8 }}
                          />
                          <Text
                            style={[
                              styles.paymentLabel,
                              isSelected ? styles.paymentLabelActive : styles.paymentLabelInactive,
                            ]}
                          >
                            {payment.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  {/* Info Shield Banner */}
                  <View style={styles.infoBanner}>
                    <Ionicons
                      name="shield-checkmark-outline"
                      size={20}
                      color="#10B981"
                      style={{ marginRight: 10 }}
                    />
                    <Text style={styles.infoBannerText}>
                      Your job will be shown to HAAN Verified pros who respond within 10 minutes.
                      Only pay after the job is done.
                    </Text>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Bottom Button Row */}
            <View style={styles.footer}>
              {step < 3 ? (
                <Pressable
                  style={[
                    styles.nextBtn,
                    step === 1 && !isStep1Valid && styles.btnDisabled,
                    step === 2 && !isStep2Valid && styles.btnDisabled,
                  ]}
                  disabled={(step === 1 && !isStep1Valid) || (step === 2 && !isStep2Valid)}
                  onPress={handleNext}
                >
                  <Text style={styles.btnText}>Next →</Text>
                </Pressable>
              ) : (
                <Pressable style={styles.postBtn} onPress={handlePostJob}>
                  <Text style={styles.btnText}>Post a Job ⚡</Text>
                </Pressable>
              )}
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#082C18',
    paddingTop: Platform.OS === 'ios' ? 45 : 15,
    paddingBottom: 15,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  progressBarBg: {
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2.5,
    marginBottom: 6,
  },
  progressBarFill: {
    height: 5,
    backgroundColor: '#FFFFFF',
    borderRadius: 2.5,
  },
  stepText: {
    color: '#A7F3D0',
    fontSize: 12,
    fontWeight: '600',
  },
  formContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  categoryCard: {
    width: (width - 60) / 3,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
  },
  categoryCardActive: {
    backgroundColor: '#082C18',
    borderColor: '#082C18',
  },
  categoryCardInactive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  categoryLabelActive: {
    color: '#FFFFFF',
  },
  categoryLabelInactive: {
    color: '#374151',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginTop: 14,
    marginBottom: 8,
  },
  textArea: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 14,
    fontSize: 14,
    color: '#1F2937',
    height: 120,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    fontSize: 14,
    color: '#1F2937',
  },
  citiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  cityPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  cityPillActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  cityPillInactive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  cityPillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  cityPillTextActive: {
    color: '#FFFFFF',
  },
  cityPillTextInactive: {
    color: '#1F2937',
  },
  dropdownTrigger: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownTextPlaceholder: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  dropdownTextSelected: {
    color: '#1F2937',
    fontSize: 14,
    fontWeight: '600',
  },
  dropdownList: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    marginTop: 4,
    maxHeight: 180,
    overflow: 'scroll',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#1F2937',
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 20,
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  reviewLabel: {
    color: '#6B7280',
    fontSize: 14,
  },
  reviewValue: {
    fontWeight: '700',
    color: '#111827',
    fontSize: 14,
  },
  reviewDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },
  paymentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  paymentCard: {
    width: (width - 50) / 2,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  paymentCardActive: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  paymentCardInactive: {
    borderColor: '#E5E7EB',
  },
  paymentLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  paymentLabelActive: {
    color: '#065F46',
  },
  paymentLabelInactive: {
    color: '#4B5563',
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  infoBannerText: {
    fontSize: 11,
    color: '#065F46',
    flex: 1,
    lineHeight: 16,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  nextBtn: {
    backgroundColor: '#34D399', // Matches the light-green button in image
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postBtn: {
    backgroundColor: '#10B981', // Matches step 3 "Post a Job" dark green
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  btnDisabled: {
    backgroundColor: '#D1D5DB',
  },
  successOverlay: {
    flex: 1,
    backgroundColor: '#082C18',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  successIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  successTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
  },
  successSub: {
    color: '#A7F3D0',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
