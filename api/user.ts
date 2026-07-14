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

// export const getUsers = async (): Promise<User[]> => {
//     const response = await fetch(`${API_URL}/User`);
//     const result = await response.json();
//     return result;
// };

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

// export const updateUser = async (user: User): Promise<User> => {
//     const result = await fetch(`${API_URL}/User/${user.id}`, {
//         method: 'PUT',
//         headers: {
//             'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(user),
//     });
//     return result.json();
// };

// export const deleteUser = async (id: number): Promise<User> => {
//     const result = await fetch(`${API_URL}/User/${id}`, {
//         method: 'DELETE',
//     });
//     return result.json();
// };

// export const getUserById = async (id: number): Promise<User> => {
//     const result = await fetch(`${API_URL}/User/${id}`);
//     return result.json();
// };

export const loginUser = async (phone_number: string, password: string): Promise<User> => {
    const url = `${API_URL}/app/user/login/`;
    console.log('[loginUser API] Logging in via URL:', url);
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone_number, password }),
    });
    const responseText = await response.text();
    console.log('[loginUser API] Response Status:', response.status);
    console.log('[loginUser API] Response Body:', responseText);

    if (!response.ok) {
        if (response.status === 400 || response.status === 401 || response.status === 403) {
            throw new Error('Invalid phone number or password. Please try again.');
        }
        throw new Error(`Login failed. Status: ${response.status}. Response: ${responseText}`);
    }

    try {
        return JSON.parse(responseText);
    } catch (e: any) {
        throw new Error(`Failed to parse login response as JSON. Error: ${e.message}. Content: ${responseText}`);
    }
};

// Verify user account on backend using their user ID and optional JWT access token
export const verifyUserOnBackend = async (userId: number, token?: string): Promise<any> => {
    const url = `${API_URL}/app/user/${userId}/verify/`;
    console.log('[verifyUserOnBackend] Verifying account via URL:', url);
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ is_verified: true }),
    });

    const responseText = await response.text();
    console.log('[verifyUserOnBackend] Response Status:', response.status);
    console.log('[verifyUserOnBackend] Response Body:', responseText);

    if (!response.ok) {
        throw new Error(`Verification failed on backend. Status: ${response.status}. Response: ${responseText}`);
    }

    try {
        return responseText ? JSON.parse(responseText) : {};
    } catch (e) {
        return { message: responseText };
    }
};