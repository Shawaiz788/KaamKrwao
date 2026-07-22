import { create } from 'zustand';
import { createMMKV } from 'react-native-mmkv';
import { LiveJob } from '@/hooks/useProWebSocket';

const storage = createMMKV();
const PRO_ACTIVE_TASK_KEY = 'pro_active_task_storage';

export interface ProTaskStoreState {
  activeProTask: LiveJob | null;
  setActiveProTask: (job: LiveJob | null) => void;
  clearActiveProTask: () => void;
}

const loadProTaskFromMMKV = (): LiveJob | null => {
  try {
    const raw = storage.getString(PRO_ACTIVE_TASK_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

const saveProTaskToMMKV = (job: LiveJob | null) => {
  try {
    if (job) {
      storage.set(PRO_ACTIVE_TASK_KEY, JSON.stringify(job));
    } else {
      storage.remove(PRO_ACTIVE_TASK_KEY);
    }
  } catch (e) {
    console.error('[proTaskStore] Error persisting pro active task:', e);
  }
};

const useProTaskStore = create<ProTaskStoreState>()((set) => ({
  activeProTask: loadProTaskFromMMKV(),
  setActiveProTask: (job: LiveJob | null) => {
    saveProTaskToMMKV(job);
    set({ activeProTask: job });
  },
  clearActiveProTask: () => {
    saveProTaskToMMKV(null);
    set({ activeProTask: null });
  },
}));

export default useProTaskStore;
