import React, { createContext, useContext, useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, User, reload } from '@react-native-firebase/auth';

interface AuthContextType {
    user: User | null;
    initializing: boolean;
    reloadUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    initializing: true,
    reloadUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [initializing, setInitializing] = useState(true);
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        // Listen to Firebase auth state changes
        const auth = getAuth();
        const subscriber = onAuthStateChanged(auth, (userState) => {
            setUser(userState);
            if (initializing) setInitializing(false);
        });
        return subscriber; // unsubscribe on unmount
    }, [initializing]);

    const reloadUser = async () => {
        const auth = getAuth();
        if (auth.currentUser) {
            await reload(auth.currentUser);
            setUser(auth.currentUser);
        }
    };

    return (
        <AuthContext.Provider value={{ user, initializing, reloadUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
