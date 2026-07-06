//import sleep from 'sleep-promise';
const API_URL = process.env.EXPO_PUBLIC_API_URL;

export interface User {
    id: number;
    text: string;
    done: boolean;
    fullName: string;
}

export const getUsers = async (): Promise<User[]> => {
    //await sleep(2000);
    const response = await fetch(`${API_URL}/User`);

    const result = await response.json();

    return result;
};




export const createUser = async (text: string): Promise<User> => {
    const User = {
        text,
        done: false
    };

    const result = await fetch(`${API_URL}/User`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },

        body: JSON.stringify(User),
    });
    return result.json();
};

export const updateUser = async (User: User): Promise<User> => {
    const result = await fetch(`${API_URL}/User/${User.id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(User),
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
}

export const getUserByPhoneNumber = async (phoneNumber: string): Promise<User> => {
    const result = await fetch(`${API_URL}/User?phoneNumber=${phoneNumber}`);
    return result.json();
}