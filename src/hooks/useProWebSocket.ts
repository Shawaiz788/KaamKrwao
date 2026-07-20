import { useEffect, useRef, useCallback, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { getLocationById } from '@/services/location';
import { LiveJob } from '@/types';
import useCategoryStore from '@/store/categoryStore';
export { LiveJob };

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? '';
// Convert http(s) → ws(s)
const WS_BASE = BASE_URL
    .replace(/\/$/, '')
    .replace(/^https/, 'wss')
    .replace(/^http/, 'ws');

// Only the messages the server currently sends
type WSMessage =
    | {
        type: 'task_created';
        task: {
            id: number;
            subject: string;
            body: string;
            price: number;
            category_id: number;
            location_id: number;
            created_at?: string;
            customer_name?: string;
            attachments?: any[];
        };
    }
    | { type: 'ping' };

export type WSStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

interface UseProWebSocketOptions {
    userId: number | undefined;
    isOnline: boolean;
}

interface UseProWebSocketResult {
    jobs: LiveJob[];
    wsStatus: WSStatus;
    hasNoJobs: boolean;
    refresh: () => void;
}

const MAX_RETRY_DELAY_MS = 30_000;
const INITIAL_RETRY_DELAY_MS = 1_000;



export function useProWebSocket({
    userId,
    isOnline,
}: UseProWebSocketOptions): UseProWebSocketResult {
    const [jobs, setJobs] = useState<LiveJob[]>([]);
    const [wsStatus, setWsStatus] = useState<WSStatus>('disconnected');
    const [hasNoJobs, setHasNoJobs] = useState(false);

    const { ensureCategories, getCategoryById, getStyleById } = useCategoryStore();

    const wsRef = useRef<WebSocket | null>(null);
    const retryDelayRef = useRef(INITIAL_RETRY_DELAY_MS);
    const retryTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isMountedRef = useRef(true);
    const shouldConnectRef = useRef(false);
    const appStateRef = useRef<AppStateStatus>(AppState.currentState);

    const clearRetryTimer = () => {
        if (retryTimerRef.current) {
            clearTimeout(retryTimerRef.current);
            retryTimerRef.current = null;
        }
    };

    const closeSocket = useCallback(() => {
        if (wsRef.current) {
            wsRef.current.onclose = null; // prevent reconnect loop
            wsRef.current.onerror = null;
            wsRef.current.onmessage = null;
            wsRef.current.close();
            wsRef.current = null;
        }
    }, []);

    const connect = useCallback(() => {
        if (!isMountedRef.current || !userId || !shouldConnectRef.current) return;
        if (wsRef.current) return; // already connected/connecting

        const url = `${WS_BASE}/ws/tasks/`;
        console.log('[useProWebSocket] Connecting to:', url);
        setWsStatus('connecting');

        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
            if (!isMountedRef.current) return;
            console.log('[useProWebSocket] Connected');
            setWsStatus('connected');
            retryDelayRef.current = INITIAL_RETRY_DELAY_MS;
            // Ensure categories are loaded so we can map category_id → name/style
            ensureCategories();
        };

        ws.onmessage = (event) => {
            if (!isMountedRef.current) return;
            try {
                const msg: WSMessage = JSON.parse(event.data);
                console.log('[useProWebSocket] Message received:', msg.type);

                if (msg.type === 'task_created' && msg.task) {
                    const t = msg.task;
                    const cat = getCategoryById(t.category_id);
                    const { icon: catIcon, color: catColor } = getStyleById(t.category_id);

                    const newJob: LiveJob = {
                        id: t.id,
                        title: t.subject || 'New Task',
                        description: t.body || '',
                        category: cat?.name ?? `Category ${t.category_id}`,
                        category_icon: catIcon,
                        category_color: catColor,
                        budget: t.price,
                        location_name: 'Loading location...',
                        customer_name: t.customer_name || 'Customer',
                        created_at: t.created_at,
                        attachments: t.attachments || [],
                    };

                    setJobs((prev) => {
                        if (prev.some((j) => j.id === newJob.id)) return prev;
                        setHasNoJobs(false);
                        return [newJob, ...prev];
                    });

                    // Resolve location asynchronously
                    if (t.location_id) {
                        getLocationById(t.location_id)
                            .then((loc) => {
                                const address = loc.formatted_address || 'Unknown Location';
                                setJobs((prev) =>
                                    prev.map((j) => (j.id === t.id ? { ...j, location_name: address } : j))
                                );
                            })
                            .catch(() => {
                                setJobs((prev) =>
                                    prev.map((j) =>
                                        j.id === t.id ? { ...j, location_name: 'Location not found' } : j
                                    )
                                );
                            });
                    }
                }
                // 'ping' → no-op (heartbeat keepalive)
            } catch (e) {
                console.warn('[useProWebSocket] Failed to parse message:', e);
            }
        };

        ws.onerror = (error) => {
            console.error('[useProWebSocket] WebSocket error:', error);
        };

        ws.onclose = (event) => {
            if (!isMountedRef.current) return;
            wsRef.current = null;
            console.log('[useProWebSocket] Connection closed. Code:', event.code);

            if (!shouldConnectRef.current) {
                setWsStatus('disconnected');
                return;
            }

            // Exponential backoff reconnect
            setWsStatus('reconnecting');
            const delay = retryDelayRef.current;
            retryDelayRef.current = Math.min(delay * 2, MAX_RETRY_DELAY_MS);
            console.log(`[useProWebSocket] Reconnecting in ${delay}ms...`);
            retryTimerRef.current = setTimeout(() => {
                connect();
            }, delay);
        };
    }, [userId]);

    // Connect / disconnect when isOnline or userId changes
    useEffect(() => {
        shouldConnectRef.current = isOnline && !!userId;

        if (isOnline && userId) {
            connect();
        } else {
            clearRetryTimer();
            closeSocket();
            setWsStatus('disconnected');
            setJobs([]);
            setHasNoJobs(false);
        }
    }, [isOnline, userId, connect, closeSocket]);

    // Handle app foreground / background transitions
    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
            const prev = appStateRef.current;
            appStateRef.current = nextState;

            if (prev.match(/inactive|background/) && nextState === 'active') {
                // App came to foreground — reconnect if needed
                if (shouldConnectRef.current && !wsRef.current) {
                    clearRetryTimer();
                    retryDelayRef.current = INITIAL_RETRY_DELAY_MS;
                    connect();
                }
            } else if (nextState.match(/inactive|background/)) {
                // App went to background — disconnect to save battery
                clearRetryTimer();
                closeSocket();
            }
        });

        return () => subscription.remove();
    }, [connect, closeSocket]);

    // Cleanup on unmount
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            shouldConnectRef.current = false;
            clearRetryTimer();
            closeSocket();
        };
    }, [closeSocket]);

    const refresh = useCallback(() => {
        if (!shouldConnectRef.current) return;
        clearRetryTimer();
        closeSocket();
        retryDelayRef.current = INITIAL_RETRY_DELAY_MS;
        setTimeout(() => connect(), 300);
    }, [connect, closeSocket]);

    return { jobs, wsStatus, hasNoJobs, refresh };
}
