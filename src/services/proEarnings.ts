import { fetchWithAuth } from './fetchClient';
import { ProEarnings } from '@/types';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;
const API_URL = BASE_URL ? BASE_URL.replace(/\/$/, '') : '';

export const createProEarnings = async (workerId: number | string): Promise<ProEarnings> => {
    console.log(`[proEarnings API] Creating earnings entry for worker ID: ${workerId}`);
    const response = await fetchWithAuth(`${API_URL}/app/professional/earning/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify({
            worker_id: Number(workerId),
            daily_earning: 0,
            weekly_earning: 0,
            total_earning: 0,
            total_jobs_done: 0,
            daily_jobs_done: 0,
        }),
    });

    const responseText = await response.text();
    console.log('[proEarnings API] Create pro earnings response status:', response.status);
    console.log('[proEarnings API] Create pro earnings response body:', responseText);

    if (!response.ok) {
        throw new Error(`Failed to create earnings entry. Status: ${response.status}. Response: ${responseText}`);
    }

    try {
        return JSON.parse(responseText);
    } catch (e) {
        throw new Error(`Failed to parse create earnings response. Content: ${responseText}`);
    }
};

export const getProEarnings = async (workerId: number | string): Promise<ProEarnings> => {
    console.log(`[proEarnings API] Fetching earnings for worker ID: ${workerId}`);
    const response = await fetchWithAuth(`${API_URL}/app/professional/earning/${workerId}/`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
        },
    });

    const responseText = await response.text();
    console.log('[proEarnings API] Get pro earnings response status:', response.status);
    console.log('[proEarnings API] Get pro earnings response body:', responseText);

    if (!response.ok) {
        // Fallback: If 404 or "No WorkerEarnings matches", automatically create earnings entry for previous accounts
        if (response.status === 404 || responseText.includes('No WorkerEarnings matches')) {
            console.log(`[proEarnings API] 404 received. Creating worker earnings record for ID ${workerId}...`);
            try {
                return await createProEarnings(workerId);
            } catch (createErr) {
                console.error('[proEarnings API] Fallback earnings creation failed:', createErr);
                return {
                    id: 0,
                    worker_id: Number(workerId),
                    daily_earning: 0,
                    weekly_earning: 0,
                    total_earning: 0,
                    total_jobs_done: 0,
                    daily_jobs_done: 0,
                } as ProEarnings;
            }
        }
        throw new Error(`Failed to fetch earnings details. Status: ${response.status}`);
    }

    try {
        return JSON.parse(responseText);
    } catch (e) {
        throw new Error(`Failed to parse professional earnings response. Content: ${responseText}`);
    }
};
