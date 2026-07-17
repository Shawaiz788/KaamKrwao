import { Slot, Redirect, usePathname } from 'expo-router';
import { useAuth } from '@/context/auth';
import { View, ActivityIndicator } from 'react-native';
import { USER_TYPE_PRO } from '../../constants/userTypes';

export default function ProtectedLayout() {
    const { user, initializing } = useAuth();
    const pathname = usePathname();

    if (initializing) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' }}>
                <ActivityIndicator size="large" color="#16A34A" />
            </View>
        );
    }

    if (!user) {
        return <Redirect href='/' />;
    }

    const isProfileIncomplete = !user.displayName;
    if (isProfileIncomplete && pathname !== '/profile-setup') {
        return <Redirect href='/profile-setup' />;
    }

    return <Slot />;
}
