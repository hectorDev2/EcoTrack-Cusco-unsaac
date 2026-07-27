const apiUrl = process.env.NEXT_PUBLIC_API_URL;
if (!apiUrl) {
  throw new Error('NEXT_PUBLIC_API_URL environment variable is required');
}
const API_URL = apiUrl.replace(/\/+$/, '');

export class ApiClientError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options?: { token?: string },
): Promise<T> {
  const token = options?.token ?? getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include',
      signal: controller.signal,
    });
    clearTimeout(timeout);
  } catch {
    throw new ApiClientError(0, 'Network error');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: `HTTP ${response.status}`,
    }));
    throw new ApiClientError(
      response.status,
      error.message ?? 'Error del servidor',
      error,
    );
  }

  return response.json();
}

export const api = {
  get: <T>(path: string, options?: { token?: string }) =>
    request<T>('GET', path, undefined, options),
  post: <T>(path: string, body?: unknown, options?: { token?: string }) =>
    request<T>('POST', path, body, options),
  patch: <T>(path: string, body?: unknown, options?: { token?: string }) =>
    request<T>('PATCH', path, body, options),
  delete: <T>(path: string, options?: { token?: string }) =>
    request<T>('DELETE', path, undefined, options),
};

export function setToken(token: string) {
  localStorage.setItem('accessToken', token);
}

export function clearToken() {
  localStorage.removeItem('accessToken');
  document.cookie = 'auth_token=; path=/; max-age=0; SameSite=Lax';
}

export function isAuthenticated(): boolean {
  return !!getToken();
}
