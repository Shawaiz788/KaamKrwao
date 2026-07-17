import { fetchWithAuth } from './fetchClient';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;
const API_URL = BASE_URL ? BASE_URL.replace(/\/$/, '') : '';


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

  // 4. Dispatch multipart fetch request with authenticated wrapper
  const response = await fetchWithAuth(`${API_URL}/app/attachment/`, {
    method: 'POST',
    body: formData,
    headers: {
      'Accept': 'application/json',
    },
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

// Fetch categories list (authenticated with auto-retry)
export const getCategoriesFromBackend = async (): Promise<Category[]> => {
  const response = await fetchWithAuth(`${API_URL}/app/category`);
  const responseText = await response.text();
  //console.log('[task API] Get categories response status:', response.status);

  if (!response.ok) {
    throw new Error(`Failed to fetch categories. Status: ${response.status}. Response: ${responseText}`);
  }

  return JSON.parse(responseText);
};

// Fetch payment preferences list (authenticated with auto-retry)
export const getPaymentPreferencesFromBackend = async (token?: string): Promise<PaymentPreference[]> => {
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const response = await fetchWithAuth(`${API_URL}/app/paymentpref`, { headers });
  const responseText = await response.text();
  //console.log('[task API] Get paymentpref response status:', response.status);

  if (!response.ok) {
    throw new Error(`Failed to fetch payment preferences. Status: ${response.status}. Response: ${responseText}`);
  }

  return JSON.parse(responseText);
};

// Send create task request (authenticated with auto-retry)
export const createTask = async (task: Omit<Task, 'id'>): Promise<Task> => {
  const response = await fetchWithAuth(`${API_URL}/app/task`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
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
        //   console.log(`[createTaskChain] Attachment uploaded successfully with ID: ${uploadResultId} for Task ID: ${createdTask.id}`);
      } catch (err) {
        // console.error(`[createTaskChain] Attachment upload failed for uri: ${uri}.`, err);
      }
    });

    // Run parallel uploads
    await Promise.all(uploadPromises);
  }

  return createdTask;
};

export interface Status {
  id: number;
  name: string;
}

export const getStatusesFromBackend = async (token?: string): Promise<Status[]> => {
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const response = await fetchWithAuth(`${API_URL}/app/status/`, { headers });
  const responseText = await response.text();
  console.log('[task API] Get statuses response status:', response.status);

  if (!response.ok) {
    throw new Error(`Failed to fetch statuses. Status: ${response.status}. Response: ${responseText}`);
  }

  return JSON.parse(responseText);
};

export const updateTaskStatusOnBackend = async (
  taskId: number,
  statusId: number,
  token?: string
): Promise<any> => {
  console.log(`[task API] Updating status of task ${taskId} to status ${statusId}`);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const response = await fetchWithAuth(`${API_URL}/app/task/${taskId}/`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ status_id: statusId }),
  });
  const responseText = await response.text();
  console.log('[task API] Update task status response status:', response.status);

  if (!response.ok) {
    throw new Error(`Failed to update task status on backend. Status: ${response.status}. Response: ${responseText}`);
  }

  try {
    return JSON.parse(responseText);
  } catch (e) {
    return { message: responseText };
  }
};
