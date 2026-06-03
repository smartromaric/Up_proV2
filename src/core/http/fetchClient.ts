import { env } from "@/core/config/env";
import { useAuthStore } from "@/core/auth/authStore";
import { AppError, AuthError, NetworkError } from "./errorHandler";

const API_BASE = `${env.apiUrl}/api/v2`;

export function getApiBaseUrl(): string {
  return API_BASE;
}

async function createHeaders(
  customHeaders: Record<string, string> = {},
  isAuthRequest = false
): Promise<Record<string, string>> {
  const { token } = useAuthStore.getState();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-Client-Type": "back-office",
    ...customHeaders,
  };

  if (token && !isAuthRequest) {
    headers.Authorization = `Bearer ${token}`;
  }

  const { user } = useAuthStore.getState();
  if (user && !isAuthRequest) {
    headers["X-Scope"] = user.scope;
    if (user.franchise_id != null) {
      headers["X-Franchise-Id"] = String(user.franchise_id);
    }
    if (user.owner_id != null) {
      headers["X-Owner-Id"] = String(user.owner_id);
    }
  }

  return headers;
}

const LOGIN_BY_ROLE: Record<string, string> = {
  admin: "/admin/login",
  partner: "/partner/login",
  franchise: "/franchise/login",
  dispatch: "/dispatch/login",
};

export async function fetchClient(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const isAuthRequest =
    endpoint.includes("/auth/login") || endpoint.includes("/auth/logout");

  try {
    const headers = await createHeaders(
      options.headers as Record<string, string>,
      isAuthRequest
    );

    const url = endpoint.startsWith("http")
      ? endpoint
      : `${API_BASE}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

    const response = await fetch(url, { ...options, headers });

    if (response.status === 401 && !isAuthRequest) {
      const role = useAuthStore.getState().user?.role;
      useAuthStore.getState().clearSession();
      if (typeof window !== "undefined") {
        window.location.href = LOGIN_BY_ROLE[role ?? "admin"] ?? "/login";
      }
      throw new AuthError("Session expirée. Veuillez vous reconnecter.");
    }

    return response;
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (error instanceof Error && error.name === "TypeError") {
      throw new NetworkError();
    }
    throw new AppError("Erreur lors de la requête", "FETCH_ERROR");
  }
}

export default fetchClient;
