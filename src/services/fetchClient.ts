import * as SecureStore from 'expo-secure-store';

const TIMEOUT_MS = 10000; // 10 seconds timeout
const BASE_URL = process.env.EXPO_PUBLIC_API_URL;
const API_URL = BASE_URL ? BASE_URL.replace(/\/$/, '') : '';

export const fetchWithTimeout = async (url: string, options: RequestInit = {}): Promise<Response> => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
        });
        clearTimeout(id);
        return response;
    } catch (error: any) {
        clearTimeout(id);
        if (error.name === 'AbortError') {
            throw new Error('Connection timed out. The server is not responding. Please check your internet connection or try again later.');
        }
        if (error.message && error.message.includes('Network request failed')) {
            throw new Error('Network connection error. Please make sure the server is running and check your internet connection.');
        }
        throw error;
    }
};

// Helper to request a new access token from the backend refresh token endpoint
export const refreshAccessToken = async (refreshToken: string): Promise<string> => {
    const url = `${API_URL}/app/token/refresh/`;
    console.log('[fetchClient] Refreshing access token via URL:', url);
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken }),
    });

    const responseText = await response.text();
    if (!response.ok) {
        throw new Error(`Token refresh failed. Status: ${response.status}. Response: ${responseText}`);
    }

    try {
        const data = JSON.parse(responseText);
        const newAccessToken = data.access || data.access_token || data.token;
        if (!newAccessToken) {
            throw new Error('No access token returned from refresh API');
        }
        return newAccessToken;
    } catch (e) {
        throw new Error(`Failed to parse token refresh response. Content: ${responseText}`);
    }
};

// Helper to construct Authorization header using JWT token from SecureStore (with automatic background refresh)
export const getAuthHeaders = async (extraHeaders: Record<string, string> = {}): Promise<Record<string, string>> => {
    let token = await SecureStore.getItemAsync('user_token');
    const savedAtStr = await SecureStore.getItemAsync('user_token_saved_at');
    const refreshToken = await SecureStore.getItemAsync('user_refresh_token');

    if (token && savedAtStr && refreshToken) {
        const savedAt = parseInt(savedAtStr, 10);
        const now = Date.now();
        const thirtyMinutes = 30 * 60 * 1000;

        if (now - savedAt > thirtyMinutes) {
            console.log('[fetchClient] JWT access token is older than 30 minutes. Triggering refresh...');
            try {
                const newAccessToken = await refreshAccessToken(refreshToken);

                // Save new access token and update timestamp
                await SecureStore.setItemAsync('user_token', newAccessToken);
                await SecureStore.setItemAsync('user_token_saved_at', now.toString());

                // Update the user_session payload so the Auth context remains synchronized
                const sessionStr = await SecureStore.getItemAsync('user_session');
                if (sessionStr) {
                    const sessionUser = JSON.parse(sessionStr);
                    sessionUser.token = newAccessToken;
                    await SecureStore.setItemAsync('user_session', JSON.stringify(sessionUser, null, 4));
                }

                token = newAccessToken;
            } catch (err) {
                console.error('[fetchClient] Background JWT token refresh failed. Proceeding with old token:', err);
            }
        }
    }

    const headers: Record<string, string> = { ...extraHeaders };
    if (token && !headers['Authorization']) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

// Wrapper around fetch that intercepts 401 errors, auto-refreshes the token, and retries the call once
export const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
    // 1. Inject auth headers
    const authHeaders = await getAuthHeaders(options.headers as Record<string, string>);

    // 2. Make original request using fetchWithTimeout
    let response = await fetchWithTimeout(url, {
        ...options,
        headers: authHeaders,
    });

    // 3. If unauthorized (401), perform a token refresh and retry
    if (response.status === 401) {
        console.log('[fetchClient] Access token is invalid or expired (401). Attempting background refresh...');
        const refreshToken = await SecureStore.getItemAsync('user_refresh_token');

        if (refreshToken) {
            try {
                const newAccessToken = await refreshAccessToken(refreshToken);
                const now = Date.now();

                // Overwrite token and timestamp
                await SecureStore.setItemAsync('user_token', newAccessToken);
                await SecureStore.setItemAsync('user_token_saved_at', now.toString());

                // Keep local user session in sync
                const sessionStr = await SecureStore.getItemAsync('user_session');
                if (sessionStr) {
                    const sessionUser = JSON.parse(sessionStr);
                    sessionUser.token = newAccessToken;
                    await SecureStore.setItemAsync('user_session', JSON.stringify(sessionUser, null, 4));
                }

                // Retry the request with the refreshed bearer token
                const retryHeaders = {
                    ...options.headers,
                    'Authorization': `Bearer ${newAccessToken}`,
                };

                console.log('[fetchClient] Retrying failed request with new access token...');
                response = await fetchWithTimeout(url, {
                    ...options,
                    headers: retryHeaders,
                });
            } catch (refreshErr) {
                console.error('[fetchClient] Background token refresh retry failed:', refreshErr);
            }
        }
    }

    return response;
};
