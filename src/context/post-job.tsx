import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { useAuth } from './auth';
import { createTaskChain, getStatusesFromBackend, updateTaskStatusOnBackend } from '@/services/task';
import useTaskStore from '../store/taskStore';
import { Bid, Task } from '@/types';
export { Bid, Task };

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'professional';
  time: string;
}

interface PostJobContextType {
  activeTask: Task | null;
  taskHistory: Task[];
  bids: Bid[];
  activeChatMessages: ChatMessage[];
  selectedCategory: string | null;
  createTask: (
    categoryId: number,
    categoryName: string,
    paymentPreferenceId: number,
    paymentPreferenceName: string,
    description: string,
    budget: number,
    locationName: string,
    attachmentUris?: string[] | null
  ) => void;
  cancelTask: () => void;
  acceptBid: (bidId: string) => void;
  completeTask: () => void;
  sendActiveChatMessage: (text: string) => void;
  clearHistory: () => void;
  openPostJob: (category?: string) => void;
  closePostJob: () => void;
}

const PostJobContext = createContext<PostJobContextType>({
  activeTask: null,
  taskHistory: [],
  bids: [],
  activeChatMessages: [],
  selectedCategory: null,
  createTask: () => { },
  cancelTask: () => { },
  acceptBid: () => { },
  completeTask: () => { },
  sendActiveChatMessage: () => { },
  clearHistory: () => { },
  openPostJob: () => { },
  closePostJob: () => { },
});

export function PostJobProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [activeChatMessages, setActiveChatMessages] = useState<ChatMessage[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Persistent task history store from MMKV + Zustand
  const { taskHistory, addTaskToHistory, clearHistory: clearTaskStoreHistory } = useTaskStore();

  const biddingTimer = useRef<NodeJS.Timeout | null>(null);
  const chatGreetingTimer = useRef<NodeJS.Timeout | null>(null);
  const chatReplyTimer = useRef<NodeJS.Timeout | null>(null);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (biddingTimer.current) clearTimeout(biddingTimer.current);
      if (chatGreetingTimer.current) clearTimeout(chatGreetingTimer.current);
      if (chatReplyTimer.current) clearTimeout(chatReplyTimer.current);
    };
  }, []);

  // Sync activeTask changes to the persisted Zustand store.
  // This MUST be done in a useEffect (not inside setActiveTask updaters)
  // because calling zustand set() inside a React state updater triggers
  // a downstream setState-during-render error.
  useEffect(() => {
    if (activeTask) {
      addTaskToHistory(activeTask);
    }
  }, [activeTask]);

  const openPostJob = (cat?: string) => {
    if (cat) {
      setSelectedCategory(cat);
    }
  };

  const closePostJob = () => {
    setSelectedCategory(null);
  };

  const createTask = (
    categoryId: number,
    categoryName: string,
    paymentPreferenceId: number,
    paymentPreferenceName: string,
    description: string,
    budget: number,
    locationName: string,
    attachmentUris?: string[] | null
  ) => {
    const newTask: Task = {
      id: Date.now().toString(),
      category: categoryName,
      description,
      budget,
      locationName,
      paymentPref: paymentPreferenceName,
      status: 'searching',
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachmentUris,
    };

    setActiveTask(newTask);
    addTaskToHistory(newTask);
    setBids([]);
    setActiveChatMessages([]);

    const userId = user?.id;
    const locationId = user?.location_id || user?.location?.id;

    if (userId && locationId) {
      // Execute backend creation chain in parallel/background
      (async () => {
        try {
          console.log('[PostJobProvider] Dispatching createTaskChain with:', {
            categoryId,
            categoryName,
            paymentPreferenceId,
            budget,
            userId,
            locationId,
            attachmentUris,
          });
          const createdBackend = await createTaskChain({
            categoryId,
            categoryName,
            paymentPreferenceId,
            description,
            budget,
            userId,
            locationId,
            attachmentUris,
          });
          console.log('[PostJobProvider] Backend task created successfully. ID:', createdBackend.id);

          setActiveTask((prev) => {
            if (!prev || prev.id !== newTask.id) return prev;
            // Note: addTaskToHistory is NOT called here — the useEffect above
            // handles syncing to Zustand safely after each render.
            return { ...prev, backend_id: createdBackend.id };
          });
        } catch (err: any) {
          console.error('[PostJobProvider] Failed to submit task to backend database:', err);
          Alert.alert('Server Connection Error', 'Your request has been published locally, but could not be synchronized with the remote backend database.');
        }
      })();
    } else {
      console.warn('[PostJobProvider] Cannot dispatch backend createTask: missing user ID or profile location ID.');
    }

    if (biddingTimer.current) clearTimeout(biddingTimer.current);

    // After 3 seconds, transition status to 'bidding' and load mock bids
    biddingTimer.current = setTimeout(() => {
      setActiveTask((prev) => {
        if (!prev || prev.id !== newTask.id) return prev;
        return { ...prev, status: 'bidding' as const };
      });

      const mockBids: Bid[] = [
        {
          id: 'bid_1',
          name: 'Zahid Khan Electrician',
          avatar: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150',
          rating: 4.8,
          reviewsCount: 124,
          price: budget,
          timeEstimate: '10 min',
          message: 'Ready to start. I am currently in DHA Phase 5.',
        },
        {
          id: 'bid_2',
          name: 'Sajid & Sons plumbing',
          avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
          rating: 4.6,
          reviewsCount: 65,
          price: budget + 150,
          timeEstimate: '8 min',
          message: 'Can reach quickly. Standard rates apply.',
        },
        {
          id: 'bid_3',
          name: 'M. Ali AC Specialist',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
          rating: 4.9,
          reviewsCount: 231,
          price: budget - 100,
          timeEstimate: '15 min',
          message: 'Expert service. Let me fix this for you.',
        },
      ];
      setBids(mockBids);
    }, 4000);
  };

  const cancelTask = () => {
    if (activeTask) {
      const cancelledTask: Task = { ...activeTask, status: 'cancelled' };
      addTaskToHistory(cancelledTask);

      if (activeTask.backend_id) {
        const taskId = activeTask.backend_id;
        const token = user?.token;
        (async () => {
          try {
            console.log('[PostJobProvider] Cancelling backend task with ID:', taskId);
            const statuses = await getStatusesFromBackend(token);
            const cancelledStatus = statuses.find(s => s.name.toLowerCase() === 'cancelled');
            const statusId = cancelledStatus ? cancelledStatus.id : 5;
            
            await updateTaskStatusOnBackend(taskId, statusId, token);
            console.log('[PostJobProvider] Backend task status updated to Cancelled.');
          } catch (err) {
            console.error('[PostJobProvider] Failed to update task status on backend:', err);
          }
        })();
      }
    }
    setActiveTask(null);
    setBids([]);
    setActiveChatMessages([]);
    if (biddingTimer.current) clearTimeout(biddingTimer.current);
    if (chatGreetingTimer.current) clearTimeout(chatGreetingTimer.current);
    if (chatReplyTimer.current) clearTimeout(chatReplyTimer.current);
  };

  const acceptBid = (bidId: string) => {
    const chosenBid = bids.find((b) => b.id === bidId);
    if (!chosenBid || !activeTask) return;

    setActiveTask((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        status: 'accepted' as const,
        acceptedBid: chosenBid,
      };
    });

    // Start greeting after 2 seconds
    if (chatGreetingTimer.current) clearTimeout(chatGreetingTimer.current);
    chatGreetingTimer.current = setTimeout(() => {
      const greetingMsg: ChatMessage = {
        id: 'greet_1',
        text: `Hello, I'm ${chosenBid.name.split(' ')[0]}. I'm on my way to your location! Please share any details or gate codes if needed.`,
        sender: 'professional',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setActiveChatMessages((prev) => [...prev, greetingMsg]);
    }, 2000);
  };

  const completeTask = () => {
    if (activeTask) {
      const completedTask: Task = { ...activeTask, status: 'completed' };
      addTaskToHistory(completedTask);
      Alert.alert('Task Completed', 'The task has been marked as completed successfully!');
    }
    setActiveTask(null);
    setBids([]);
    setActiveChatMessages([]);
    if (biddingTimer.current) clearTimeout(biddingTimer.current);
    if (chatGreetingTimer.current) clearTimeout(chatGreetingTimer.current);
    if (chatReplyTimer.current) clearTimeout(chatReplyTimer.current);
  };

  const sendActiveChatMessage = (text: string) => {
    if (text.trim() === '') return;

    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      text: text.trim(),
      sender: 'user',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setActiveChatMessages((prev) => [...prev, newMsg]);

    // Simulate reply after 1.5s
    if (chatReplyTimer.current) clearTimeout(chatReplyTimer.current);
    chatReplyTimer.current = setTimeout(() => {
      const replies = [
        "Sounds good! I'll be there in a bit.",
        "Got it, thanks for letting me know.",
        "Understood, I am on my way.",
        "Perfect. I am driving right now, will arrive soon.",
      ];
      const randomReply = replies[Math.floor(Math.random() * replies.length)];
      const replyMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: randomReply,
        sender: 'professional',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setActiveChatMessages((prev) => [...prev, replyMsg]);
    }, 1500);
  };

  const clearHistory = () => {
    clearTaskStoreHistory();
  };

  return (
    <PostJobContext.Provider
      value={{
        activeTask,
        taskHistory,
        bids,
        activeChatMessages,
        selectedCategory,
        createTask,
        cancelTask,
        acceptBid,
        completeTask,
        sendActiveChatMessage,
        clearHistory,
        openPostJob,
        closePostJob,
      }}
    >
      {children}
    </PostJobContext.Provider>
  );
}

export const usePostJob = () => useContext(PostJobContext);
