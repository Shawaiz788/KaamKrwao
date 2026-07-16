const BASE_URL = process.env.EXPO_PUBLIC_API_URL;
const API_URL = BASE_URL ? BASE_URL.replace(/\/$/, '') : '';
import { City, Country, Area, UserLocation } from './location';
import { fetchWithTimeout, fetchWithAuth } from './fetchClient';
import * as SecureStore from 'expo-secure-store';

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
    password?: string;
    overall_rating?: number;
    usertype_id: number;
    location_id: number;
    profile_pic?: string;
}


// export const getUsers = async (): Promise<User[]> => {
//     const response = await fetch(`${API_URL}/User`);
//     const result = await response.json();
//     return result;
// };

export const createUser = async (user: Omit<User, 'id'>): Promise<User> => {
    console.log('[createUser API] Sending payload:', JSON.stringify(user, null, 2));
    const response = await fetchWithTimeout(`${API_URL}/app/register`, {
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
        if (response.status === 400) {
            try {
                const data = JSON.parse(responseText);
                if (data) {
                    if (data.phone_number) {
                        throw new Error('Phone number is already registered.');
                    }
                    if (data.email) {
                        throw new Error('Email address is already registered.');
                    }
                }
            } catch (e: any) {
                if (e.message === 'Phone number is already registered.' || e.message === 'Email address is already registered.') {
                    throw e;
                }
            }
            throw new Error('Invalid registration details. Please verify your fields.');
        }
        if (response.status === 404) {
            throw new Error('The registration server could not be reached (404). Please try again later.');
        }
        if (response.status >= 500) {
            throw new Error('The server is temporarily busy or undergoing maintenance. Please try again in a few moments (5xx).');
        }
        throw new Error(`Registration failed. Status: ${response.status}. Please check your details and try again.`);
    }

    try {
        return JSON.parse(responseText);
    } catch (e) {
        throw new Error(`Failed to parse user response as JSON. Content: ${responseText}`);
    }
};



export const loginUser = async (phone_number: string, password: string): Promise<User> => {
    const url = `${API_URL}/app/login`;
    console.log('[loginUser API] Logging in via URL:', url);
    const response = await fetchWithTimeout(url, {
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
        if (response.status === 404) {
            throw new Error('The login server could not be reached (404). Please try again later.');
        }
        if (response.status >= 500) {
            throw new Error('The server is temporarily busy or undergoing maintenance. Please try again in a few moments (5xx).');
        }
        throw new Error(`Login failed. Status: ${response.status}. Please check your details and try again.`);
    }

    try {
        return JSON.parse(responseText);
    } catch (e: any) {
        throw new Error(`Failed to parse login response as JSON. Error: ${e.message}. Content: ${responseText}`);
    }
};

// Verify user account on backend using their user ID and optional JWT access token
export const verifyUserOnBackend = async (userId: number, token?: string): Promise<any> => {
    const url = `${API_URL}/app/verify/${userId}/`;
    console.log('[verifyUserOnBackend] Verifying account via URL:', url);
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetchWithTimeout(url, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ is_verified: true }),
    });

    const responseText = await response.text();
    console.log('[verifyUserOnBackend] Response Status:', response.status);
    console.log('[verifyUserOnBackend] Response Body:', responseText);

    if (!response.ok) {
        if (response.status === 404) {
            throw new Error('The verification server could not be reached (404). Please try again later.');
        }
        if (response.status >= 500) {
            throw new Error('The server is temporarily busy or undergoing maintenance. Please try again in a few moments (5xx).');
        }
        throw new Error(`Verification failed on backend. Status: ${response.status}.`);
    }

    try {
        return responseText ? JSON.parse(responseText) : {};
    } catch (e) {
        return { message: responseText };
    }
};

// Check if a phone number is already registered in the system (returns true if exists, false otherwise)
export const checkPhoneExists = async (phoneNumber: string): Promise<boolean> => {
    const url = `${API_URL}/app/register`;
    console.log('[checkPhoneExists] Checking phone existence via URL:', url);
    try {
        const response = await fetchWithTimeout(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ phone_number: phoneNumber }),
        });

        const responseText = await response.text();
        console.log('[checkPhoneExists] Response Status:', response.status);
        console.log('[checkPhoneExists] Response Body:', responseText);

        if (response.status === 400) {
            try {
                const data = JSON.parse(responseText);
                if (data && data.phone_number) {
                    const errors = Array.isArray(data.phone_number) ? data.phone_number : [data.phone_number];
                    const hasExistsError = errors.some((err: string) =>
                        err.toLowerCase().includes('exist') ||
                        err.toLowerCase().includes('unique')
                    );
                    if (hasExistsError) {
                        return true; // Phone number already registered!
                    }
                }
            } catch (e) {
                console.error('[checkPhoneExists] Failed to parse JSON error response:', e);
            }
        }
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('The registration server could not be reached (404). Please try again later.');
            }
            if (response.status >= 500) {
                throw new Error('The server is temporarily busy or undergoing maintenance. Please try again in a few moments (5xx).');
            }
            throw new Error(`Check failed. Status: ${response.status}`);
        }
        return false;
    } catch (error: any) {
        console.error('[checkPhoneExists] Connection error during check:', error);
        throw error;
    }
};

export const updateUserOnBackend = async (
    userId: number,
    userDetails: Partial<User>
): Promise<User> => {
    console.log(`[user API] Updating user details on backend for User ID: ${userId}`, userDetails);

    const response = await fetchWithAuth(`${API_URL}/app/update/user/`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(userDetails),
    });
    const responseText = await response.text();
    console.log('[user API] Update user response status:', response.status);

    if (!response.ok) {
        throw new Error(`Failed to update profile on backend. Status: ${response.status}. Response: ${responseText}`);
    }

    try {
        return JSON.parse(responseText);
    } catch (e) {
        throw new Error(`Failed to parse profile update response as JSON. Content: ${responseText}`);
    }
};

export const updateProfilePic = async (
    uri: string
): Promise<User> => {
    console.log(`[user API] Uploading profile picture from uri: ${uri}`);
    const formData = new FormData();
    const filename = uri.split('/').pop() || 'profile.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image/jpeg`;

    formData.append('profile_pic', {
        uri,
        name: filename,
        type,
    } as any);

    const response = await fetchWithAuth(`${API_URL}/app/update/user/`, {
        method: 'PATCH',
        body: formData,
        headers: {
            'Accept': 'application/json',
        },
    });

    const responseText = await response.text();
    console.log('[user API] Update profile pic response status:', response.status);

    if (!response.ok) {
        throw new Error(`Failed to update profile picture on backend. Status: ${response.status}. Response: ${responseText}`);
    }

    try {
        return JSON.parse(responseText);
    } catch (e) {
        throw new Error(`Failed to parse profile picture update response. Content: ${responseText}`);
    }
};