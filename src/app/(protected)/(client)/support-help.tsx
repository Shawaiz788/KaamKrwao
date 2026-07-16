import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface FaqItem {
  question: string;
  answer: string;
}

export default function SupportHelpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const faqs: FaqItem[] = [
    {
      question: 'How do I book a service on KaamKrwao?',
      answer: 'Simply tap the "Post a Job" action button on the home screen, select a category, write down details (budget, preference, description), and publish it. Professionals will bid on your task shortly.',
    },
    {
      question: 'How do I cancel my service request?',
      answer: 'Open the drawer and select your "Active Request". Scroll to the bottom of the active bidding or progress screen and click "Cancel Job Request". The status will update automatically.',
    },
    {
      question: 'How do payments work?',
      answer: 'Payments are handled based on the preference specified during job posting. We support Cash, Bank Transfer, and Card payments directly between you and the professional.',
    },
    {
      question: 'What if the professional does not show up?',
      answer: 'If a professional does not arrive within the agreed time, you can cancel the task or contact our help center via "Chat with Support" below to assign another professional.',
    },
  ];

  const handleSubmitFeedback = () => {
    if (!feedback.trim()) {
      Alert.alert('Error', 'Please enter your feedback message.');
      return;
    }

    setIsSubmitting(true);
    // Simulating API submit
    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert('Thank You', 'Your feedback has been submitted successfully. We appreciate your support!');
      setFeedback('');
    }, 1500);
  };

  const handleContact = (method: string) => {
    Alert.alert('Contact Support', `Initiating support request via ${method}...`);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: '#F9FAFB' }}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top > 0 ? insets.top + 10 : 20 }]}>
        <View style={styles.headerTop}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.headerTitle}>Support & Help</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Support Options cards */}
        <Text style={styles.sectionHeader}>Quick Help</Text>
        <View style={styles.supportRow}>
          <Pressable style={styles.supportPill} onPress={() => handleContact('Live Chat')}>
            <Ionicons name="chatbubbles-outline" size={20} color="#16A34A" />
            <Text style={styles.supportPillText}>Live Chat</Text>
          </Pressable>

          <Pressable style={styles.supportPill} onPress={() => handleContact('Email Support')}>
            <Ionicons name="mail-unread-outline" size={20} color="#16A34A" />
            <Text style={styles.supportPillText}>Email Us</Text>
          </Pressable>

          <Pressable style={styles.supportPill} onPress={() => handleContact('Helpline')}>
            <Ionicons name="call-outline" size={20} color="#16A34A" />
            <Text style={styles.supportPillText}>Call Help</Text>
          </Pressable>
        </View>

        {/* FAQs */}
        <Text style={styles.sectionHeader}>Frequently Asked Questions</Text>
        <View style={styles.faqContainer}>
          {faqs.map((faq, index) => {
            const isExpanded = expandedFaq === index;
            return (
              <View key={index} style={styles.faqItem}>
                <Pressable
                  style={styles.faqHeader}
                  onPress={() => setExpandedFaq(isExpanded ? null : index)}
                >
                  <Text style={styles.faqQuestion}>{faq.question}</Text>
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color="#4B5563"
                  />
                </Pressable>
                {isExpanded && (
                  <View style={styles.faqBody}>
                    <Text style={styles.faqAnswer}>{faq.answer}</Text>
                  </View>
                )}
                {index < faqs.length - 1 && <View style={styles.divider} />}
              </View>
            );
          })}
        </View>

        {/* Submit Feedback */}
        <Text style={styles.sectionHeader}>Send Feedback</Text>
        <View style={styles.card}>
          <Text style={styles.cardTip}>Help us improve KaamKrwao. Send us suggestions or report bugs:</Text>
          <View style={styles.feedbackWrapper}>
            <TextInput
              style={styles.feedbackInput}
              placeholder="Tell us what we can improve..."
              value={feedback}
              onChangeText={setFeedback}
              multiline
              numberOfLines={4}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <Pressable
            style={[styles.btn, isSubmitting && styles.btnDisabled]}
            onPress={handleSubmitFeedback}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.btnText}>Submit Message</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#082C18',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  backBtn: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 60,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: '#374151',
    marginBottom: 10,
    marginTop: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  supportRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  supportPill: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  supportPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    marginTop: 6,
  },
  faqContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 20,
  },
  faqItem: {
    paddingVertical: 14,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
    marginRight: 12,
  },
  faqBody: {
    marginTop: 8,
    paddingRight: 10,
  },
  faqAnswer: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginTop: 14,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 20,
  },
  cardTip: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '600',
    marginBottom: 12,
  },
  feedbackWrapper: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    height: 100,
    marginBottom: 16,
  },
  feedbackInput: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
    textAlignVertical: 'top',
  },
  btn: {
    backgroundColor: '#16A34A',
    height: 46,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnDisabled: {
    backgroundColor: '#9CA3AF',
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
