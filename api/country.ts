const BASE_URL = process.env.EXPO_PUBLIC_LOCATION_API_URL;
const API_URL = BASE_URL ? BASE_URL.replace(/\/$/, '') : '';

export interface Country {
    id: number;
    name: string;
}

export const getCountries = async (): Promise<Country[]> => {
    const response = await fetch(`${API_URL}/countries/`);
    return response.json();
};

export const createCountry = async (name: string): Promise<Country> => {
    const response = await fetch(`${API_URL}/countries/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
    });
    return response.json();
};
