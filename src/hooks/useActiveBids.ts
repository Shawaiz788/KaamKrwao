import { useState, useEffect, useCallback, useRef } from 'react';

export interface ActiveBidState {
    jobId: number;
    amount: number;
    startTimeMs: number;
    durationMs: number;
}

/**
 * Hook to manage active bids state with timestamp-based synchronization
 * across list cards and detail views. Efficient and zero continuous polling.
 */
export function useActiveBids(durationSeconds: number = 10) {
    const [bids, setBids] = useState<Record<number, ActiveBidState>>({});
    const durationMs = durationSeconds * 1000;
    const timersRef = useRef<Record<number, NodeJS.Timeout>>({});

    const removeBid = useCallback((jobId: number) => {
        if (timersRef.current[jobId]) {
            clearTimeout(timersRef.current[jobId]);
            delete timersRef.current[jobId];
        }
        setBids((prev) => {
            if (!prev[jobId]) return prev;
            const next = { ...prev };
            delete next[jobId];
            return next;
        });
    }, []);

    const placeBid = useCallback(
        (jobId: number, amount: number) => {
            const now = Date.now();
            if (timersRef.current[jobId]) {
                clearTimeout(timersRef.current[jobId]);
            }
            setBids((prev) => ({
                ...prev,
                [jobId]: {
                    jobId,
                    amount,
                    startTimeMs: now,
                    durationMs,
                },
            }));

            // Automatically remove bid once durationMs expires
            timersRef.current[jobId] = setTimeout(() => {
                removeBid(jobId);
            }, durationMs + 200);
        },
        [durationMs, removeBid]
    );

    const getActiveBid = useCallback(
        (jobId: number | undefined | null): ActiveBidState | null => {
            if (!jobId || !bids[jobId]) return null;
            const b = bids[jobId];
            const elapsed = Date.now() - b.startTimeMs;
            if (elapsed >= b.durationMs) return null;
            return b;
        },
        [bids]
    );

    // Cleanup timers on unmount
    useEffect(() => {
        return () => {
            Object.values(timersRef.current).forEach((t) => clearTimeout(t));
        };
    }, []);

    const activeJobIds = Object.keys(bids).map(Number);

    return {
        placeBid,
        removeBid,
        getActiveBid,
        activeJobIds,
    };
}

