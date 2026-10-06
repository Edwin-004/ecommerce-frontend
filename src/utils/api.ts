const BASE_URL = 'http://localhost:8080';

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('token');

  // Check whether request body is FormData
  const isFormData = options.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  // JSON request only
  // FormData အတွက် Content-Type ကို manually မထည့်ရပါ
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http')
    ? endpoint
    : `${BASE_URL}${endpoint}`;

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

      if (text) {
        errorMsg = text;
      }
    }

    throw new Error(errorMsg);
  }

  // 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  const contentType =
    response.headers.get('content-type');

  if (
    contentType &&
    contentType.includes('application/json')
  ) {
    return response.json();
  }

  return response.text() as unknown as T;
}