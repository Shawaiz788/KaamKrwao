import { fetchWithAuth } from './fetchClient';
import { User } from '@/types';
import { AdminUserItem, ProDetails } from '@/types/admin';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;
const API_URL = BASE_URL ? BASE_URL.replace(/\/$/, '') : '';

export const getUserProfile = async (id: number): Promise<AdminUserItem> => {
  const response = await fetchWithAuth(`${API_URL}/app/profile/${id}/`);
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Failed to fetch user profile (${id}). Status: ${response.status}`);
  }
  return JSON.parse(text);
};

export const updateAdminUser = async (id: number, data: Partial<User>): Promise<User> => {
  const response = await fetchWithAuth(`${API_URL}/app/update/user/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...data }),
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Failed to update user. Status: ${response.status}`);
  }
  return JSON.parse(text);
};

export const updateAdminUserImage = async (uri: string): Promise<any> => {
  const formData = new FormData();
  const filename = uri.split('/').pop() || 'profile.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : `image/jpeg`;

  formData.append('file', { uri, name: filename, type } as any);

  const response = await fetchWithAuth(`${API_URL}/app/update/user/image/`, {
    method: 'PATCH',
    body: formData,
    headers: { Accept: 'application/json' },
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Failed to update user image. Status: ${response.status}`);
  }
  return JSON.parse(text);
};

export const getVerificationStatus = async (id: number): Promise<any> => {
  const response = await fetchWithAuth(`${API_URL}/app/verify/${id}/`);
  const text = await response.text();
  if (!response.ok) {
    return { is_verified: false };
  }
  try {
    return JSON.parse(text);
  } catch {
    return { is_verified: false };
  }
};

export const verifyUserStatus = async (id: number, isVerified: boolean): Promise<any> => {
  const response = await fetchWithAuth(`${API_URL}/app/verify/${id}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_verified: isVerified }),
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Failed to verify user. Status: ${response.status}`);
  }
  try {
    return JSON.parse(text);
  } catch {
    return { is_verified: isVerified };
  }
};

export const getUserRating = async (userId: number): Promise<{ rating: number; count: number }> => {
  const response = await fetchWithAuth(`${API_URL}/app/review/rating/${userId}/`);
  const text = await response.text();
  if (!response.ok) {
    return { rating: 5.0, count: 0 };
  }
  try {
    const data = JSON.parse(text);
    return {
      rating: Number(data.rating || data.overall_rating || 5.0),
      count: Number(data.count || data.total_reviews || 0),
    };
  } catch {
    return { rating: 5.0, count: 0 };
  }
};
