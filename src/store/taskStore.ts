import { create } from 'zustand';
import { createMMKV } from 'react-native-mmkv';
import { Task } from '@/types';

// 1. Initialize MMKV storage instance using react-native-mmkv
const storage = createMMKV();

// 2. Define Zustand Task history store interface
export interface TaskStoreState {
  activeUserId: number | null;
  taskHistory: Task[];
  switchUser: (userId: number | null) => void;
  setTaskHistory: (tasks: Task[]) => void;
  addTaskToHistory: (task: Task) => void;
  removeTaskFromHistory: (taskId: string) => void;
  clearHistory: () => void;
}

const getUserStorageKey = (userId: number | null) => {
  return userId ? `task_history_user_${userId}` : null;
};

const loadHistoryFromMMKV = (userId: number | null): Task[] => {
  const key = getUserStorageKey(userId);
  if (!key) return [];
  try {
    const json = storage.getString(key);
    return json ? JSON.parse(json) : [];
  } catch (e) {
    console.error(`[taskStore] Error loading MMKV history for user ${userId}:`, e);
    return [];
  }
};

const saveHistoryToMMKV = (userId: number | null, history: Task[]) => {
  const key = getUserStorageKey(userId);
  if (!key) return;
  try {
    storage.set(key, JSON.stringify(history));
  } catch (e) {
    console.error(`[taskStore] Error saving MMKV history for user ${userId}:`, e);
  }
};

const useTaskStore = create<TaskStoreState>()((set, get) => ({
  activeUserId: null,
  taskHistory: [],

  switchUser: (userId: number | null) => {
    const loadedHistory = loadHistoryFromMMKV(userId);
    set({ activeUserId: userId, taskHistory: loadedHistory });
  },

  setTaskHistory: (tasks: Task[]) => {
    const userId = get().activeUserId;
    saveHistoryToMMKV(userId, tasks);
    set({ taskHistory: tasks });
  },

  addTaskToHistory: (task: Task) => {
    const state = get();
    const exists = state.taskHistory.some(
      (t) => t.id === task.id || (t.backend_id && task.backend_id && t.backend_id === task.backend_id)
    );
    let updated: Task[];
    if (exists) {
      updated = state.taskHistory.map((t) =>
        t.id === task.id || (t.backend_id && task.backend_id && t.backend_id === task.backend_id)
          ? { ...t, ...task }
          : t
      );
    } else {
      updated = [task, ...state.taskHistory];
    }
    saveHistoryToMMKV(state.activeUserId, updated);
    set({ taskHistory: updated });
  },

  removeTaskFromHistory: (taskId: string) => {
    const state = get();
    const updated = state.taskHistory.filter((t) => t.id !== taskId);
    saveHistoryToMMKV(state.activeUserId, updated);
    set({ taskHistory: updated });
  },

  clearHistory: () => {
    const userId = get().activeUserId;
    const key = getUserStorageKey(userId);
    if (key) {
      storage.remove(key);
    }
    set({ taskHistory: [] });
  },
}));

export default useTaskStore;