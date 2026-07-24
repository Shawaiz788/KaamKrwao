import { create } from 'zustand';
import { createMMKV } from 'react-native-mmkv';
import { ProEarnings } from '@/types';
import { getProEarnings } from '@/services/proEarnings';

const storage = createMMKV({ id: 'pro-earnings-storage' });
const PRO_EARNINGS_KEY = 'cached_pro_earnings';
const PRO_EARNINGS_TIME_KEY = 'cached_pro_earnings_timestamp';
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache TTL

interface ProEarningsStoreState {
  earnings: ProEarnings | null;
  loading: boolean;
  lastFetchedAt: number | null;
  fetchEarnings: (workerId: number | string, force?: boolean) => Promise<ProEarnings | null>;
  setEarnings: (earnings: ProEarnings) => void;
  clearEarnings: () => void;
}

const loadEarningsFromMMKV = (): { earnings: ProEarnings | null; lastFetchedAt: number | null } => {
  try {
    const raw = storage.getString(PRO_EARNINGS_KEY);
    const timestamp = storage.getNumber(PRO_EARNINGS_TIME_KEY);
    return {
      earnings: raw ? JSON.parse(raw) : null,
      lastFetchedAt: timestamp ? timestamp : null,
    };
  } catch (e) {
    return { earnings: null, lastFetchedAt: null };
  }
};

const saveEarningsToMMKV = (earnings: ProEarnings | null, timestamp: number | null = Date.now()) => {
  try {
    if (earnings) {
      storage.set(PRO_EARNINGS_KEY, JSON.stringify(earnings));
      if (timestamp) storage.set(PRO_EARNINGS_TIME_KEY, timestamp);
    } else {
      storage.remove(PRO_EARNINGS_KEY);
      storage.remove(PRO_EARNINGS_TIME_KEY);
    }
  } catch (e) {
    console.error('[proEarningsStore] Error persisting earnings to MMKV:', e);
  }
};

const initialMMKVData = loadEarningsFromMMKV();

const useProEarningsStore = create<ProEarningsStoreState>((set, get) => ({
  earnings: initialMMKVData.earnings,
  loading: false,
  lastFetchedAt: initialMMKVData.lastFetchedAt,

  fetchEarnings: async (workerId: number | string, force = false) => {
    if (!workerId) return null;

    const { earnings, lastFetchedAt, loading } = get();
    const now = Date.now();

    // Cache valid for 10 minutes unless force refresh requested
    if (!force && earnings && lastFetchedAt && (now - lastFetchedAt < CACHE_TTL_MS)) {
      console.log(`[proEarningsStore] Using cached earnings for worker ${workerId} (Age: ${Math.round((now - lastFetchedAt) / 1000)}s)`);
      return earnings;
    }

    if (loading) return earnings;

    set({ loading: true });
    try {
      const freshData = await getProEarnings(workerId);
      const fetchedTime = Date.now();
      saveEarningsToMMKV(freshData, fetchedTime);
      set({ earnings: freshData, loading: false, lastFetchedAt: fetchedTime });
      return freshData;
    } catch (err) {
      console.error('[proEarningsStore] Error fetching earnings:', err);
      set({ loading: false });
      return get().earnings;
    }
  },

  setEarnings: (newEarnings: ProEarnings) => {
    const fetchedTime = Date.now();
    saveEarningsToMMKV(newEarnings, fetchedTime);
    set({ earnings: newEarnings, lastFetchedAt: fetchedTime });
  },

  clearEarnings: () => {
    saveEarningsToMMKV(null, null);
    set({ earnings: null, lastFetchedAt: null });
  },
}));

export default useProEarningsStore;
