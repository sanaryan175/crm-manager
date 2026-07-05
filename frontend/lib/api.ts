const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_URL}${path}`;
  
  const headers = new Headers(options.headers || {});
  
  // Set JSON headers by default if not specified and body is present
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  
  // Retrieve token from localStorage
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch {
    throw new Error('Network error. Please check your connection and try again.');
  }

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (e) {
    data = { success: false, message: 'Invalid server response format' };
  }

  if (!response.ok) {
    // 401 — token expired or invalid; signal the auth context to log out
    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        const hadToken = localStorage.getItem('auth_token');
        localStorage.removeItem('auth_token');
        if (hadToken) {
          window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        }
      }
    }
    throw new Error(data.message || `API error: ${response.status}`);
  }

  return data.data; // Standard response envelope returns data inside .data
}
