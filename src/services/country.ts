const BASE_URL = process.env.EXPO_PUBLIC_API_URL;
const API_URL = BASE_URL ? BASE_URL.replace(/\/$/, '') : '';
import { fetchWithTimeout } from './fetchClient';
import { Country } from '@/types';

export const getCountries = async (): Promise<Country[]> => {
    const response = await fetchWithTimeout(`${API_URL}/app/country/`);
    const data = await response.json();
    // Handle both paginated { results: [] } and plain array responses
    if (data && !Array.isArray(data) && Array.isArray(data.results)) {
        return data.results;
    }
    return Array.isArray(data) ? data : [];
};

export const createCountry = async (name: string): Promise<Country> => {
    const response = await fetchWithTimeout(`${API_URL}/app/country/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
    });
    return response.json();
};
