import { StyleSheet, Dimensions } from 'react-native';
import { Colors } from '@/constants/colors';

const { width } = Dimensions.get('window');

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
        paddingTop: 16,
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

export default styles;
