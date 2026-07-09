import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Task {
  id: string;
  category: string;
  description: string;
  budget: number;
  locationName: string;
  status: string;
  createdAt: string;
}

interface TaskHistoryModalProps {
  visible: boolean;
  onClose: () => void;
  taskHistory: Task[];
  clearHistory: () => void;
}

export default function TaskHistoryModal({
  visible,
  onClose,
  taskHistory,
  clearHistory,
}: TaskHistoryModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.historyBox}>
          {/* Header */}
          <View style={styles.historyBoxHeader}>
            <Text style={styles.historyTitle}>Task History</Text>
            <Pressable onPress={onClose} style={styles.historyCloseBtn}>
              <Ionicons name="close" size={24} color="#374151" />
            </Pressable>
          </View>

          {/* History Scroll List */}
          <ScrollView contentContainerStyle={styles.historyList}>
            {taskHistory.length === 0 ? (
              <View style={styles.emptyHistory}>
                <Ionicons name="receipt-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyHistoryText}>No tasks created yet.</Text>
              </View>
            ) : (
              taskHistory.map((task) => (
                <View key={task.id} style={styles.historyItemCard}>
                  <View style={styles.historyItemHeader}>
                    <Text style={styles.historyItemCategory}>{task.category}</Text>
                    <View
                      style={[
                        styles.historyStatusBadge,
                        {
                          backgroundColor:
                            task.status === 'completed' ? '#D1FAE5' : '#FEE2E2',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.historyStatusText,
                          {
                            color: task.status === 'completed' ? '#065F46' : '#991B1B',
                          },
                        ]}
                      >
                        {task.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.historyItemDesc}>{task.description}</Text>
                  <View style={styles.historyItemMeta}>
                    <Text style={styles.historyItemCost}>Rs. {task.budget}</Text>
                    <Text style={styles.historyItemTime}>{task.createdAt}</Text>
                  </View>
                </View>
              ))
            )}
          </ScrollView>

          {/* Footer Action to Clear History */}
          {taskHistory.length > 0 && (
            <Pressable
              style={styles.clearHistoryBtn}
              onPress={() => {
                Alert.alert(
                  'Clear History',
                  'Are you sure you want to clear your task history?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Clear', style: 'destructive', onPress: clearHistory },
                  ]
                );
              }}
            >
              <Text style={styles.clearHistoryBtnText}>Clear History</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  historyBox: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxHeight: '80%',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  historyBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  historyCloseBtn: {
    padding: 4,
  },
  historyList: {
    padding: 20,
    paddingBottom: 30,
  },
  emptyHistory: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyHistoryText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 10,
    fontWeight: '500',
  },
  historyItemCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyItemCategory: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  historyStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  historyStatusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  historyItemDesc: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
    marginBottom: 12,
  },
  historyItemMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 8,
  },
  historyItemCost: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981',
  },
  historyItemTime: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  clearHistoryBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#FEF2F2',
  },
  clearHistoryBtnText: {
    color: '#EF4444',
    fontWeight: '700',
    fontSize: 14,
  },
});
