import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Animated,
    PanResponder,
    Dimensions,
    ScrollView,
    TextInput,
    Alert,
    ToastAndroid,
    Platform,
    Keyboard,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { LiveJob } from '@/hooks/useProWebSocket';
import { getCategoryStyle } from '@/store/categoryStore';

const { height: SCREEN_H } = Dimensions.get('window');
const FULL_H = SCREEN_H;
const HALF_H = SCREEN_H * 0.55;
const CLOSED_Y = SCREEN_H;

type BidOption = 'plus5' | 'plus10' | 'plus15' | 'custom' | null;

interface JobDetailBottomSheetProps {
    job: LiveJob | null;
    isVisible: boolean;
    onClose: () => void;
    onBidAccepted?: (job: LiveJob, amount: number) => void;
}

function showToast(message: string) {
    if (Platform.OS === 'android') {
        ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
        Alert.alert('', message);
    }
}

export default function JobDetailBottomSheet({
    job,
    isVisible,
    onClose,
    onBidAccepted,
}: JobDetailBottomSheetProps) {
    const insets = useSafeAreaInsets();
    const translateY = useRef(new Animated.Value(CLOSED_Y)).current;
    const currentY = useRef(CLOSED_Y);
    const progressAnim = useRef(new Animated.Value(1)).current;

    const [selectedBid, setSelectedBid] = useState<BidOption>(null);
    const [customAmount, setCustomAmount] = useState('');
    const [isWaiting, setIsWaiting] = useState(false);
    const [countdown, setCountdown] = useState(10);
    const [sheetState, setSheetState] = useState<'default' | 'expanded'>('default');
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const [localVisible, setLocalVisible] = useState(isVisible);
    const waitingTimer = useRef<NodeJS.Timeout | null>(null);
    const countdownTimer = useRef<NodeJS.Timeout | null>(null);

    // Synchronize local visibility when opened
    useEffect(() => {
        if (isVisible) {
            setLocalVisible(true);
        }
    }, [isVisible]);

    const base = job?.budget ?? 0;
    const plus5 = Math.round(base * 1.05);
    const plus10 = Math.round(base * 1.1);
    const plus15 = Math.round(base * 1.15);

    const computedBidAmount = (() => {
        if (selectedBid === 'custom') {
            const v = parseInt(customAmount, 10);
            return isNaN(v) ? base : v;
        }
        if (selectedBid === 'plus5') return plus5;
        if (selectedBid === 'plus10') return plus10;
        if (selectedBid === 'plus15') return plus15;
        return base;
    })();

    // Keyboard height listener
    useEffect(() => {
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

        const showSub = Keyboard.addListener(showEvent, (e) => {
            setKeyboardHeight(e.endCoordinates.height);
        });
        const hideSub = Keyboard.addListener(hideEvent, () => {
            setKeyboardHeight(0);
        });

        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    // Open / close animation
    useEffect(() => {
        if (isVisible && job) {
            // Reset state
            setSelectedBid(null);
            setCustomAmount('');
            setIsWaiting(false);
            setCountdown(10);
            setSheetState('default');
            setLocalVisible(true);

            Animated.spring(translateY, {
                toValue: SCREEN_H - HALF_H,
                useNativeDriver: true,
                tension: 50,
                friction: 10,
            }).start();
            currentY.current = SCREEN_H - HALF_H;
        } else {
            Animated.spring(translateY, {
                toValue: SCREEN_H,
                useNativeDriver: true,
                tension: 50,
                friction: 10,
            }).start(({ finished }) => {
                if (finished) {
                    setLocalVisible(false);
                }
            });
            currentY.current = SCREEN_H;
        }
    }, [isVisible, job]);

    // Cleanup timers on unmount
    useEffect(() => {
        return () => {
            if (waitingTimer.current) clearTimeout(waitingTimer.current);
            if (countdownTimer.current) clearInterval(countdownTimer.current);
        };
    }, []);

    // PanResponder for dragging
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 5,
            onPanResponderGrant: () => {
                translateY.stopAnimation((val) => { currentY.current = val; });
            },
            onPanResponderMove: (_, g) => {
                const newY = Math.max(0, currentY.current + g.dy);
                translateY.setValue(newY);
            },
            onPanResponderRelease: (_, g) => {
                const cur = currentY.current + g.dy;
                const isSwipeDown = g.dy > 50 || g.vy > 0.4;
                const isSwipeUp = g.dy < -50 || g.vy < -0.4;

                if (isSwipeDown) {
                    if (cur > (SCREEN_H - HALF_H) + 60) {
                        // Close
                        Animated.spring(translateY, { toValue: SCREEN_H, useNativeDriver: true, tension: 50, friction: 10 }).start(({ finished }) => {
                            if (finished) {
                                onClose();
                                setLocalVisible(false);
                            }
                        });
                        currentY.current = SCREEN_H;
                    } else {
                        // Snap to half
                        Animated.spring(translateY, { toValue: SCREEN_H - HALF_H, useNativeDriver: true, tension: 50, friction: 10 }).start();
                        currentY.current = SCREEN_H - HALF_H;
                        setSheetState('default');
                    }
                } else if (isSwipeUp) {
                    // Snap to full
                    Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 50, friction: 10 }).start();
                    currentY.current = 0;
                    setSheetState('expanded');
                } else {
                    // Snap back to nearest
                    const snapFull = Math.abs(cur - 0);
                    const snapHalf = Math.abs(cur - (SCREEN_H - HALF_H));
                    const snapClose = Math.abs(cur - SCREEN_H);
                    if (snapFull < snapHalf && snapFull < snapClose) {
                        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 50, friction: 10 }).start();
                        currentY.current = 0;
                        setSheetState('expanded');
                    } else if (snapClose < snapHalf) {
                        Animated.spring(translateY, { toValue: SCREEN_H, useNativeDriver: true, tension: 50, friction: 10 }).start(({ finished }) => {
                            if (finished) {
                                onClose();
                                setLocalVisible(false);
                            }
                        });
                        currentY.current = SCREEN_H;
                    } else {
                        Animated.spring(translateY, { toValue: SCREEN_H - HALF_H, useNativeDriver: true, tension: 50, friction: 10 }).start();
                        currentY.current = SCREEN_H - HALF_H;
                        setSheetState('default');
                    }
                }
            },
        })
    ).current;

    const startWaiting = () => {
        setIsWaiting(true);
        setCountdown(10);
        Keyboard.dismiss();

        // Animate progress from right to left (100% to 0% width)
        progressAnim.setValue(1);
        Animated.timing(progressAnim, {
            toValue: 0,
            duration: 10000,
            useNativeDriver: false,
        }).start();

        let remaining = 10;
        if (countdownTimer.current) clearInterval(countdownTimer.current);
        countdownTimer.current = setInterval(() => {
            remaining -= 1;
            setCountdown(remaining);
            if (remaining <= 0) {
                clearInterval(countdownTimer.current!);
                setIsWaiting(false);
            }
        }, 1000);
    };

    const handlePlaceBid = () => {
        if (isWaiting || !job) return;
        showToast(`You have successfully placed a bid of Rs.${computedBidAmount.toLocaleString()}.`);
        startWaiting();
    };

    const catStyle = getCategoryStyle(job?.category ?? '');
    const categoryIcon = {
        name: job?.category_icon ?? catStyle.icon,
        color: job?.category_color ?? catStyle.color,
    };

    if (!localVisible) return null;

    // Interpolate translateY to animate scrim opacity
    const scrimOpacity = translateY.interpolate({
        inputRange: [SCREEN_H - HALF_H, SCREEN_H],
        outputRange: [1, 0],
        extrapolate: 'clamp',
    });

    const isExpanded = sheetState === 'expanded';

    const sheetStyle = [
        styles.sheet,
        {
            transform: [{ translateY }],
            bottom: keyboardHeight,
            paddingTop: isExpanded ? insets.top : 0,
            borderTopLeftRadius: isExpanded ? 0 : 24,
            borderTopRightRadius: isExpanded ? 0 : 24,
        }
    ];

    const scrollViewMaxH = (isExpanded ? SCREEN_H - insets.top : HALF_H) - 60 - keyboardHeight;

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            {/* Scrim */}
            <Animated.View style={[styles.scrim, { opacity: scrimOpacity }]}>
                <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
            </Animated.View>

            {/* White status bar filler — covers safe area on Android when fully expanded */}
            {isExpanded && insets.top > 0 && (
                <View
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: insets.top,
                        backgroundColor: Colors.white,
                        zIndex: 999,
                    }}
                />
            )}

            {/* Sheet */}
            <Animated.View style={sheetStyle}>
                {/* Drag Handle */}
                <View {...panResponder.panHandlers} style={styles.handleArea}>
                    <View style={styles.handle} />
                </View>

                <ScrollView
                    style={{ maxHeight: scrollViewMaxH }}
                    contentContainerStyle={[
                        styles.content,
                        { flexGrow: 1 },
                        sheetState === 'expanded' && { justifyContent: 'space-between' }
                    ]}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Top Container: Job details info */}
                    <View style={styles.topContainer}>
                        {/* Job Header */}
                        <View style={styles.jobHeader}>
                            <View style={[styles.catIconLarge, { backgroundColor: `${categoryIcon.color}18` }]}>
                                <Ionicons name={categoryIcon.name as any} size={26} color={categoryIcon.color} />
                            </View>
                            <View style={styles.jobHeaderText}>
                                <Text style={styles.jobDetailTitle} numberOfLines={2}>{job?.title}</Text>
                                <View style={styles.jobMetaRow}>
                                    <View style={styles.dateBadge}>
                                        <Text style={styles.dateBadgeText}>Today</Text>
                                    </View>
                                    <Text style={styles.budgetPill}>
                                        Rs. {base.toLocaleString()}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Location */}
                        <View style={styles.detailRow}>
                            <Ionicons name="location-outline" size={16} color={Colors.neutral[400]} />
                            <View style={{ flex: 1 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text style={styles.detailPrimary}>{job?.location_name}</Text>
                                    {job?.distance_km !== undefined && job?.distance_km !== null && (
                                        <View style={styles.distanceBadge}>
                                            <Ionicons name="navigate-outline" size={12} color="#16A34A" style={{ marginRight: 2 }} />
                                            <Text style={styles.distanceText}>{job.distance_km.toFixed(1)} km away</Text>
                                        </View>
                                    )}
                                </View>
                                {job?.location_area && (
                                    <Text style={styles.detailSecondary}>{job?.location_area}</Text>
                                )}
                            </View>
                        </View>

                        {/* Customer */}
                        <View style={styles.customerSection}>
                            <Text style={styles.subSectionLabel}>CUSTOMER</Text>
                            <View style={styles.customerCard}>
                                <View style={styles.custAvatar}>
                                    <Text style={styles.custAvatarText}>
                                        {(job?.customer_name || 'C')[0].toUpperCase()}
                                    </Text>
                                </View>
                                <View style={styles.custInfo}>
                                    <Text style={styles.custName}>{job?.customer_name}</Text>
                                    {job?.customer_rating && (
                                        <Text style={styles.custRating}>★ {job.customer_rating.toFixed(1)} rating</Text>
                                    )}
                                </View>
                            </View>
                        </View>

                        {/* Description & Attachments (visible when expanded) */}
                        {sheetState === 'expanded' && (
                            <View style={styles.expandedDetails}>
                                <View style={styles.descriptionSection}>
                                    <Text style={styles.subSectionLabel}>DESCRIPTION</Text>
                                    <Text style={styles.descriptionText}>
                                        {job?.description || (job as any)?.body || 'No description provided.'}
                                    </Text>
                                </View>

                                {job?.attachments && job.attachments.length > 0 && (
                                    <View style={styles.attachmentsSection}>
                                        <Text style={styles.subSectionLabel}>ATTACHMENTS</Text>
                                        <ScrollView
                                            horizontal
                                            showsHorizontalScrollIndicator={false}
                                            contentContainerStyle={styles.attachmentsRow}
                                        >
                                            {job.attachments.map((item: any, idx: number) => {
                                                const uri = typeof item === 'string' ? item : item.file || item.uri || item.url;
                                                if (!uri) return null;
                                                return (
                                                    <View key={idx} style={styles.attachmentCard}>
                                                        <Image source={{ uri }} style={styles.attachmentImage} />
                                                    </View>
                                                );
                                            })}
                                        </ScrollView>
                                    </View>
                                )}
                            </View>
                        )}

                        <View style={styles.sheetDivider} />
                    </View>

                    {/* Bottom Container: Action buttons and bidding options */}
                    <View style={styles.bottomContainer}>
                        {/* Quick Bid Row */}
                        <Text style={styles.subSectionLabel}>QUICK BID</Text>
                        <View style={styles.quickBidRow}>
                            {([
                                { key: 'plus5', label: `Rs.${plus5.toLocaleString()}`, sub: '+5%' },
                                { key: 'plus10', label: `Rs.${plus10.toLocaleString()}`, sub: '+10%' },
                                { key: 'plus15', label: `Rs.${plus15.toLocaleString()}`, sub: '+15%' },
                            ] as const).map((opt) => {
                                const active = selectedBid === opt.key;
                                return (
                                    <Pressable
                                        key={opt.key}
                                        style={[styles.quickBidBtn, active && styles.quickBidBtnActive, isWaiting && styles.quickBidBtnDisabled]}
                                        onPress={() => {
                                            if (!isWaiting) {
                                                if (selectedBid === opt.key) {
                                                    setSelectedBid(null);
                                                    setCustomAmount('');
                                                } else {
                                                    setSelectedBid(opt.key);
                                                    if (opt.key === 'plus5') setCustomAmount(plus5.toString());
                                                    if (opt.key === 'plus10') setCustomAmount(plus10.toString());
                                                    if (opt.key === 'plus15') setCustomAmount(plus15.toString());
                                                }
                                            }
                                        }}
                                        disabled={isWaiting}
                                    >
                                        <Text style={[styles.quickBidAmount, active && styles.quickBidAmountActive, isWaiting && styles.disabledText]}>
                                            {opt.label}
                                        </Text>
                                        <Text style={[styles.quickBidSub, active && styles.quickBidSubActive, isWaiting && styles.disabledText]}>
                                            {opt.sub}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>

                        {/* Custom Bid */}
                        <Text style={[styles.subSectionLabel, { marginTop: 14 }]}>CUSTOM BID</Text>
                        <View style={[styles.customBidInput, isWaiting && styles.customBidInputDisabled]}>
                            <Text style={styles.currencyPrefix}>Rs.</Text>
                            <TextInput
                                style={styles.customBidField}
                                placeholder="Enter amount"
                                placeholderTextColor={Colors.neutral[400]}
                                keyboardType="numeric"
                                value={customAmount}
                                onChangeText={(t) => {
                                    if (isWaiting) return;
                                    const clean = t.replace(/[^0-9]/g, '');
                                    setCustomAmount(clean);
                                    if (clean === '') {
                                        setSelectedBid(null);
                                    } else {
                                        setSelectedBid('custom');
                                    }
                                }}
                                editable={!isWaiting}
                            />
                        </View>

                        {/* Waiting Bar */}
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
                                    <Ionicons name="time-outline" size={16} color="#064E3B" style={{ marginRight: 8 }} />
                                    <Text style={styles.waitingText}>
                                        Waiting for user to accept/decline... ({countdown}s)
                                    </Text>
                                </View>
                            </View>
                        )}

                        {/* Bid Button */}
                        <Pressable
                            style={[styles.bidButton, isWaiting && styles.bidButtonDisabled]}
                            onPress={handlePlaceBid}
                            disabled={isWaiting}
                        >
                            <Text style={styles.bidButtonText}>
                                {isWaiting
                                    ? `Bid Placed — Rs.${computedBidAmount.toLocaleString()}`
                                    : `Place Bid at Rs.${computedBidAmount.toLocaleString()}`}
                            </Text>
                        </Pressable>
                    </View>
                </ScrollView>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    scrim: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.45)',
    },
    sheet: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: FULL_H,
        backgroundColor: Colors.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 24,
    },
    handleArea: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.neutral[200],
    },
    content: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    topContainer: {
        gap: 12,
    },
    bottomContainer: {
        gap: 12,
    },
    jobHeader: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'flex-start',
    },
    catIconLarge: {
        width: 52,
        height: 52,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    jobHeaderText: {
        flex: 1,
        gap: 6,
    },
    jobDetailTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.neutral[900],
        lineHeight: 22,
    },
    jobMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    dateBadge: {
        backgroundColor: '#DBEAFE',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    dateBadgeText: {
        fontSize: 11,
        color: '#1D4ED8',
        fontWeight: '600',
    },
    budgetPill: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.brand.medium,
    },
    detailRow: {
        flexDirection: 'row',
        gap: 8,
        backgroundColor: Colors.neutral[50],
        borderRadius: 12,
        padding: 12,
        alignItems: 'flex-start',
    },
    detailPrimary: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.neutral[700],
    },
    detailSecondary: {
        fontSize: 12,
        color: Colors.neutral[400],
        marginTop: 2,
    },
    customerSection: {
        gap: 8,
    },
    subSectionLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.neutral[400],
        letterSpacing: 0.8,
    },
    customerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: Colors.neutral[50],
        borderRadius: 12,
        padding: 12,
    },
    custAvatar: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: Colors.brand.medium,
        justifyContent: 'center',
        alignItems: 'center',
    },
    custAvatarText: {
        color: Colors.white,
        fontSize: 18,
        fontWeight: '700',
    },
    custInfo: {
        flex: 1,
    },
    custName: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.neutral[800],
    },
    custRating: {
        fontSize: 13,
        color: '#EAB308',
        fontWeight: '600',
        marginTop: 2,
    },
    expandedDetails: {
        gap: 16,
        marginTop: 4,
    },
    descriptionSection: {
        gap: 6,
    },
    descriptionText: {
        fontSize: 14,
        color: Colors.neutral[600],
        lineHeight: 20,
    },
    attachmentsSection: {
        gap: 8,
    },
    attachmentsRow: {
        gap: 12,
        paddingVertical: 4,
    },
    attachmentCard: {
        borderRadius: 8,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colors.neutral[200],
    },
    attachmentImage: {
        width: 100,
        height: 100,
        borderRadius: 8,
    },
    sheetDivider: {
        height: 1,
        backgroundColor: Colors.neutral[100],
    },
    quickBidRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 8,
    },
    quickBidBtn: {
        flex: 1,
        borderWidth: 1.5,
        borderColor: Colors.neutral[200],
        borderRadius: 12,
        paddingVertical: 10,
        alignItems: 'center',
        gap: 2,
        backgroundColor: Colors.white,
    },
    quickBidBtnActive: {
        borderColor: Colors.brand.medium,
        backgroundColor: '#F0FDF4',
    },
    quickBidBtnDisabled: {
        backgroundColor: Colors.neutral[50],
        borderColor: Colors.neutral[200],
    },
    quickBidAmount: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.neutral[600],
    },
    quickBidAmountActive: {
        color: Colors.brand.medium,
    },
    quickBidSub: {
        fontSize: 10,
        color: Colors.neutral[400],
        fontWeight: '600',
    },
    quickBidSubActive: {
        color: Colors.brand.medium,
    },
    disabledText: {
        color: Colors.neutral[300],
    },
    customBidInput: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: Colors.neutral[200],
        borderRadius: 12,
        paddingHorizontal: 14,
        height: 50,
        marginTop: 8,
        backgroundColor: Colors.white,
    },
    customBidInputDisabled: {
        backgroundColor: Colors.neutral[50],
    },
    currencyPrefix: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.neutral[500],
        marginRight: 8,
        borderRightWidth: 1,
        borderRightColor: Colors.neutral[200],
        paddingRight: 8,
    },
    customBidField: {
        flex: 1,
        fontSize: 15,
        color: Colors.neutral[900],
        fontWeight: '500',
    },
    waitingBar: {
        height: 48,
        borderRadius: 12,
        backgroundColor: '#E5E7EB',
        overflow: 'hidden',
        position: 'relative',
        justifyContent: 'center',
        marginTop: 14,
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
        paddingHorizontal: 14,
        zIndex: 2,
    },
    waitingText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#064E3B',
    },
    bidButton: {
        backgroundColor: Colors.brand.dark,
        height: 52,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 4,
        shadowColor: Colors.brand.dark,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    bidButtonDisabled: {
        backgroundColor: Colors.neutral[300],
        shadowOpacity: 0,
        elevation: 0,
    },
    bidButtonText: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: '700',
    },
    distanceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#DCFCE7',
        borderRadius: 8,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    distanceText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#16A34A',
    },
});
