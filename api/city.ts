const BASE_URL = process.env.EXPO_PUBLIC_LOCATION_API_URL;
const API_URL = BASE_URL ? BASE_URL.replace(/\/$/, '') : '';

export interface City {
    id: number;
    name: string;
}

export const getCities = async (): Promise<City[]> => {
    const response = await fetch(`${API_URL}/cities/`);
    return response.json();
};

export const getCitiesByCountry = async (countryId: number): Promise<City[]> => {
    return getCities();
};

export const createCity = async (countryId: number, name: string): Promise<City> => {
    const response = await fetch(`${API_URL}/cities/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, country: countryId }),
    });
    return response.json();
};