/**
 * Shared API client utilities for TheBridge
 */

export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public statusText: string,
    public endpoint: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
  timeout?: number;
}

/**
 * Enhanced fetch wrapper with error handling and timeout
 * @param url Full URL or path
 * @param options Fetch options with params and timeout
 * @returns Parsed JSON response
 * @throws APIError on non-2xx responses or network errors
 */
export async function apiFetch<T>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const { params, timeout = 30000, ...fetchOptions } = options;

  // Build URL with query params
  const finalUrl = new URL(url, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      finalUrl.searchParams.append(key, value);
    });
  }

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(finalUrl.toString(), {
      ...fetchOptions,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new APIError(
        errorText,
        response.status,
        response.statusText,
        finalUrl.pathname
      );
    }

    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof APIError) {
      throw error;
    }

    if ((error as Error).name === 'AbortError') {
      throw new APIError(
        'Request timeout',
        408,
        'Request Timeout',
        finalUrl.pathname
      );
    }

    throw new APIError(
      (error as Error).message || 'Network error',
      0,
      'Network Error',
      finalUrl.pathname
    );
  }
}

/**
 * Helper for GET requests
 */
export function apiGet<T>(url: string, params?: Record<string, string>): Promise<T> {
  return apiFetch<T>(url, { method: 'GET', params });
}

/**
 * Helper for POST requests
 */
export function apiPost<T>(url: string, data?: unknown): Promise<T> {
  return apiFetch<T>(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * Helper for PATCH requests
 */
export function apiPatch<T>(url: string, data?: unknown): Promise<T> {
  return apiFetch<T>(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * Helper for DELETE requests
 */
export function apiDelete<T>(url: string): Promise<T> {
  return apiFetch<T>(url, { method: 'DELETE' });
}
