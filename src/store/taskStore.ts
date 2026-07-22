import { create } from 'zustand';
import { createMMKV } from 'react-native-mmkv';
import { Task } from '@/types';

// 1. Initialize MMKV storage instance using react-native-mmkv
const storage = createMMKV();

// 2. Define Zustand Task history store interface
export interface TaskStoreState {
  activeUserId: number | null;
  taskHistory: Task[];
  activeTask: Task | null;
  switchUser: (userId: number | null) => void;
  setTaskHistory: (tasks: Task[]) => void;
  addTaskToHistory: (task: Task) => void;
  removeTaskFromHistory: (taskId: string) => void;
  setActiveTask: (task: Task | null) => void;
  clearHistory: () => void;
}

const getUserStorageKey = (userId: number | null) => {
  return userId ? `task_history_user_${userId}` : null;
};

const getActiveTaskKey = (userId: number | null) => {
  return userId ? `active_task_user_${userId}` : 'active_task_guest';
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

const loadActiveTaskFromMMKV = (userId: number | null): Task | null => {
  const key = getActiveTaskKey(userId);
  try {
    const json = storage.getString(key);
    return json ? JSON.parse(json) : null;
  } catch (e) {
    return null;
  }
};

const saveActiveTaskToMMKV = (userId: number | null, task: Task | null) => {
  const key = getActiveTaskKey(userId);
  try {
    if (task) {
      storage.set(key, JSON.stringify(task));
    } else {
      storage.remove(key);
    }
  } catch (e) {
    console.error(`[taskStore] Error saving activeTask for user ${userId}:`, e);
  }
};

const useTaskStore = create<TaskStoreState>()((set, get) => ({
  activeUserId: null,
  taskHistory: [],
  activeTask: null,

  switchUser: (userId: number | null) => {
    const loadedHistory = loadHistoryFromMMKV(userId);
    const loadedActiveTask = loadActiveTaskFromMMKV(userId);
    set({ activeUserId: userId, taskHistory: loadedHistory, activeTask: loadedActiveTask });
  },

  setActiveTask: (task: Task | null) => {
    const userId = get().activeUserId;
    saveActiveTaskToMMKV(userId, task);
    set({ activeTask: task });
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
    saveActiveTaskToMMKV(userId, null);
    set({ taskHistory: [], activeTask: null });
  },
}));

export default useTaskStore;