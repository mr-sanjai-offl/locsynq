const API_BASE = '/api';

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = sessionStorage.getItem('bucketToken');
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>) || {},
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Don't set Content-Type for FormData (browser sets it with boundary)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || 'Request failed');
  }
  return data.data;
}

// ─── Bucket API ───
export const bucketApi = {
  create: (body: { name: string; mode: string; pin?: string; expiresInMinutes?: number }) =>
    request<{ bucket: any; ownerToken: string }>('/bucket/create', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  list: () => request<any[]>('/bucket/list'),

  get: (id: string) => request<any>(`/bucket/${id}`),

  delete: (id: string) => {
    const ownerToken = localStorage.getItem(`owner_token_${id}`);
    return request<any>(`/bucket/${id}`, {
      method: 'DELETE',
      headers: ownerToken ? { Authorization: `Bearer ${ownerToken}` } : {},
    });
  },
};

// ─── Auth API ───
export const authApi = {
  authenticate: (bucketId: string, pin: string) =>
    request<{ token: string; bucketId: string }>(`/bucket/${bucketId}/auth`, {
      method: 'POST',
      body: JSON.stringify({ pin }),
    }),
};

// ─── File API ───
export const fileApi = {
  list: (bucketId: string) => request<any[]>(`/bucket/${bucketId}/files`),

  upload: (
    bucketId: string,
    files: File[],
    onProgress?: (progress: number) => void
  ): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      files.forEach((file) => formData.append('files', file));

      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_BASE}/bucket/${bucketId}/upload`);

      // Add auth token
      const token = sessionStorage.getItem('bucketToken');
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

      const ownerToken = sessionStorage.getItem(`ownerToken_${bucketId}`);
      if (ownerToken) xhr.setRequestHeader('Authorization', `Bearer ${ownerToken}`);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        try {
          const data = JSON.parse(xhr.responseText);
          if (data.success) resolve(data.data);
          else reject(new Error(data.error || 'Upload failed'));
        } catch {
          reject(new Error('Upload failed'));
        }
      };

      xhr.onerror = () => reject(new Error('Upload failed'));
      xhr.send(formData);
    });
  },

  getDownloadUrl: (bucketId: string, fileName: string) =>
    `${API_BASE}/bucket/${bucketId}/files/${encodeURIComponent(fileName)}`,

  delete: (bucketId: string, fileName: string) =>
    request<any>(`/bucket/${bucketId}/files/${encodeURIComponent(fileName)}`, {
      method: 'DELETE',
    }),
};

// ─── Content API ───
export const contentApi = {
  list: (bucketId: string) => request<any[]>(`/bucket/${bucketId}/content`),

  addText: (bucketId: string, value: string, label?: string) =>
    request<any>(`/bucket/${bucketId}/text`, {
      method: 'POST',
      body: JSON.stringify({ value, label }),
    }),

  addLink: (bucketId: string, url: string, label?: string) =>
    request<any>(`/bucket/${bucketId}/link`, {
      method: 'POST',
      body: JSON.stringify({ url, label }),
    }),

  delete: (bucketId: string, contentId: string) =>
    request<any>(`/bucket/${bucketId}/content/${contentId}`, {
      method: 'DELETE',
    }),
};

// ─── Peers API ───
export const peersApi = {
  list: () => request<{ self: any; peers: any[] }>('/peers'),
};

// ─── Health API ───
export const healthApi = {
  check: () => request<any>('/health'),
};
