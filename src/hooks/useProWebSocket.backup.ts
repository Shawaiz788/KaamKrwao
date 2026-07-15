import { useEffect, useRef, useCallback, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? '';
// Convert http(s) → ws(s)
const WS_BASE = BASE_URL
    .replace(/\/$/, '')
    .replace(/^https/, 'wss')
    .replace(/^http/, 'ws');

export interface LiveJob {
    id: number;
    title: string;
    category: string;
    category_icon?: string;
    budget: number;
    distance_km?: number;
    location_name: string;
    location_area?: string;
    customer_name: string;
    customer_rating?: number;
    scheduled_date?: string;
    created_at?: string;
}

type WSMessage =
    | { type: 'job_list'; jobs: LiveJob[] }
    | { type: 'no_jobs' }
    | { type: 'bid_accepted'; task_id: number; bid_amount: number }
    | { type: 'bid_rejected'; task_id: number }
    | { type: 'ping' };

export type WSStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

interface UseProWebSocketOptions {
    userId: number | undefined;
    isOnline: boolean;
    onBidAccepted?: (taskId: number, bidAmount: number) => void;
    onBidRejected?: (taskId: number) => void;
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
    onBidAccepted,
    onBidRejected,
}: UseProWebSocketOptions): UseProWebSocketResult {
    const [jobs, setJobs] = useState<LiveJob[]>([]);
    const [wsStatus, setWsStatus] = useState<WSStatus>('disconnected');
    const [hasNoJobs, setHasNoJobs] = useState(false);

    const onBidAcceptedRef = useRef(onBidAccepted);
    const onBidRejectedRef = useRef(onBidRejected);

    // Sync refs with latest callbacks on every render
    useEffect(() => {
        onBidAcceptedRef.current = onBidAccepted;
        onBidRejectedRef.current = onBidRejected;
    }, [onBidAccepted, onBidRejected]);

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

        const url = `${WS_BASE}/ws/jobs/${userId}/`;
        console.log('[useProWebSocket] Connecting to:', url);
        setWsStatus('connecting');

        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
            if (!isMountedRef.current) return;
            console.log('[useProWebSocket] Connected');
            setWsStatus('connected');
            retryDelayRef.current = INITIAL_RETRY_DELAY_MS; // reset backoff
        };

        ws.onmessage = (event) => {
            if (!isMountedRef.current) return;
            try {
                const msg: WSMessage = JSON.parse(event.data);
                if (msg.type === 'job_list') {
                    setJobs(msg.jobs);
                    setHasNoJobs(msg.jobs.length === 0);
                } else if (msg.type === 'no_jobs') {
                    setJobs([]);
                    setHasNoJobs(true);
                } else if (msg.type === 'bid_accepted') {
                    onBidAcceptedRef.current?.(msg.task_id, msg.bid_amount);
                } else if (msg.type === 'bid_rejected') {
                    onBidRejectedRef.current?.(msg.task_id);
                }
                // 'ping' → no-op
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

    // Connect / disconnect when isOnline changes
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
