import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Dimensions,
    Alert,
    ToastAndroid,
    Platform,
    Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { LiveJob } from '@/hooks/useProWebSocket';

const { width } = Dimensions.get('window');

interface JobCardProps {
    job: LiveJob;
    onPress: (job: LiveJob) => void;
    onQuickBid: (job: LiveJob, amount: number) => void;
}

function showToast(message: string) {
    if (Platform.OS === 'android') {
        ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
        Alert.alert('Bid Placed', message);
    }
}

export default function JobCard({ job, onPress, onQuickBid }: JobCardProps) {
    const [waitingBidAmount, setWaitingBidAmount] = useState<number | null>(null);
    const [countdown, setCountdown] = useState(10);
    const progressAnim = useRef(new Animated.Value(1)).current;

    const base = job.budget;
    const plus5 = Math.round(base * 1.05);
    const plus10 = Math.round(base * 1.1);

    const isWaiting = waitingBidAmount !== null;

    const handleQuickBid = (amount: number) => {
        if (isWaiting) return;
        onQuickBid(job, amount);
        setWaitingBidAmount(amount);
        setCountdown(10);

        // Animate countdown progress from right to left
        progressAnim.setValue(1);
        Animated.timing(progressAnim, {
            toValue: 0,
            duration: 10000,
            useNativeDriver: false,
        }).start();

        showToast(`You have successfully placed a bid of Rs.${amount.toLocaleString()}.`);

        let remaining = 10;
        const interval = setInterval(() => {
            remaining -= 1;
            setCountdown(remaining);
            if (remaining <= 0) {
                clearInterval(interval);
                setWaitingBidAmount(null);
            }
        }, 1000);
    };

    // Category icon mapping
    const categoryIcon = (() => {
        const cat = (job.category || '').toLowerCase();
        if (cat.includes('ac') || cat.includes('air')) return { name: 'snow', color: '#3B82F6' };
        if (cat.includes('electric')) return { name: 'flash', color: '#F97316' };
        if (cat.includes('plumb')) return { name: 'water', color: '#06B6D4' };
        if (cat.includes('clean')) return { name: 'sparkles', color: '#EAB308' };
        if (cat.includes('paint')) return { name: 'brush', color: '#EC4899' };
        if (cat.includes('tutor')) return { name: 'school', color: '#10B981' };
        return { name: 'construct', color: '#8B5CF6' };
    })();

    return (
        <Pressable style={styles.card} onPress={() => onPress(job)}>
            {/* Top Row: Job title + date + distance */}
            <View style={styles.topRow}>
                <View style={[styles.catIconBox, { backgroundColor: `${categoryIcon.color}18` }]}>
                    <Ionicons name={categoryIcon.name as any} size={18} color={categoryIcon.color} />
                </View>
                <View style={styles.titleSection}>
                    <Text style={styles.jobTitle} numberOfLines={1}>{job.title}</Text>
                    <View style={styles.metaRow}>
                        {job.scheduled_date && (
                            <View style={styles.dateBadge}>
                                <Text style={styles.dateBadgeText}>Today</Text>
                            </View>
                        )}
                        {job.distance_km !== undefined && (
                            <Text style={styles.distanceText}>
                                <Ionicons name="navigate-outline" size={11} color={Colors.neutral[400]} />{' '}
                                {job.distance_km.toFixed(1)} km
                            </Text>
                        )}
                    </View>
                </View>
            </View>

            {/* Location */}
            <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={14} color={Colors.neutral[400]} />
                <View>
                    <Text style={styles.locationName} numberOfLines={1}>{job.location_name}</Text>
                    {job.location_area && (
                        <Text style={styles.locationArea} numberOfLines={1}>{job.location_area}</Text>
                    )}
                </View>
            </View>

            {/* Budget + Customer */}
            <View style={styles.budgetRow}>
                <View>
                    <Text style={styles.budgetLabel}>Budget</Text>
                    <Text style={styles.budgetValue}>Rs. {base.toLocaleString()}</Text>
                </View>
                <View style={styles.customerBox}>
                    <Text style={styles.customerLabel}>Customer</Text>
                    <View style={styles.customerRow}>
                        <Text style={styles.customerName}>{job.customer_name}</Text>
                        {job.customer_rating && (
                            <Text style={styles.customerRating}>
                                ★ {job.customer_rating.toFixed(1)}
                            </Text>
                        )}
                    </View>
                </View>
            </View>

            {/* Waiting Status */}
            {isWaiting && (
                <View style={styles.waitingBar}>
                    <Animated.View
                        style={[
                            styles.progressBar,
                            {
                                width: progressAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: ['0%', '100%'],
                                }),
                            },
                        ]}
                    />
                    <View style={styles.waitingContent}>
                        <Ionicons name="time-outline" size={14} color="#064E3B" style={{ marginRight: 6 }} />
                        <Text style={styles.waitingText}>
                            Waiting for user to accept/decline... ({countdown}s)
                        </Text>
                    </View>
                </View>
            )}

            {/* Quick Bid Buttons */}
            <View style={styles.bidRow}>
                <Pressable
                    style={[styles.bidBtn, isWaiting && styles.bidBtnDisabled]}
                    onPress={() => handleQuickBid(base)}
                    disabled={isWaiting}
                >
                    <Text style={[styles.bidBtnText, isWaiting && styles.bidBtnTextDisabled]}>
                        Rs.{base.toLocaleString()}
                    </Text>
                </Pressable>
                <Pressable
                    style={[styles.bidBtn, isWaiting && styles.bidBtnDisabled]}
                    onPress={() => handleQuickBid(plus5)}
                    disabled={isWaiting}
                >
                    <Text style={[styles.bidBtnText, isWaiting && styles.bidBtnTextDisabled]}>
                        Rs.{plus5.toLocaleString()}
                    </Text>
                    <Text style={[styles.bidBtnSub, isWaiting && styles.bidBtnTextDisabled]}>+5%</Text>
                </Pressable>
                <Pressable
                    style={[styles.bidBtn, isWaiting && styles.bidBtnDisabled]}
                    onPress={() => handleQuickBid(plus10)}
                    disabled={isWaiting}
                >
                    <Text style={[styles.bidBtnText, isWaiting && styles.bidBtnTextDisabled]}>
                        Rs.{plus10.toLocaleString()}
                    </Text>
                    <Text style={[styles.bidBtnSub, isWaiting && styles.bidBtnTextDisabled]}>+10%</Text>
                </Pressable>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 14,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 3,
        gap: 10,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
    },
    catIconBox: {
        width: 38,
        height: 38,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    titleSection: {
        flex: 1,
        gap: 4,
    },
    jobTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.neutral[800],
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    dateBadge: {
        backgroundColor: '#DBEAFE',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    dateBadgeText: {
        fontSize: 11,
        color: '#1D4ED8',
        fontWeight: '600',
    },
    distanceText: {
        fontSize: 11,
        color: Colors.neutral[400],
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 6,
        backgroundColor: Colors.neutral[50],
        borderRadius: 10,
        padding: 10,
    },
    locationName: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.neutral[700],
    },
    locationArea: {
        fontSize: 11,
        color: Colors.neutral[400],
        marginTop: 1,
    },
    budgetRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    budgetLabel: {
        fontSize: 11,
        color: Colors.neutral[400],
        marginBottom: 2,
    },
    budgetValue: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.brand.medium,
    },
    customerBox: {
        alignItems: 'flex-end',
    },
    customerLabel: {
        fontSize: 11,
        color: Colors.neutral[400],
        marginBottom: 2,
    },
    customerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    customerName: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.neutral[700],
    },
    customerRating: {
        fontSize: 12,
        color: '#EAB308',
        fontWeight: '600',
    },
    waitingBar: {
        height: 38,
        borderRadius: 10,
        backgroundColor: '#E5E7EB',
        overflow: 'hidden',
        position: 'relative',
        justifyContent: 'center',
    },
    progressBar: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        backgroundColor: '#34D399',
    },
    waitingContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        zIndex: 2,
    },
    waitingText: {
        fontSize: 12,
        color: '#064E3B',
        fontWeight: '700',
    },
    bidRow: {
        flexDirection: 'row',
        gap: 8,
    },
    bidBtn: {
        flex: 1,
        backgroundColor: '#F0FDF4',
        borderWidth: 1.5,
        borderColor: '#BBF7D0',
        borderRadius: 10,
        paddingVertical: 8,
        alignItems: 'center',
        gap: 1,
    },
    bidBtnDisabled: {
        backgroundColor: Colors.neutral[100],
        borderColor: Colors.neutral[200],
    },
    bidBtnText: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.brand.medium,
    },
    bidBtnSub: {
        fontSize: 10,
        fontWeight: '600',
        color: Colors.brand.medium,
    },
    bidBtnTextDisabled: {
        color: Colors.neutral[400],
    },
});
