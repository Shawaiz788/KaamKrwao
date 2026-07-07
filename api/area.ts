const BASE_URL = process.env.EXPO_PUBLIC_LOCATION_API_URL;
const API_URL = BASE_URL ? BASE_URL.replace(/\/$/, '') : '';

export interface Area {
    id: number;
    name: string;
}

export const getAreas = async (): Promise<Area[]> => {
    const response = await fetch(`${API_URL}/areas/`);
    return response.json();
};

export const getAreasByCity = async (cityId: number): Promise<Area[]> => {
    return getAreas();
};

export const createArea = async (cityId: number, name: string): Promise<Area> => {
    const response = await fetch(`${API_URL}/areas/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, city: cityId }),
    });
    return response.json();
};
