import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    StatusBar,
    Dimensions,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/auth';
import { Colors } from '@/constants/colors';
import ProDrawerPanel from '@/components/pro/ProDrawerPanel';
import { getProEarnings, ProEarnings } from '@/services/proEarnings';

const { width } = Dimensions.get('window');

// ─── Mock Data ────────────────────────────────────────────────────────────────

const CHART_DATA = [
    { day: 'Mon', value: 2000 },
    { day: 'Tue', value: 3600 },
    { day: 'Wed', value: 1800 },
    { day: 'Thu', value: 4200 },
    { day: 'Fri', value: 5800 },
    { day: 'Sat', value: 9600 },
    { day: 'Sun', value: 6400 },
];
const MAX_CHART_VALUE = Math.max(...CHART_DATA.map((d) => d.value));

const RECENT_JOBS = [
    { id: '1', title: 'AC repair service', address: 'Phase 2, Industrial Area', amount: 'Rs 8,500', icon: 'thermometer', color: '#F97316' },
    { id: '2', title: 'Appliance Repair', address: 'Model Town, Phase 2', amount: 'Rs 6,000', icon: 'construct', color: '#3B82F6' },
    { id: '3', title: 'Home Cleaning', address: 'Green Enclave, Phase 1', amount: 'Rs 4,200', icon: 'water', color: '#10B981' },
    { id: '4', title: 'Painting Service', address: 'Urban Vistas, Phase 3', amount: 'Rs 10,500', icon: 'brush', color: '#8B5CF6' },
];

// ─── Subcomponents ────────────────────────────────────────────────────────────

function StatCard({
    label,
    value,
    sub,
    subPositive,
    iconName,
    iconColor,
}: {
    label: string;
    value: string;
    sub: string;
    subPositive?: boolean;
    iconName: string;
    iconColor: string;
}) {
    return (
        <View style={styles.statCard}>
            <View style={[styles.statIconBox, { backgroundColor: `${iconColor}18` }]}>
                <Ionicons name={iconName as any} size={20} color={iconColor} />
            </View>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
            <Text style={[styles.statSub, subPositive && styles.statSubPositive]}>{sub}</Text>
        </View>
    );
}

function EarningsChart() {
    const CHART_H = 80;
    return (
        <View style={styles.chartContainer}>
            {CHART_DATA.map((item) => {
                const barH = Math.max(8, (item.value / MAX_CHART_VALUE) * CHART_H);
                return (
                    <View key={item.day} style={styles.chartBar}>
                        <View style={[styles.bar, { height: barH }]} />
                        <Text style={styles.chartDayLabel}>{item.day}</Text>
                    </View>
                );
            })}
        </View>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProDashboardView() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { user } = useAuth();

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [isOnline, setIsOnline] = useState(false);
    const [earnings, setEarnings] = useState<ProEarnings | null>(null);
    const [loadingEarnings, setLoadingEarnings] = useState(true);

    useEffect(() => {
        const fetchEarnings = async () => {
            try {
                const data = await getProEarnings();
                setEarnings(data);
            } catch (err) {
                console.error('[ProDashboardView] Error fetching earnings:', err);
            } finally {
                setLoadingEarnings(false);
            }
        };
        fetchEarnings();
    }, []);

    const initials = user?.displayName
        ? user.displayName.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
        : 'A';

    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.pro.header} />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
                <Pressable onPress={() => setDrawerOpen(true)} hitSlop={10} style={styles.headerBtn}>
                    <Ionicons name="menu" size={26} color={Colors.white} />
                </Pressable>
                <Text style={styles.headerTitle}>Dashboard</Text>
                <Pressable style={styles.avatarBtn} onPress={() => router.push('/edit-profile')}>
                    {user?.profile_pic ? (
                        <Image source={{ uri: user.profile_pic }} style={styles.headerAvatarImage} />
                    ) : (
                        <View style={styles.avatarCircle}>
                            <Text style={styles.avatarText}>{initials}</Text>
                        </View>
                    )}
                </Pressable>
            </View>

            {/* Offline/Online status pill */}
            <View style={[styles.statusBar, { backgroundColor: Colors.pro.header }]}>
                <View style={[styles.statusPill, isOnline ? styles.onlinePill : styles.offlinePill]}>
                    <View style={[styles.statusDot, { backgroundColor: isOnline ? Colors.pro.accent : Colors.neutral[400] }]} />
                    <Text style={styles.statusText}>{isOnline ? 'Online' : 'Offline'}</Text>
                </View>
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <StatCard
                        label="This Week"
                        value={loadingEarnings ? "..." : `Rs. ${earnings?.weekly_earning?.toLocaleString() || '0'}`}
                        sub="Earned this week"
                        iconName="trending-up"
                        iconColor="#22C55E"
                    />
                    <StatCard
                        label="Total Earned"
                        value={loadingEarnings ? "..." : `Rs. ${earnings?.total_earning?.toLocaleString() || '0'}`}
                        sub={`${earnings?.jobs_done || 0} jobs`}
                        iconName="wallet-outline"
                        iconColor="#F97316"
                    />
                    <StatCard
                        label="Jobs Done"
                        value={loadingEarnings ? "..." : `${earnings?.jobs_done || 0}`}
                        sub="Completed jobs"
                        iconName="cube-outline"
                        iconColor="#3B82F6"
                    />
                    <StatCard
                        label="Avg Rating"
                        value={(user as any)?.overall_rating ? `${(user as any).overall_rating} ★` : "4.9 ★"}
                        sub="Recent rating"
                        iconName="star-outline"
                        iconColor="#EAB308"
                    />
                </View>

                {/* Weekly Earnings Chart */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>This Week's Earnings</Text>
                        <Pressable>
                            <Text style={styles.sectionLink}>Full report →</Text>
                        </Pressable>
                    </View>

                    <View style={styles.chartCard}>
                        <View style={styles.chartYAxis}>
                            <Text style={styles.chartAxisLabel}>12k</Text>
                            <Text style={styles.chartAxisLabel}>6k</Text>
                            <Text style={styles.chartAxisLabel}>0k</Text>
                        </View>
                        <EarningsChart />
                    </View>
                </View>

                {/* Go Online CTA Banner */}
                <Pressable
                    style={styles.ctaBanner}
                    onPress={() => {
                        setIsOnline(true);
                        router.push('/(protected)/(pro)/live-jobs');
                    }}
                >
                    <View style={styles.ctaIconBox}>
                        <Ionicons name="flash" size={22} color={Colors.white} />
                    </View>
                    <View style={styles.ctaText}>
                        <Text style={styles.ctaTitle}>Go online to receive jobs</Text>
                        <Text style={styles.ctaSub}>Jobs come to you</Text>
                    </View>
                    <Ionicons name="arrow-forward" size={22} color={Colors.white} />
                </Pressable>

                {/* Recent Jobs */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Recent Jobs</Text>
                        <Pressable onPress={() => router.push('/(protected)/(pro)/job-history')}>
                            <Text style={styles.sectionLink}>Full history →</Text>
                        </Pressable>
                    </View>

                    <View style={styles.recentJobsCard}>
                        {RECENT_JOBS.length === 0 ? (
                            <View style={styles.emptyStateContainer}>
                                <View style={styles.emptyIconCircle}>
                                    <Ionicons name="briefcase-outline" size={24} color={Colors.neutral[300]} />
                                </View>
                                <Text style={styles.emptyStateTitle}>No recent jobs</Text>
                                <Text style={styles.emptyStateSub}>Completed jobs will appear here</Text>
                            </View>
                        ) : (
                            RECENT_JOBS.map((job, index) => (
                                <View key={job.id}>
                                    <View style={styles.recentJobRow}>
                                        <View style={[styles.jobIconBox, { backgroundColor: `${job.color}18` }]}>
                                            <Ionicons name={job.icon as any} size={18} color={job.color} />
                                        </View>
                                        <View style={styles.jobInfo}>
                                            <Text style={styles.jobTitle} numberOfLines={1}>{job.title}</Text>
                                            <Text style={styles.jobAddress} numberOfLines={1}>{job.address}</Text>
                                        </View>
                                        <View style={styles.jobRight}>
                                            <Text style={styles.jobAmount}>{job.amount}</Text>
                                            <View style={styles.doneBadge}>
                                                <Text style={styles.doneBadgeText}>✓ Done</Text>
                                            </View>
                                        </View>
                                    </View>
                                    {index < RECENT_JOBS.length - 1 && <View style={styles.jobDivider} />}
                                </View>
                            ))
                        )}
                    </View>
                </View>
            </ScrollView>

            {/* Drawer */}
            <ProDrawerPanel
                isOpen={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                activeRoute="dashboard"
                isOnline={isOnline}
                onToggleOnline={() => setIsOnline((v) => !v)}
            />
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    header: {
        backgroundColor: Colors.pro.header,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 14,
    },
    headerBtn: {
        padding: 4,
    },
    headerTitle: {
        flex: 1,
        color: Colors.white,
        fontSize: 20,
        fontWeight: '700',
        marginLeft: 14,
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
    statusBar: {
        paddingHorizontal: 16,
        paddingBottom: 12,
    },
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        gap: 6,
    },
    offlinePill: {
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    onlinePill: {
        backgroundColor: 'rgba(34,197,94,0.15)',
    },
    statusDot: {
        width: 7,
        height: 7,
        borderRadius: 3.5,
    },
    statusText: {
        color: Colors.neutral[400],
        fontSize: 12,
        fontWeight: '600',
    },
    scroll: { flex: 1 },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 16,
        gap: 16,
    },
    // Stats
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    statCard: {
        width: (width - 32 - 10) / 2,
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    statIconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.neutral[900],
        marginBottom: 3,
    },
    statLabel: {
        fontSize: 12,
        color: Colors.neutral[500],
        marginBottom: 4,
    },
    statSub: {
        fontSize: 11,
        color: Colors.neutral[400],
        fontWeight: '500',
    },
    statSubPositive: {
        color: '#16A34A',
        fontWeight: '600',
    },
    // Section
    section: {
        gap: 10,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.neutral[800],
    },
    sectionLink: {
        fontSize: 13,
        color: Colors.brand.medium,
        fontWeight: '600',
    },
    // Chart
    chartCard: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'flex-end',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    chartYAxis: {
        justifyContent: 'space-between',
        height: 100,
        marginRight: 8,
        alignItems: 'flex-end',
    },
    chartAxisLabel: {
        fontSize: 10,
        color: Colors.neutral[400],
    },
    chartContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        height: 100,
        paddingBottom: 16,
    },
    chartBar: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 4,
    },
    bar: {
        width: '60%',
        backgroundColor: '#16A34A',
        borderRadius: 4,
        minHeight: 8,
    },
    chartDayLabel: {
        fontSize: 10,
        color: Colors.neutral[400],
        fontWeight: '500',
    },
    // CTA Banner
    ctaBanner: {
        backgroundColor: '#0F2318',
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 5,
    },
    ctaIconBox: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(34,197,94,0.15)',
        borderWidth: 1,
        borderColor: 'rgba(34,197,94,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    ctaText: {
        flex: 1,
    },
    ctaTitle: {
        color: Colors.white,
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 3,
    },
    ctaSub: {
        color: Colors.neutral[400],
        fontSize: 12,
    },
    // Recent Jobs
    recentJobsCard: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    recentJobRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        gap: 12,
    },
    jobIconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    jobInfo: {
        flex: 1,
        gap: 3,
    },
    jobTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.neutral[800],
    },
    jobAddress: {
        fontSize: 11,
        color: Colors.neutral[400],
    },
    jobRight: {
        alignItems: 'flex-end',
        gap: 4,
    },
    jobAmount: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.neutral[900],
    },
    doneBadge: {
        backgroundColor: '#DCFCE7',
        borderRadius: 6,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    doneBadgeText: {
        fontSize: 10,
        color: '#16A34A',
        fontWeight: '600',
    },
    jobDivider: {
        height: 1,
        backgroundColor: Colors.neutral[100],
        marginHorizontal: 14,
    },
    emptyStateContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 32,
        paddingHorizontal: 20,
    },
    emptyIconCircle: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: Colors.neutral[50],
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    emptyStateTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.neutral[700],
        marginBottom: 4,
    },
    emptyStateSub: {
        fontSize: 12,
        color: Colors.neutral[400],
        textAlign: 'center',
    },
    headerAvatarImage: {
        width: 36,
        height: 36,
        borderRadius: 18,
    },
});
