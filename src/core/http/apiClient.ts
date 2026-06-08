import { fetchClient, resolveApiUrl } from "./fetchClient";
import { ApiError, resolveUserFacingMessage } from "./errorHandler";
import { notificationService } from "./notificationService";

async function parseJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) return {} as T;
  return JSON.parse(text) as T;
}

/** Fastify rejette un POST `application/json` sans corps — envoyer `{}` par défaut. */
function jsonRequestBody(data?: unknown): string {
  return JSON.stringify(data ?? {});
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
      body: jsonRequestBody(data),
    }),

  put: <T>(endpoint: string, data?: unknown, init?: RequestInit) =>
    request<T>(endpoint, {
      ...init,
      method: "PUT",
      body: jsonRequestBody(data),
    }),

  patch: <T>(endpoint: string, data?: unknown, init?: RequestInit) =>
    request<T>(endpoint, {
      ...init,
      method: "PATCH",
      body: jsonRequestBody(data),
    }),

  delete: <T>(endpoint: string, init?: RequestInit) =>
    request<T>(endpoint, { ...init, method: "DELETE" }),

  /** Requête avec un JWT explicite (ex. token renvoyé par `POST /v1/auth/driver/register`). */
  withToken: <T>(
    token: string,
    endpoint: string,
    init?: RequestInit & { data?: unknown }
  ) => {
    const { data, ...rest } = init ?? {};
    const method = rest.method ?? (data !== undefined ? "POST" : "GET");
    return request<T>(endpoint, {
      ...rest,
      method,
      headers: {
        ...(rest.headers as Record<string, string> | undefined),
        Authorization: `Bearer ${token}`,
      },
      body:
        data !== undefined && method !== "GET" && method !== "HEAD"
          ? jsonRequestBody(data)
          : rest.body,
    });
  },
};

/** Appel HTTP brut avec JWT custom (hors session portail courante). */
export async function requestWithToken<T>(
  token: string,
  endpoint: string,
  init?: RequestInit & { data?: unknown }
): Promise<T> {
  const { data, ...rest } = init ?? {};
  const method = rest.method ?? (data !== undefined ? "POST" : "GET");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-Client-Type": "back-office",
    Authorization: `Bearer ${token}`,
    ...(rest.headers as Record<string, string> | undefined),
  };

  const response = await fetch(resolveApiUrl(endpoint), {
    ...rest,
    method,
    headers,
    body:
      data !== undefined && method !== "GET" && method !== "HEAD"
        ? jsonRequestBody(data)
        : rest.body,
  });

  if (!response.ok) {
    let body: {
      message?: string;
      error?: { message?: string; code?: string };
    } = {};
    try {
      body = await response.json();
    } catch {
      body = { message: response.statusText };
    }
    const apiMessage =
      body.message ?? body.error?.message ?? `Erreur ${response.status}`;
    throw new ApiError(response.status, {
      message: apiMessage,
      code: body.error?.code,
      status: response.status,
    });
  }

  return parseJson<T>(response);
}

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
        body: jsonRequestBody(data),
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
