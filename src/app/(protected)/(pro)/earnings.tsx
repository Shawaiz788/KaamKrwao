import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { getProEarnings, ProEarnings } from '@/services/proEarnings';

export default function ProEarningsRoute() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [earnings, setEarnings] = useState<ProEarnings | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEarnings = async (showRefresher = false) => {
    if (showRefresher) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const data = await getProEarnings();
      setEarnings(data);
    } catch (err: any) {
      console.error('[ProEarnings] Error fetching earnings details:', err);
      setError(err.message || 'Failed to fetch earnings details. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEarnings();
  }, []);

  const onRefresh = () => {
    fetchEarnings(true);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.pro.accent} />
        <Text style={styles.loadingText}>Fetching earnings metrics...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={60} color={Colors.error} style={styles.errorIcon} />
        <Text style={styles.errorTitle}>Retrieval Failed</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.retryBtn} onPress={() => fetchEarnings()}>
          <Ionicons name="refresh" size={18} color={Colors.white} style={{ marginRight: 6 }} />
          <Text style={styles.retryBtnText}>Retry Fetch</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.pro.header} />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top > 0 ? insets.top + 10 : 20 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </Pressable>
        <Text style={styles.headerTitle}>Earnings Dashboard</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.pro.accent}
            colors={[Colors.pro.accent]}
          />
        }
      >
        {/* Main/Total Earnings Card */}
        <View style={styles.mainEarningsCard}>
          <Text style={styles.mainEarningsLabel}>TOTAL REVENUE</Text>
          <Text style={styles.mainEarningsValue}>
            Rs. {earnings?.total_earning?.toLocaleString() || '0'}
          </Text>
          <View style={styles.mainEarningsDivider} />
          <View style={styles.jobsCompletedRow}>
            <View style={styles.jobsMetricIconContainer}>
              <Ionicons name="briefcase" size={18} color={Colors.pro.accent} />
            </View>
            <View>
              <Text style={styles.jobsCompletedLabel}>Jobs Completed</Text>
              <Text style={styles.jobsCompletedValue}>{earnings?.jobs_done || 0}</Text>
            </View>
          </View>
        </View>

        {/* Earning Breakdown Cards Grid */}
        <View style={styles.gridContainer}>
          {/* Daily Card */}
          <View style={styles.gridCard}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.iconContainer, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
                <Ionicons name="calendar-outline" size={20} color={Colors.pro.accent} />
              </View>
              <Text style={styles.cardTitle}>Daily</Text>
            </View>
            <Text style={styles.cardAmount}>
              Rs. {earnings?.daily_earning?.toLocaleString() || '0'}
            </Text>
            <Text style={styles.cardSubText}>Earned today</Text>
          </View>

          {/* Weekly Card */}
          <View style={styles.gridCard}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.iconContainer, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
                <Ionicons name="stats-chart-outline" size={20} color={Colors.pro.accent} />
              </View>
              <Text style={styles.cardTitle}>Weekly</Text>
            </View>
            <Text style={styles.cardAmount}>
              Rs. {earnings?.weekly_earning?.toLocaleString() || '0'}
            </Text>
            <Text style={styles.cardSubText}>This week</Text>
          </View>
        </View>

        {/* Sync Info Footer */}
        <View style={styles.syncCard}>
          <Ionicons name="sync-outline" size={16} color={Colors.neutral[400]} style={{ marginRight: 6 }} />
          <Text style={styles.syncText}>
            Last updated: {formatDate(earnings?.updated_at)}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.pro.bg,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.pro.bg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: Colors.neutral[300],
    fontSize: 15,
    marginTop: 12,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: Colors.pro.bg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorIcon: {
    marginBottom: 16,
  },
  errorTitle: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  errorText: {
    color: Colors.neutral[400],
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  retryBtn: {
    backgroundColor: Colors.pro.accentDim,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
  header: {
    backgroundColor: Colors.pro.header,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.pro.cardBorder,
  },
  backBtn: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 20,
  },
  mainEarningsCard: {
    backgroundColor: Colors.pro.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.pro.cardBorder,
    marginBottom: 16,
  },
  mainEarningsLabel: {
    color: Colors.neutral[400],
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  mainEarningsValue: {
    color: Colors.white,
    fontSize: 36,
    fontWeight: '800',
    marginTop: 6,
  },
  mainEarningsDivider: {
    height: 1,
    backgroundColor: Colors.pro.cardBorder,
    marginVertical: 16,
  },
  jobsCompletedRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  jobsMetricIconContainer: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  jobsCompletedLabel: {
    color: Colors.neutral[400],
    fontSize: 12,
    fontWeight: '600',
  },
  jobsCompletedValue: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 2,
  },
  gridContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  gridCard: {
    flex: 1,
    backgroundColor: Colors.pro.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.pro.cardBorder,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  cardTitle: {
    color: Colors.neutral[300],
    fontSize: 14,
    fontWeight: '700',
  },
  cardAmount: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  cardSubText: {
    color: Colors.neutral[500],
    fontSize: 11,
    fontWeight: '500',
  },
  syncCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(19, 34, 24, 0.5)',
    borderRadius: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(30, 58, 42, 0.5)',
  },
  syncText: {
    color: Colors.neutral[400],
    fontSize: 12,
    fontWeight: '500',
  },
});
