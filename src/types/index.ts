// ─── Location Types ───────────────────────────────────────────────────────────
export interface Country {
  id: number;
  name: string;
}

export interface City {
  id: number;
  name: string;
  country?: number;
}

export interface Area {
  id: number;
  name: string;
  city?: number;
}

export interface UserLocation {
  id?: number;
  house_number?: number;
  street_number?: string;
  area?: number;
  city?: number;
  country?: number;
  area_id?: number;
  city_id?: number;
  country_id?: number;
  formatted_address?: string;
  latitude?: number;
  longitude?: number;
  zip_code?: number;
}

// ─── User & Authentication Types ──────────────────────────────────────────────
export interface User {
  id?: number;
  first_name: string;
  last_name: string;
  phone_number?: string;
  email: string;
  gender: string;
  password?: string;
  overall_rating?: number;
  usertype_id: number;
  location_id: number;
  profile_pic?: string;
}

export interface AppUser extends User {
  uid: string;
  displayName?: string;
  phoneNumber?: string; // Firebase field
  location?: UserLocation;
  token?: string;      // JWT access token
  refreshToken?: string; // JWT refresh token
}

export interface UserType {
  id: number;
  name: string;
}

// ─── Pro Earnings Types ───────────────────────────────────────────────────────
export interface ProEarnings {
  worker_id: number;
  daily_earning: number;
  weekly_earning: number;
  total_earning: number;
  jobs_done: number;
  updated_at: string;
}

// ─── Pro Live Jobs Types ──────────────────────────────────────────────────────
export interface LiveJob {
  id: number;
  title: string;
  category: string;
  category_icon?: string;
  category_color?: string;
  budget: number;
  distance_km?: number;
  location_name: string;
  location_area?: string;
  customer_name: string;
  customer_rating?: number;
  scheduled_date?: string;
  created_at?: string;
  description?: string;
  attachments?: any[];
}

// ─── Client Post Job & Bid Types ──────────────────────────────────────────────
export interface Bid {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  reviewsCount: number;
  price: number;
  timeEstimate: string;
  message: string;
}

export interface Task {
  id: string;
  category: string;
  description: string;
  budget: number;
  locationName: string;
  paymentPref: string;
  status: 'searching' | 'bidding' | 'accepted' | 'completed' | 'cancelled';
  acceptedBid?: Bid;
  createdAt: string;
  backend_id?: number;
  attachmentUris?: string[] | null;
}

// ─── Backend API task models ──────────────────────────────────────────────────
export interface Category {
  id: number;
  name: string;
}

export interface PaymentPreference {
  id: number;
  name: string;
}

export interface Status {
  id: number;
  name: string;
}

export interface BackendTask {
  id?: number;
  subject: string;
  body: string;
  price: number;
  created_by: number;
  preferred_time: string;
  location_id: number;
  status_id: number;
  payment_preference_id: number;
  accurately_estimated: number;
  category_id: number;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'professional';
  time: string;
}

export interface Pro {
  id: string;
  name: string;
  category: string;
  rating: number;
  reviews: number;
  location: string;
  price: string;
  timeEstimate: string;
  policeVerified: boolean;
  avatar: string;
}
