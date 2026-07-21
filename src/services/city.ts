const BASE_URL = process.env.EXPO_PUBLIC_API_URL;
const API_URL = BASE_URL ? BASE_URL.replace(/\/$/, '') : '';
import { fetchWithTimeout } from './fetchClient';
import { City } from '@/types';
export { City };

export const getCities = async (): Promise<City[]> => {
    console.log('[city API] Fetching cities from API...');
    const response = await fetchWithTimeout(`${API_URL}/app/city/`);
    const data = await response.json();
    console.log('[city API] Raw response:', JSON.stringify(data)?.slice(0, 200));
    // Handle both paginated { results: [] } and plain array responses
    if (data && !Array.isArray(data) && Array.isArray(data.results)) {
        return data.results;
    }
    return Array.isArray(data) ? data : [];
};

export const createCity = async (countryId: number, name: string): Promise<City> => {
    const response = await fetchWithTimeout(`${API_URL}/app/city`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, country: countryId }),
    });
    return response.json();
};