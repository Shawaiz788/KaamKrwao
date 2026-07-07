const BASE_URL = process.env.EXPO_PUBLIC_API_URL;
const API_URL = BASE_URL ? BASE_URL.replace(/\/$/, '') : '';
import { City, Country, Area, UserLocation } from './location';

export interface UserType {
    id: number;
    name: string;
}

export interface User {
    id?: number;
    first_name: string;
    last_name: string;
    phone_number: string;
    email: string;
    gender: string;
    password: string;
    overall_rating?: number;
    usertype_id: number;
    location_id: number;
}

export const getUsers = async (): Promise<User[]> => {
    const response = await fetch(`${API_URL}/User`);
    const result = await response.json();
    return result;
};

export const createUser = async (user: Omit<User, 'id'>): Promise<User> => {
    console.log('[createUser API] Sending payload:', JSON.stringify(user, null, 2));
    const response = await fetch(`${API_URL}/app/register/user/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(user),
    });

    const responseText = await response.text();
    console.log('[createUser API] Response Status:', response.status);
    console.log('[createUser API] Response Body:', responseText);

    if (!response.ok) {
        throw new Error(`Failed to create user. Status: ${response.status}. Response: ${responseText}`);
    }

    try {
        return JSON.parse(responseText);
    } catch (e) {
        throw new Error(`Failed to parse user response as JSON. Content: ${responseText}`);
    }
};

export const updateUser = async (user: User): Promise<User> => {
    const result = await fetch(`${API_URL}/User/${user.id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(user),
    });
    return result.json();
};

export const deleteUser = async (id: number): Promise<User> => {
    const result = await fetch(`${API_URL}/User/${id}`, {
        method: 'DELETE',
    });
    return result.json();
};

export const getUserById = async (id: number): Promise<User> => {
    const result = await fetch(`${API_URL}/User/${id}`);
    return result.json();
};

export const getUserByPhoneNumber = async (phoneNumber: string): Promise<User> => {
    const response = await fetch(`${API_URL}/User?phoneNumber=${phoneNumber}`);
    const result = await response.json();
    if (Array.isArray(result)) {
        return result[0];
    }
    return result;
};