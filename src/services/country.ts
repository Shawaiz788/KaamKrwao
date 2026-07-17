const BASE_URL = process.env.EXPO_PUBLIC_API_URL;
const API_URL = BASE_URL ? BASE_URL.replace(/\/$/, '') : '';
import { fetchWithTimeout } from './fetchClient';

export interface Country {
    id: number;
    name: string;
}

export const getCountries = async (): Promise<Country[]> => {
    const response = await fetchWithTimeout(`${API_URL}/app/country/`);
    return response.json();
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
