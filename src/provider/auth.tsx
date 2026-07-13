import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { UserLocation } from '../../api/location';

export interface AppUser {
    uid: string;
    displayName: string;
    email: string;
    phoneNumber: string;
    id?: number;
    first_name: string;
    last_name: string;
    gender: string;
    usertype_id: number;
    location_id: number;
    location?: UserLocation;
    token?: string; // Optional JWT token
}

interface AuthContextType {
    user: AppUser | null;
    initializing: boolean;
    login: (user: AppUser) => Promise<void>;
    logout: () => Promise<void>;
    reloadUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    initializing: true,
    login: async () => { },
    logout: async () => { },
    reloadUser: async () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [initializing, setInitializing] = useState(true);
    const [user, setUser] = useState<AppUser | null>(null);

    const loadSession = async () => {
        try {
            const sessionStr = await SecureStore.getItemAsync('user_session');
            console.log('[SecureStore] Loaded user session string:', sessionStr);
            if (sessionStr) {
                const sessionUser = JSON.parse(sessionStr);
                setUser(sessionUser);
            } else {
                setUser(null);
            }
        } catch (e) {
            console.error('Error loading user session:', e);
        } finally {
            setInitializing(false);
        }
    };

    useEffect(() => {
        loadSession();
    }, []);

    const login = async (appUser: AppUser) => {
        try {
            // Save the JWT token separately if present in the user payload
            if (appUser.token) {
                await SecureStore.setItemAsync('user_token', appUser.token);
                console.log('[SecureStore] Saved user JWT token');
            }
            await SecureStore.setItemAsync('user_session', JSON.stringify(appUser, null, 4));
            console.log('[SecureStore] Saved user session:', appUser);
            setUser(appUser);
        } catch (e) {
            console.error('Error saving user session:', e);
            throw e;
        }
    };

    const logout = async () => {
        try {
            await SecureStore.deleteItemAsync('user_session');
            await SecureStore.deleteItemAsync('user_token');
            console.log('[SecureStore] Deleted user session and JWT token from device');
            setUser(null);
        } catch (e) {
            console.error('Error clearing user session:', e);
            throw e;
        }
    };

    const reloadUser = async () => {
        await loadSession();
    };

    return (
        <AuthContext.Provider value={{ user, initializing, login, logout, reloadUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
