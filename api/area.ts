const BASE_URL = process.env.EXPO_PUBLIC_API_URL;
const API_URL = BASE_URL ? BASE_URL.replace(/\/$/, '') : '';
import { fetchWithTimeout } from './fetchClient';

export interface Area {
    id: number;
    name: string;
}

export const getAreas = async (): Promise<Area[]> => {
    console.log('Fetching areas');
    const response = await fetchWithTimeout(`${API_URL}/app/area/`);
    console.log(response.status)
    console.log(response.json)
    return response.json();
};

// export const getAreasByCity = async (cityId: number): Promise<Area[]> => {
//     return getAreas();
// };

export const createArea = async (cityId: number, name: string): Promise<Area> => {
    const response = await fetchWithTimeout(`${API_URL}/app/area/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, city: cityId }),
    });
    return response.json();
};
