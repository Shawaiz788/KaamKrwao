import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    StatusBar,
    ScrollView,
    RefreshControl,
    Switch,
    Animated,
    Dimensions,
    Alert,
    ToastAndroid,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/auth';
import { Colors } from '@/constants/colors';
import { useProWebSocket, LiveJob } from '@/hooks/useProWebSocket';
import JobCard from '@/components/pro/JobCard';
import JobDetailBottomSheet from '@/components/pro/JobDetailBottomSheet';
import ProDrawerPanel from '@/components/pro/ProDrawerPanel';

const { width } = Dimensions.get('window');

// ─── MOCK jobs for when WS isn't connected yet ────────────────────────────────
const MOCK_JOBS: LiveJob[] = [
    {
        id: 1,
        title: 'Split AC install — 1.5 ton',
        category: 'AC Service',
        budget: 4200,
        distance_km: 5.0,
        location_name: 'Cavalry Ground, Lahore',
        location_area: 'Main Cavalry Chowk',
        customer_name: 'Zara Anwar',
        customer_rating: 4.8,
        scheduled_date: new Date().toISOString(),
        description: 'Looking for a professional to install a new split AC (1.5 ton) in my living room. Low floor installation, mounting bracket is already fixed. Please bring vacuum pump and basic installation tools.',
        attachments: [
            'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=500',
            'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500'
        ]
    },
    {
        id: 2,
        title: 'DB wiring — 3-bed apartment',
        category: 'Electrician',
        budget: 3500,
        distance_km: 2.3,
        location_name: 'DHA Phase 5, Lahore',
        location_area: 'Block E Commercial',
        customer_name: 'Ali Hassan',
        customer_rating: 4.5,
        description: 'Complete Distribution Box (DB) wiring for a new 3-bedroom apartment. Phase selector switch and main breaker installation required. Wiring cables are already provided.',
        attachments: [
            'https://images.unsplash.com/photo-1558224494-ef8b217500d6?w=500'
        ]
    },
    {
        id: 3,
        title: 'Bathroom tap + shower replacement',
        category: 'Plumber',
        budget: 2800,
        distance_km: 7.1,
        location_name: 'Gulberg III, Lahore',
        location_area: 'Main Boulevard',
        customer_name: 'Sana Khan',
        customer_rating: 4.9,
        description: 'Replace the existing leaking mixer tap in the master bathroom and install a new wall-mounted shower head. All hardware and taps are purchased and ready for installation.',
        attachments: []
    },
];

// ─── State Display Components ─────────────────────────────────────────────────

function OfflineState() {
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 0.4, duration: 900, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, []);

    return (
        <View style={states.center}>
            <Animated.View style={[states.pulseCircle, { opacity: pulseAnim }]}>
                <Ionicons name="wifi-outline" size={42} color={Colors.neutral[300]} />
            </Animated.View>
            <Animated.Text style={[states.stateText, { opacity: pulseAnim }]}>
                You are not online.
            </Animated.Text>
            <Text style={states.stateSub}>Toggle online above to start receiving jobs.</Text>
        </View>
    );
}

function SearchingState({ hasNoJobs }: { hasNoJobs: boolean }) {
    const dotAnim1 = useRef(new Animated.Value(0.3)).current;
    const dotAnim2 = useRef(new Animated.Value(0.3)).current;
    const dotAnim3 = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        const pulse = (anim: Animated.Value, delay: number) =>
            Animated.loop(
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.timing(anim, { toValue: 1, duration: 400, useNativeDriver: true }),
                    Animated.timing(anim, { toValue: 0.3, duration: 400, useNativeDriver: true }),
                ])
            );

        const a1 = pulse(dotAnim1, 0);
        const a2 = pulse(dotAnim2, 200);
        const a3 = pulse(dotAnim3, 400);
        a1.start(); a2.start(); a3.start();
        return () => { a1.stop(); a2.stop(); a3.stop(); };
    }, []);

    return (
        <View style={states.center}>
            <View style={states.searchIconBox}>
                <Ionicons name="search" size={36} color={Colors.pro.accent} />
            </View>
            {hasNoJobs ? (
                <>
                    <Text style={states.stateText}>There are no jobs at the moment.</Text>
                    <Text style={states.stateSub}>Pull down to refresh, or wait for new jobs.</Text>
                </>
            ) : (
                <>
                    <View style={states.dotsRow}>
                        <Text style={states.stateText}>Searching for jobs</Text>
                        <View style={states.dots}>
                            {[dotAnim1, dotAnim2, dotAnim3].map((a, i) => (
                                <Animated.View key={i} style={[states.dot, { opacity: a }]} />
                            ))}
                        </View>
                    </View>
                    <Text style={states.stateSub}>Stay online to receive incoming jobs.</Text>
                </>
            )}
        </View>
    );
}

// ─── Main View ────────────────────────────────────────────────────────────────

export default function ProLiveJobsView() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { user } = useAuth();

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [isOnline, setIsOnline] = useState(false);
    const [selectedJob, setSelectedJob] = useState<LiveJob | null>(null);
    const [sheetVisible, setSheetVisible] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [useMockData, setUseMockData] = useState(true); // Fallback while WS not configured

    const { jobs: wsJobs, wsStatus, hasNoJobs, refresh: wsRefresh } = useProWebSocket({
        userId: user?.id,
        isOnline,
        onBidAccepted: (taskId, amount) => {
            setSheetVisible(false);
            setTimeout(() => {
                Alert.alert('Job Accepted! 🎉', `Your bid of Rs.${amount.toLocaleString()} was accepted. Navigate to the active task.`);
            }, 300);
        },
        onBidRejected: () => {
            // Bid buttons re-enable automatically (countdown finishes)
        },
    });

    // Use mock jobs if WS not connected OR as demo fallback
    const displayJobs: LiveJob[] = (wsJobs.length > 0)
        ? wsJobs
        : (isOnline && useMockData ? MOCK_JOBS : []);

    const isJobsAvailable = isOnline && displayJobs.length > 0;

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        wsRefresh();
        setTimeout(() => setIsRefreshing(false), 1500);
    }, [wsRefresh]);

    const handleQuickBid = (job: LiveJob, amount: number) => {
        // WS integration: send bid message
        console.log(`[ProLiveJobsView] Quick bid: job=${job.id}, amount=${amount}`);
    };

    const handleOpenJobDetail = (job: LiveJob) => {
        setSelectedJob(job);
        setSheetVisible(true);
    };

    const initials = user?.displayName
        ? user.displayName.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
        : 'A';

    const todayEarnings = 'Rs. 8,700';
    const jobsToday = 3;

    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.pro.header} />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
                <View style={styles.headerLeft}>
                    <Pressable onPress={() => setDrawerOpen(true)} hitSlop={10} style={styles.headerBtn}>
                        <Ionicons name="menu" size={26} color={Colors.white} />
                    </Pressable>
                    <View style={styles.headerTitleRow}>
                        <Text style={styles.headerTitle}>Live Jobs</Text>
                        {isOnline && (
                            <View style={styles.livePill}>
                                <View style={styles.liveDot} />
                                <Text style={styles.livePillText}>LIVE</Text>
                            </View>
                        )}
                    </View>
                </View>
                <Pressable style={styles.avatarBtn}>
                    <View style={styles.avatarCircle}>
                        <Text style={styles.avatarText}>{initials}</Text>
                    </View>
                </Pressable>
            </View>

            {/* Sub-header: earnings + jobs count */}
            <View style={styles.subHeader}>
                <View>
                    <Text style={styles.subLabel}>Today's earnings</Text>
                    <Text style={styles.subValue}>{todayEarnings}</Text>
                </View>
                <View style={styles.subDivider} />
                <View style={styles.subRight}>
                    <Text style={styles.subLabel}>Jobs today</Text>
                    <Text style={styles.subValueRight}>{jobsToday}</Text>
                </View>
            </View>

            {/* Online Toggle Bar */}
            <View style={styles.onlineBar}>
                <View style={[styles.onlineDot, { backgroundColor: isOnline ? Colors.pro.accent : Colors.neutral[500] }]} />
                <Text style={styles.onlineBarText}>
                    {isOnline ? "You're Online — receiving jobs" : "You're Offline"}
                </Text>
                <Switch
                    value={isOnline}
                    onValueChange={setIsOnline}
                    trackColor={{ false: Colors.neutral[600], true: Colors.pro.accentDim }}
                    thumbColor={Colors.white}
                />
            </View>

            {/* Main Content */}
            {!isOnline ? (
                <OfflineState />
            ) : !isJobsAvailable ? (
                <SearchingState hasNoJobs={hasNoJobs} />
            ) : (
                <ScrollView
                    style={styles.jobList}
                    contentContainerStyle={[styles.jobListContent, { paddingBottom: insets.bottom + 24 }]}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={handleRefresh}
                            tintColor={Colors.pro.accent}
                            colors={[Colors.pro.accent]}
                        />
                    }
                >
                    {isRefreshing && (
                        <View style={styles.refreshingBanner}>
                            <Text style={styles.refreshingText}>Refreshing...</Text>
                        </View>
                    )}
                    {displayJobs.map((job) => (
                        <JobCard
                            key={job.id}
                            job={job}
                            onPress={handleOpenJobDetail}
                            onQuickBid={handleQuickBid}
                        />
                    ))}
                </ScrollView>
            )}

            {/* Job Detail Bottom Sheet */}
            <JobDetailBottomSheet
                job={selectedJob}
                isVisible={sheetVisible}
                onClose={() => setSheetVisible(false)}
                onBidAccepted={(job, amount) => {
                    setSheetVisible(false);
                }}
            />

            {/* Drawer */}
            <ProDrawerPanel
                isOpen={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                activeRoute="live-jobs"
                isOnline={isOnline}
                onToggleOnline={() => setIsOnline((v) => !v)}
            />
        </View>
    );
}

// ─── State Styles ─────────────────────────────────────────────────────────────
const states = StyleSheet.create({
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        gap: 12,
    },
    pulseCircle: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: 'rgba(255,255,255,0.06)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    searchIconBox: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: 'rgba(34,197,94,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    stateText: {
        color: Colors.white,
        fontSize: 18,
        fontWeight: '700',
        textAlign: 'center',
    },
    stateSub: {
        color: Colors.neutral[400],
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 20,
    },
    dotsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    dots: {
        flexDirection: 'row',
        gap: 4,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.pro.accent,
    },
});

// ─── Main Styles ──────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: Colors.pro.bg,
    },
    header: {
        backgroundColor: Colors.pro.header,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 12,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerBtn: {
        padding: 4,
    },
    headerTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerTitle: {
        color: Colors.white,
        fontSize: 20,
        fontWeight: '700',
    },
    livePill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: Colors.pro.liveChip,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.pro.accent,
    },
    livePillText: {
        color: Colors.white,
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    avatarBtn: {},
    avatarCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.pro.accentDim,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: Colors.white,
        fontSize: 14,
        fontWeight: '700',
    },
    subHeader: {
        backgroundColor: Colors.pro.header,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 16,
        gap: 16,
    },
    subLabel: {
        color: Colors.neutral[500],
        fontSize: 11,
        fontWeight: '500',
        marginBottom: 3,
    },
    subValue: {
        color: Colors.white,
        fontSize: 20,
        fontWeight: '700',
    },
    subDivider: {
        width: 1,
        height: 32,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    subRight: {
        alignItems: 'flex-end',
    },
    subValueRight: {
        color: Colors.white,
        fontSize: 20,
        fontWeight: '700',
        textAlign: 'right',
    },
    onlineBar: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.06)',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 10,
    },
    onlineDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    onlineBarText: {
        flex: 1,
        color: Colors.white,
        fontSize: 14,
        fontWeight: '600',
    },
    jobList: {
        flex: 1,
    },
    jobListContent: {
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    refreshingBanner: {
        backgroundColor: 'rgba(34,197,94,0.12)',
        borderRadius: 10,
        paddingVertical: 10,
        alignItems: 'center',
        marginBottom: 12,
    },
    refreshingText: {
        color: Colors.pro.accent,
        fontSize: 13,
        fontWeight: '600',
    },
});
