import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createMMKV } from 'react-native-mmkv';
import { Task } from '@/types';

// 1. Initialize MMKV storage instance using the factory function in react-native-mmkv v4
const storage = createMMKV();

// 2. Define custom storage wrapper for Zustand integration
const mmkvStorage = {
    setItem: (name: string, value: string) => {
        storage.set(name, value);
    },
    getItem: (name: string) => {
        const value = storage.getString(name);
        return value ?? null;
    },
    removeItem: (name: string) => {
        storage.remove(name);
    },
};

// 3. Define Zustand Task history store interface
export interface TaskStoreState {
    taskHistory: Task[];
    addTaskToHistory: (task: Task) => void;
    removeTaskFromHistory: (taskId: string) => void;
    clearHistory: () => void;
}

// 4. Create the persisted store
const useTaskStore = create<TaskStoreState>()(
    persist(
        (set) => ({
            taskHistory: [],
            addTaskToHistory: (task: Task) =>
                set((state) => {
                    const exists = state.taskHistory.some((t) => t.id === task.id);
                    if (exists) {
                        return {
                            taskHistory: state.taskHistory.map((t) =>
                                t.id === task.id ? task : t
                            ),
                        };
                    }
                    return { taskHistory: [task, ...state.taskHistory] };
                }),
            removeTaskFromHistory: (taskId: string) =>
                set((state) => ({
                    taskHistory: state.taskHistory.filter((t) => t.id !== taskId),
                })),
            clearHistory: () => set({ taskHistory: [] }),
        }),
        {
            name: 'task-history-storage',
            storage: createJSONStorage(() => mmkvStorage),
        }
    )
);

export default useTaskStore;