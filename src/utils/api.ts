const BASE_URL = 'http://localhost:8080';

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = `HTTP Error ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData.message) {
        errorMsg = errorData.message;
      } else if (typeof errorData === 'string') {
        errorMsg = errorData;
      }
    } catch {
      const text = await response.text().catch(() => '');
      if (text) errorMsg = text;
    }
    throw new Error(errorMsg);
  }

  // Handle 204 No Content or empty bodies
  if (response.status === 204) {
    return {} as T;
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }

  return response.text() as unknown as T;
}
