const API_URL = process.env.EXPO_PUBLIC_API_URL;
import { City, Country, Area } from './location';

export interface UserType {
    id: number;
    name: string;
}



export interface Location {
    house_number: number;
    street_number: string;
    landmark: string;
    pin_location: string;
    zip_code: number;
    area: Area;
    city: City;
    country: Country;
}

export interface User {
    id?: number;
    first_name: string;
    last_name: string;
    phone_number: string;
    email: string;
    gender: string;
    overall_rating?: number;
    user_type: UserType;
    location: Location;
}

export const getUsers = async (): Promise<User[]> => {
    const response = await fetch(`${API_URL}/User`);
    const result = await response.json();
    return result;
};

export const createUser = async (user: Omit<User, 'id' | 'overall_rating'>): Promise<User> => {
    const result = await fetch(`${API_URL}/app/register/user/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(user),
    });
    return result.json();
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