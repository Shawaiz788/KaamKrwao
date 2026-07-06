const API_URL = process.env.EXPO_PUBLIC_API_URL;

export interface City {
    id: number;
    name: string;
}

export interface Country {
    id: number;
    name: string;
}

export interface Area {
    id: number;
    name: string;
}

/**
 * Fetch all cities for a specific country ID.
 */
export const getCitiesByCountry = async (countryId: number): Promise<City[]> => {
    const response = await fetch(`${API_URL}/countries/${countryId}/cities/`);
    return response.json();
};

/**
 * Fetch all areas for a specific city ID.
 */
export const getAreasByCity = async (cityId: number): Promise<Area[]> => {
    const response = await fetch(`${API_URL}/cities/${cityId}/areas/`);
    return response.json();
};

/**
 * Fetch all available countries.
 */
export const getCountries = async (): Promise<Country[]> => {
    const response = await fetch(`${API_URL}/countries/`);
    return response.json();
};
