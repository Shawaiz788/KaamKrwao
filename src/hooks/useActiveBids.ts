import { useState, useEffect, useCallback } from 'react';

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

    // Clean up expired bids after their duration without continuous polling interval
    useEffect(() => {
        const activeJobIds = Object.keys(bids);
        if (activeJobIds.length === 0) return;

        const now = Date.now();
        const timers: NodeJS.Timeout[] = [];

        activeJobIds.forEach((idStr) => {
            const id = Number(idStr);
            const b = bids[id];
            if (!b) return;

            const remaining = Math.max(0, b.durationMs - (now - b.startTimeMs));

            const timer = setTimeout(() => {
                setBids((prev) => {
                    if (!prev[id]) return prev;
                    const next = { ...prev };
                    delete next[id];
                    return next;
                });
            }, remaining + 100);

            timers.push(timer);
        });

        return () => {
            timers.forEach(clearTimeout);
        };
    }, [bids]);

    const placeBid = useCallback(
        (jobId: number, amount: number) => {
            setBids((prev) => ({
                ...prev,
                [jobId]: {
                    jobId,
                    amount,
                    startTimeMs: Date.now(),
                    durationMs,
                },
            }));
        },
        [durationMs]
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

    return {
        placeBid,
        getActiveBid,
    };
}
