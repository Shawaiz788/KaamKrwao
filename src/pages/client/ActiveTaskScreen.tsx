import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Image,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { usePostJob, Bid } from '@/context/post-job';
import { useAuth } from '@/context/auth';
import { useBiddingWebSocket } from '@/hooks/useBiddingWebSocket';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

interface ActiveTaskScreenProps {
  onBack: () => void;
}

export default function ActiveTaskScreen({ onBack }: ActiveTaskScreenProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const {
    activeTask,
    bids: mockBids,
    activeChatMessages,
    acceptBid: contextAcceptBid,
    cancelTask,
    completeTask,
    sendActiveChatMessage,
  } = usePostJob();

  const getBackendTaskId = () => {
    if (activeTask?.backend_id) return activeTask.backend_id;
    if (!activeTask?.id) return null;
    const numId = Number(activeTask.id);
    if (!isNaN(numId) && numId > 0 && numId < 1_000_000_000) return numId;
    return null;
  };
  const taskId = getBackendTaskId();
  const { bids: wsBids, acceptBid: sendWsAcceptBid } = useBiddingWebSocket({
    taskId,
    userId: user?.id,
    isCustomer: true,
    enabled: Boolean(activeTask && taskId && user?.id),
    token: user?.token,
  });

  const bids: Bid[] = wsBids.length > 0
    ? wsBids.map((b) => ({
        id: String(b.id),
        name: b.user_name || `Professional #${b.user_id}`,
        avatar: b.user_avatar || 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150',
        rating: b.user_rating || 4.8,
        reviewsCount: 45,
        price: b.price,
        timeEstimate: b.estimated_hours ? `${b.estimated_hours * 60} min` : '15 min',
        message: b.estimated_hours ? `Estimated duration: ${b.estimated_hours} hours` : 'Ready to perform task',
      }))
    : mockBids;

  const handleAcceptBid = (bidId: string) => {
    sendWsAcceptBid(bidId);
    contextAcceptBid(bidId);
  };

  const [chatVisible, setChatVisible] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for searching state
  useEffect(() => {
    if (activeTask?.status === 'searching' || activeTask?.status === 'bidding') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.25,
            duration: 1500,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [activeTask?.status]);

  if (!activeTask) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>No active task found.</Text>
        <Pressable style={styles.backBtnText} onPress={onBack}>
          <Text style={styles.backBtnLabel}>Go Back Home</Text>
        </Pressable>
      </View>
    );
  }

  const handleDeclineBid = (bidId: string) => {
    // Just a mock decline to remove it visually from the list
    Alert.alert('Decline Bid', 'You have declined this offer.');
  };

  const handleCall = (name: string) => {
    Alert.alert('Calling Professional', `Connecting call to ${name}...`, [{ text: 'OK' }]);
  };

  const handleSendChat = () => {
    if (chatInput.trim() === '') return;
    sendActiveChatMessage(chatInput);
    setChatInput('');
  };

  const chatHeaderStyle = [
    styles.modalHeader,
    { paddingTop: insets.top > 0 ? insets.top + 5 : 15 }
  ];

  const chatInputStyle = [
    styles.inputBar,
    { paddingBottom: insets.bottom > 0 ? insets.bottom + 8 : 10 }
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={onBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </Pressable>
          <Text style={styles.headerTitle}>Task Status</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Task Summary Card */}
        <View style={styles.taskSummaryCard}>
          <View style={styles.summaryHeader}>
            <View style={[styles.statusIndicator, activeTask.status === 'accepted' ? styles.statusActive : styles.statusSearching]} />
            <Text style={styles.summaryCategory}>{activeTask.category}</Text>
          </View>
          <Text style={styles.summaryDetails} numberOfLines={2}>{activeTask.description}</Text>
          <View style={styles.summaryMetaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="wallet-outline" size={14} color="#6B7280" />
              <Text style={styles.metaText}>Budget: Rs. {activeTask.budget}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={14} color="#6B7280" />
              <Text style={styles.metaText} numberOfLines={1}>Address: {activeTask.locationName}</Text>
            </View>
          </View>
        </View>

        {/* Status Area */}
        {(activeTask.status === 'searching' || activeTask.status === 'bidding') && (
          <View style={styles.searchingArea}>
            <View style={styles.animationContainer}>
              <Animated.View
                style={[
                  styles.pulseCircle,
                  {
                    transform: [{ scale: pulseAnim }],
                    opacity: pulseAnim.interpolate({
                      inputRange: [1, 1.25],
                      outputRange: [0.6, 0.1],
                    }),
                  },
                ]}
              />
              <View style={styles.centerIcon}>
                <Ionicons name="search" size={32} color="#10B981" />
              </View>
            </View>
            <Text style={styles.statusText}>
              {activeTask.status === 'searching'
                ? 'Finding local professionals near you...'
                : 'Receiving offers from professionals...'}
            </Text>
            <Text style={styles.subStatusText}>Nearby experts are checking your requirements.</Text>
          </View>
        )}

        {/* Bids List */}
        {(activeTask.status === 'bidding' || bids.length > 0) && (
          <View style={styles.bidsSection}>
            <Text style={styles.sectionTitle}>Offers ({bids.length})</Text>
            {bids.length === 0 ? (
              <ActivityIndicator size="small" color="#10B981" style={{ marginTop: 20 }} />
            ) : (
              bids.map((bid) => (
                <View key={bid.id} style={styles.bidCard}>
                  <View style={styles.bidHeader}>
                    <Image source={{ uri: bid.avatar }} style={styles.bidAvatar} />
                    <View style={styles.bidHeaderInfo}>
                      <Text style={styles.bidName}>{bid.name}</Text>
                      <View style={styles.ratingRow}>
                        <Ionicons name="star" size={14} color="#F59E0B" />
                        <Text style={styles.ratingText}>
                          {bid.rating} ({bid.reviewsCount} reviews)
                        </Text>
                      </View>
                    </View>
                    <View style={styles.bidPriceContainer}>
                      <Text style={styles.bidPrice}>Rs. {bid.price}</Text>
                      <Text style={styles.bidTime}>{bid.timeEstimate} away</Text>
                    </View>
                  </View>

                  <Text style={styles.bidComment}>"{bid.message}"</Text>

                  <View style={styles.bidActions}>
                    <Pressable
                      style={[styles.bidBtn, styles.declineBtn]}
                      onPress={() => handleDeclineBid(bid.id)}
                    >
                      <Text style={styles.declineBtnText}>Decline</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.bidBtn, styles.acceptBtn]}
                      onPress={() => handleAcceptBid(bid.id)}
                    >
                      <Text style={styles.acceptBtnText}>Accept Offer</Text>
                    </Pressable>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Accepted Professional Card */}
        {activeTask.status === 'accepted' && activeTask.acceptedBid && (
          <View style={styles.acceptedSection}>
            <View style={styles.alertSuccess}>
              <Ionicons name="checkmark-circle" size={24} color="#047857" style={{ marginRight: 8 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.alertSuccessTitle}>Professional Assigned!</Text>
                <Text style={styles.alertSuccessText}>
                  {activeTask.acceptedBid.name.split(' ')[0]} is arriving in ~{activeTask.acceptedBid.timeEstimate}.
                </Text>
              </View>
            </View>

            <View style={styles.proProfileCard}>
              <Image source={{ uri: activeTask.acceptedBid.avatar }} style={styles.proLargeAvatar} />
              <Text style={styles.proLargeName}>{activeTask.acceptedBid.name}</Text>
              <View style={styles.proLargeRating}>
                <Ionicons name="star" size={18} color="#F59E0B" style={{ marginRight: 4 }} />
                <Text style={styles.proLargeRatingText}>
                  {activeTask.acceptedBid.rating} ({activeTask.acceptedBid.reviewsCount} reviews)
                </Text>
              </View>

              <View style={styles.proContactRow}>
                <Pressable
                  style={[styles.contactCircleBtn, styles.contactPhone]}
                  onPress={() => handleCall(activeTask.acceptedBid!.name)}
                >
                  <Ionicons name="call" size={20} color="#FFFFFF" />
                </Pressable>

                <Pressable
                  style={[styles.contactCircleBtn, styles.contactChat]}
                  onPress={() => setChatVisible(true)}
                >
                  <Ionicons name="chatbubble" size={20} color="#FFFFFF" />
                  {activeChatMessages.length > 0 && (
                    <View style={styles.chatBadge} />
                  )}
                </Pressable>
              </View>
            </View>

            <Pressable style={styles.completeBtn} onPress={completeTask}>
              <Ionicons name="checkmark" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.completeBtnText}>Mark as Completed</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* Cancel Button */}
      <View style={styles.footer}>
        <Pressable style={styles.cancelBtn} onPress={cancelTask}>
          <Text style={styles.cancelBtnText}>Cancel Job Request</Text>
        </Pressable>
      </View>

      {/* Temporary Chat Modal */}
      {activeTask.status === 'accepted' && activeTask.acceptedBid && (
        <Modal
          visible={chatVisible}
          animationType="slide"
          onRequestClose={() => setChatVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.chatRoomContainer}
          >
            {/* Chat Modal Header */}
            <View style={chatHeaderStyle}>
              <Pressable onPress={() => setChatVisible(false)} style={styles.modalBackBtn}>
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </Pressable>
              <Image source={{ uri: activeTask.acceptedBid.avatar }} style={styles.modalAvatar} />
              <View style={styles.modalHeaderDetails}>
                <Text style={styles.modalName}>{activeTask.acceptedBid.name}</Text>
                <Text style={styles.modalStatus}>Active session</Text>
              </View>
              <Pressable onPress={() => handleCall(activeTask.acceptedBid!.name)} style={styles.modalCallBtn}>
                <Ionicons name="call" size={20} color="#FFFFFF" />
              </Pressable>
            </View>

            {/* Chat Messages */}
            <ScrollView
              style={styles.chatMessagesList}
              contentContainerStyle={{ padding: 16, paddingBottom: 25 }}
              ref={(ref) => {
                // Keep scrolled to bottom
              }}
            >
              <View style={styles.systemMessagePill}>
                <Text style={styles.systemMessageText}>
                  Messages are temporary and will be cleared once this task ends.
                </Text>
              </View>

              {activeChatMessages.map((msg) => {
                const isUser = msg.sender === 'user';
                return (
                  <View
                    key={msg.id}
                    style={[
                      styles.messageBubbleContainer,
                      isUser ? styles.messageUser : styles.messageOther,
                    ]}
                  >
                    <View
                      style={[
                        styles.messageBubble,
                        isUser ? styles.bubbleUser : styles.bubbleOther,
                      ]}
                    >
                      <Text style={isUser ? styles.bubbleUserText : styles.bubbleOtherText}>
                        {msg.text}
                      </Text>
                    </View>
                    <Text style={styles.messageTime}>{msg.time}</Text>
                  </View>
                );
              })}
            </ScrollView>

            {/* Input Bar */}
            <View style={chatInputStyle}>
              <TextInput
                style={styles.inputField}
                placeholder="Type a message..."
                placeholderTextColor="#9CA3AF"
                value={chatInput}
                onChangeText={setChatInput}
              />
              <Pressable
                style={[
                  styles.sendBtn,
                  chatInput.trim() === '' ? styles.sendBtnDisabled : styles.sendBtnEnabled,
                ]}
                onPress={handleSendChat}
                disabled={chatInput.trim() === ''}
              >
                <Ionicons name="send" size={18} color="#FFFFFF" />
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Clean status bar color
  },
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24, // Normal flow padding bottom
  },
  taskSummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 20,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusSearching: {
    backgroundColor: '#F59E0B',
  },
  statusActive: {
    backgroundColor: '#10B981',
  },
  summaryCategory: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  summaryDetails: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 12,
  },
  summaryMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 0.48,
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  searchingArea: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  animationContainer: {
    width: 90,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 16,
  },
  pulseCircle: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#10B981',
  },
  centerIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 4,
  },
  subStatusText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
  bidsSection: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  bidCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  bidHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bidAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    backgroundColor: '#F3F4F6',
  },
  bidHeaderInfo: {
    flex: 1,
  },
  bidName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  ratingText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  bidPriceContainer: {
    alignItems: 'flex-end',
  },
  bidPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#10B981',
  },
  bidTime: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  bidComment: {
    fontSize: 13,
    color: '#4B5563',
    fontStyle: 'italic',
    marginTop: 10,
    backgroundColor: '#F9FAFB',
    padding: 8,
    borderRadius: 8,
  },
  bidActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  bidBtn: {
    flex: 0.48,
    height: 38,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  declineBtn: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  declineBtnText: {
    color: '#4B5563',
    fontWeight: '600',
    fontSize: 14,
  },
  acceptBtn: {
    backgroundColor: '#10B981',
  },
  acceptBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  acceptedSection: {
    marginTop: 10,
  },
  alertSuccess: {
    flexDirection: 'row',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  alertSuccessTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#064E3B',
  },
  alertSuccessText: {
    fontSize: 13,
    color: '#047857',
    marginTop: 2,
  },
  proProfileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    marginBottom: 20,
  },
  proLargeAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
    backgroundColor: '#F3F4F6',
  },
  proLargeName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  proLargeRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  proLargeRatingText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
  proContactRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  contactCircleBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  contactPhone: {
    backgroundColor: '#3B82F6',
  },
  contactChat: {
    backgroundColor: '#10B981',
  },
  chatBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  completeBtn: {
    backgroundColor: '#082C18',
    height: 50,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  completeBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  footer: {
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  cancelBtn: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  cancelBtnText: {
    color: '#EF4444',
    fontWeight: '700',
    fontSize: 15,
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 16,
  },
  backBtnText: {
    backgroundColor: '#082C18',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  backBtnLabel: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Modal styling
  chatModalHeaderContainer: {
    backgroundColor: '#082C18',
  },
  chatInputContainer: {
    backgroundColor: '#FFFFFF',
  },
  chatRoomContainer: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  modalHeader: {
    backgroundColor: '#082C18',
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalBackBtn: {
    padding: 4,
    marginRight: 10,
  },
  modalAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  modalHeaderDetails: {
    flex: 1,
  },
  modalName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalStatus: {
    fontSize: 11,
    color: '#34D399',
  },
  modalCallBtn: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
  },
  chatMessagesList: {
    flex: 1,
  },
  systemMessagePill: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  systemMessageText: {
    fontSize: 12,
    color: '#92400E',
    textAlign: 'center',
    fontWeight: '500',
  },
  messageBubbleContainer: {
    marginBottom: 16,
    maxWidth: '80%',
  },
  messageUser: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  messageOther: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  messageBubble: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1.5,
    elevation: 1,
  },
  bubbleUser: {
    backgroundColor: '#082C18',
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
  },
  bubbleUserText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 18,
  },
  bubbleOtherText: {
    color: '#1F2937',
    fontSize: 14,
    lineHeight: 18,
  },
  messageTime: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 4,
    marginHorizontal: 4,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  inputField: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    fontSize: 14,
    color: '#1F2937',
    marginRight: 10,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnEnabled: {
    backgroundColor: '#10B981',
  },
  sendBtnDisabled: {
    backgroundColor: '#D1D5DB',
  },
});
