const BASE_URL = process.env.EXPO_PUBLIC_API_URL;
const API_URL = BASE_URL ? BASE_URL.replace(/\/$/, '') : '';
import { fetchWithTimeout } from './fetchClient';
import { City } from '@/types';
export { City };

export const getCities = async (): Promise<City[]> => {
    const response = await fetchWithTimeout(`${API_URL}/app/city/`);
    return response.json();
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