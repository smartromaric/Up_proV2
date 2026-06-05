import { fetchClient } from "./fetchClient";
import { ApiError, resolveUserFacingMessage } from "./errorHandler";
import { notificationService } from "./notificationService";

async function parseJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) return {} as T;
  return JSON.parse(text) as T;
}

async function request<T>(
  endpoint: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetchClient(endpoint, init);

  if (!response.ok) {
    let body: {
      message?: string;
      code?: string;
      details?: unknown;
      error?: { message?: string; code?: string };
    } = {};
    try {
      body = await response.json();
    } catch {
      body = { message: response.statusText };
    }
    const apiMessage =
      body.message ??
      body.error?.message ??
      `Erreur ${response.status}`;
    const apiCode = body.code ?? body.error?.code;
    throw new ApiError(response.status, {
      message: resolveUserFacingMessage(apiCode, apiMessage),
      code: apiCode,
      details: body.details ?? body.error,
      status: response.status,
    });
  }

  return parseJson<T>(response);
}

export const apiClient = {
  get: <T>(endpoint: string, init?: RequestInit) =>
    request<T>(endpoint, { ...init, method: "GET" }),

  post: <T>(endpoint: string, data?: unknown, init?: RequestInit) =>
    request<T>(endpoint, {
      ...init,
      method: "POST",
      body: data !== undefined ? JSON.stringify(data) : undefined,
    }),

  put: <T>(endpoint: string, data?: unknown, init?: RequestInit) =>
    request<T>(endpoint, {
      ...init,
      method: "PUT",
      body: data !== undefined ? JSON.stringify(data) : undefined,
    }),

  patch: <T>(endpoint: string, data?: unknown, init?: RequestInit) =>
    request<T>(endpoint, {
      ...init,
      method: "PATCH",
      body: data !== undefined ? JSON.stringify(data) : undefined,
    }),

  delete: <T>(endpoint: string, init?: RequestInit) =>
    request<T>(endpoint, { ...init, method: "DELETE" }),
};

/** Méthodes legacy avec toasts — pour mutations rapides */
export const apiWithNotify = {
  async post<T>(
    endpoint: string,
    data?: unknown,
    successMessage?: string
  ): Promise<T | null> {
    try {
      const response = await fetchClient(endpoint, {
        method: "POST",
        body: data !== undefined ? JSON.stringify(data) : undefined,
      });
      if (notificationService.handleApiResponse(response, successMessage)) {
        return parseJson<T>(response);
      }
      return null;
    } catch (error) {
      notificationService.handleJavaScriptError(error as Error);
      throw error;
    }
  },
};

export default apiClient;
