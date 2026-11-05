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

  if (!isFormData && !headers['Content-Type']) {
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
    let errorData: any = null;

    try {
      errorData = await response.json();
      if (errorData?.message) {
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

    if (response.status === 401) {
      let expiredNotice = 'Your session has expired. Please log in again.';
      if (errorData?.error === 'SESSION_TERMINATED' || (errorData?.message && errorData.message.includes('another session'))) {
        expiredNotice = '⚠️ သင့်အကောင့်အား အခြားနေရာ (Device သို့မဟုတ် Tab) မှ Login ဝင်ရောက်သွားပါသဖြင့် ဤ Session ကို အလိုအလျောက် ပိတ်လိုက်ပါသည် (Your session expired because of a new login from another session).';
      } else if (errorMsg) {
        expiredNotice = errorMsg;
      }
      sessionStorage.setItem('auth_expired_message', expiredNotice);

      localStorage.removeItem('token');
      localStorage.removeItem('username');
      localStorage.removeItem('email');
      localStorage.removeItem('role');
      localStorage.removeItem('permissions');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
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
