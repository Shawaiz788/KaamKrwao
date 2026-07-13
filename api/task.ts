import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;
const API_URL = BASE_URL ? BASE_URL.replace(/\/$/, '') : '';

// Helper to construct Authorization header using JWT token from SecureStore
const getAuthHeaders = async (extraHeaders: Record<string, string> = {}): Promise<Record<string, string>> => {
  const token = await SecureStore.getItemAsync('user_token');
  const headers: Record<string, string> = { ...extraHeaders };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export interface Category {
  id: number;
  name: string;
}

export interface PaymentPreference {
  id: number;
  name: string;
}

export interface Task {
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

export interface TaskChainInput {
  categoryId: number;
  categoryName: string;
  paymentPreferenceId: number;
  description: string;
  budget: number;
  userId: number;
  locationId: number;
  attachmentUris?: string[] | null;
}

// Upload file to backend attachment endpoint using multipart/form-data, linking it to taskId
export const uploadAttachment = async (uri: string, taskId: number): Promise<number> => {
  console.log(`[task API] Uploading attachment from uri: ${uri} for Task ID: ${taskId}`);

  // 1. Create a FormData instance
  const formData = new FormData();

  // 2. Extract name and mime type from uri
  const filename = uri.split('/').pop() || 'photo.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : `image/jpeg`;

  // 3. Append the file details using the format React Native expects for blobs/files
  formData.append('file', {
    uri,
    name: filename,
    type,
  } as any);

  // Append task relationship fields so backend registers this attachment to the task
  formData.append('task_id', taskId.toString());
  formData.append('task', taskId.toString());

  // 4. Dispatch multipart fetch request with authorization header
  const authHeaders = await getAuthHeaders({
    'Accept': 'application/json',
  });

  const response = await fetch(`${API_URL}/attachment/`, {
    method: 'POST',
    body: formData,
    headers: authHeaders,
  });

  const responseText = await response.text();
  console.log('[task API] Upload attachment response status:', response.status);
  console.log('[task API] Upload attachment response body:', responseText);

  if (!response.ok) {
    throw new Error(`Failed to upload attachment. Status: ${response.status}. Response: ${responseText}`);
  }

  try {
    const data = JSON.parse(responseText);
    return data.id; // Return the attachment's database ID
  } catch (e) {
    throw new Error(`Failed to parse attachment upload response. Content: ${responseText}`);
  }
};

// Fetch categories list (authenticated)
export const getCategoriesFromBackend = async (): Promise<Category[]> => {
  const authHeaders = await getAuthHeaders();
  const response = await fetch(`${API_URL}/category/`, {
    headers: authHeaders,
  });
  const responseText = await response.text();
  //console.log('[task API] Get categories response status:', response.status);

  if (!response.ok) {
    throw new Error(`Failed to fetch categories. Status: ${response.status}. Response: ${responseText}`);
  }

  return JSON.parse(responseText);
};

// Fetch payment preferences list (authenticated)
export const getPaymentPreferencesFromBackend = async (): Promise<PaymentPreference[]> => {
  const authHeaders = await getAuthHeaders();
  const response = await fetch(`${API_URL}/paymentpref/`, {
    headers: authHeaders,
  });
  const responseText = await response.text();
  //console.log('[task API] Get paymentpref response status:', response.status);

  if (!response.ok) {
    throw new Error(`Failed to fetch payment preferences. Status: ${response.status}. Response: ${responseText}`);
  }

  return JSON.parse(responseText);
};

// Send create task request (authenticated)
export const createTask = async (task: Omit<Task, 'id'>): Promise<Task> => {
  const authHeaders = await getAuthHeaders({
    'Content-Type': 'application/json',
  });
  const response = await fetch(`${API_URL}/task/`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify(task),
  });

  const responseText = await response.text();
  //  console.log('[task API] Create task response status:', response.status);
  //console.log('[task API] Create task response body:', responseText);

  if (!response.ok) {
    throw new Error(`Failed to create task. Status: ${response.status}. Response: ${responseText}`);
  }

  try {
    return JSON.parse(responseText);
  } catch (e) {
    throw new Error(`Failed to parse created task JSON response. Content: ${responseText}`);
  }
};

// Sequential task creation chain:
// 1. Match category ID
// 2. Match payment preference ID
// 3. Upload attachment (if any) to get attachment_id
// 4. Assemble inputs (subject, timestamps, location details)
// 5. Send request to endpoint
export const createTaskChain = async (input: TaskChainInput): Promise<Task> => {
  const { categoryId, categoryName, paymentPreferenceId, description, budget, userId, locationId, attachmentUris } = input;
  console.log('[createTaskChain] Resolving task creation sequence with pre-resolved IDs...', input);

  // 1. Construct Subject line
  const subject = `${categoryName} Service Needed`;

  // 2. Construct timestamp
  const preferredTime = new Date().toISOString();

  // 3. Dispatch task first (so we obtain its database ID)
  const taskPayload = {
    subject,
    body: description,
    price: budget,
    created_by: userId,
    preferred_time: preferredTime,
    location_id: locationId,
    status_id: 1, // Default status id is 1
    payment_preference_id: paymentPreferenceId,
    accurately_estimated: 0, // Default accurately_estimated
    category_id: categoryId,
  };

  const createdTask = await createTask(taskPayload);
  console.log(`[createTaskChain] Task created with ID: ${createdTask.id}. Now starting attachments upload...`);

  // 6. Upload multiple attachments to backend (now linked to task ID)
  if (attachmentUris && attachmentUris.length > 0 && createdTask.id) {
    const uploadPromises = attachmentUris.map(async (uri) => {
      try {
        const uploadResultId = await uploadAttachment(uri, createdTask.id!);
        console.log(`[createTaskChain] Attachment uploaded successfully with ID: ${uploadResultId} for Task ID: ${createdTask.id}`);
      } catch (err) {
        console.error(`[createTaskChain] Attachment upload failed for uri: ${uri}.`, err);
      }
    });

    // Run parallel uploads
    await Promise.all(uploadPromises);
  }

  return createdTask;
};
