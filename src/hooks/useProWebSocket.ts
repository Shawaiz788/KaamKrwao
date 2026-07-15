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

/**
 * 🎓 WEBSOCKET LEARNING TEMPLATE
 * 
 * This hook is responsible for managing a WebSocket connection to receive live jobs
 * in real-time and handle bidding outcomes (acceptance/rejection).
 * 
 * Follow the comments step-by-step to write your own connection management,
 * AppState tracking, reconnect policies (exponential backoff), and cleanup!
 * 
 * NOTE: The original fully functional code has been backed up in:
 * src/hooks/useProWebSocket.backup.ts
 */
export function useProWebSocket({
    userId,
    isOnline,
    onBidAccepted,
    onBidRejected,
}: UseProWebSocketOptions): UseProWebSocketResult {
    const [jobs, setJobs] = useState<LiveJob[]>([]);
    const [wsStatus, setWsStatus] = useState<WSStatus>('disconnected');
    const [hasNoJobs, setHasNoJobs] = useState(false);

    // STEP 1: Callback References
    // Keep reference of callbacks to avoid re-triggering connection effects
    // on every callback change. Use refs:
    const onBidAcceptedRef = useRef(onBidAccepted);
    const onBidRejectedRef = useRef(onBidRejected);

    useEffect(() => {
        onBidAcceptedRef.current = onBidAccepted;
        onBidRejectedRef.current = onBidRejected;
    }, [onBidAccepted, onBidRejected]);

    // STEP 2: WebSocket & State Control Refs
    const wsRef = useRef<WebSocket | null>(null);
    const isMountedRef = useRef(true);
    const shouldConnectRef = useRef(false);

    // TODO: Add your references for reconnect timers and app state tracking here
    // e.g. retryDelayRef, retryTimerRef, appStateRef

    // STEP 3: Socket Disconnection Logic
    const closeSocket = useCallback(() => {
        // TODO: Clean up event listeners on wsRef.current, close the socket, and set it to null
    }, []);

    // STEP 4: WebSocket Connection & Event Listeners
    const connect = useCallback(() => {
        // Note: For local offline development, you can add 'return;' at the top to skip ws connection
        // return;

        if (!isMountedRef.current || !userId || !shouldConnectRef.current) return;
        if (wsRef.current) return;

        const url = `${WS_BASE}/ws/jobs/${userId}/`;
        setWsStatus('connecting');

        // TODO: 1. Initialize WebSocket instance
        // const ws = new WebSocket(url);
        // wsRef.current = ws;

        // TODO: 2. Implement ws.onopen
        // - Set status to 'connected' and reset backoff delay

        // TODO: 3. Implement ws.onmessage
        // - Parse JSON data (e.g. const msg = JSON.parse(event.data))
        // - Handle message types: 'job_list', 'no_jobs', 'bid_accepted', 'bid_rejected'
        // - Update state variables (jobs, hasNoJobs) or invoke callbacks via refs

        // TODO: 4. Implement ws.onerror
        // - Log errors for debugging

        // TODO: 5. Implement ws.onclose
        // - Set status to reconnecting or disconnected
        // - Schedule reconnection using exponential backoff (e.g. delay * 2) if shouldConnectRef.current is true

    }, [userId]);

    // STEP 5: Connection Trigger on State Change
    useEffect(() => {
        shouldConnectRef.current = isOnline && !!userId;

        if (isOnline && userId) {
            connect();
        } else {
            closeSocket();
            setWsStatus('disconnected');
            setJobs([]);
            setHasNoJobs(false);
        }
    }, [isOnline, userId, connect, closeSocket]);

    // STEP 6: App State Lifecycle Handling
    // TODO: Subscribe to AppState 'change' events.
    // - If app goes to 'background', disconnect to save battery
    // - If app returns to 'active', reconnect if shouldConnectRef.current is true

    // STEP 7: Hook Unmount Cleanup
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            shouldConnectRef.current = false;
            // TODO: Clear retry timers and close socket
            closeSocket();
        };
    }, [closeSocket]);

    // STEP 8: Refresh Connection Manual Trigger
    const refresh = useCallback(() => {
        if (!shouldConnectRef.current) return;
        closeSocket();
        // TODO: Reset backoff delays and reconnect
        setTimeout(() => connect(), 300);
    }, [connect, closeSocket]);

    return { jobs, wsStatus, hasNoJobs, refresh };
}
