import { useRouter } from 'expo-router';
import { AppUser } from '@/context/auth';
import { USER_TYPE_PRO } from '@/constants/userTypes';

/**
 * Hook that returns a `routeAfterAuth` function.
 * Call it after sign-in, sign-up verification, or profile setup
 * to redirect the user to the correct home screen based on their usertype_id.
 *
 * Routing logic:
 *   - No displayName → profile-setup (new user, incomplete profile)
 *   - usertype_id === USER_TYPE_PRO (1) → /(protected)/(pro)/dashboard
 *   - otherwise (client) → /(protected)/(client)/home
 */
export function useRouteByUserType() {
    const router = useRouter();

    const routeAfterAuth = (user: AppUser) => {
        // New user with incomplete profile
        if (!user.displayName) {
            router.replace('/(protected)/profile-setup');
            return;
        }

        // Professional
        if (user.usertype_id === USER_TYPE_PRO) {
            router.replace('/(protected)/(pro)/dashboard');
            return;
        }

        // Client (default)
        router.replace('/(protected)/(client)/home');
    };

    return { routeAfterAuth };
}
