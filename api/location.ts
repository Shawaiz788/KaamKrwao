const BASE_URL = process.env.EXPO_PUBLIC_LOCATION_API_URL;
const API_URL = BASE_URL ? BASE_URL.replace(/\/$/, '') : '';

import { Country, getCountries, createCountry } from './country';
import { City, getCities, getCitiesByCountry, createCity } from './city';
import { Area, getAreas, getAreasByCity, createArea } from './area';

export { Country, getCountries, createCountry };
export { City, getCities, getCitiesByCountry, createCity };
export { Area, getAreas, getAreasByCity, createArea };

export interface UserLocation {
    id?: number;
    house_number?: number;
    street_number?: string;
    landmark?: string;
    pin_location?: string;
    zip_code?: number;
    area?: Area;
    city: City;
    country: Country;
}

export const createLocation = async (location: UserLocation): Promise<UserLocation> => {
    console.log('[createLocation API] Sending payload:', JSON.stringify(location, null, 2));
    const response = await fetch(`${API_URL}/locations/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(location),
    });

    const responseText = await response.text();
    console.log('[createLocation API] Response Status:', response.status);
    console.log('[createLocation API] Response Body:', responseText);

    if (!response.ok) {
        throw new Error(`Failed to create location. Status: ${response.status}. Response: ${responseText}`);
    }

    try {
        return JSON.parse(responseText);
    } catch (e) {
        throw new Error(`Failed to parse location response as JSON. Content: ${responseText}`);
    }
};
