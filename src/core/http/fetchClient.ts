import { env } from "@/core/config/env";
import { LOGIN_BY_PORTAL } from "@/core/auth/authRoutes";
import { useAuthStore } from "@/core/auth/authStore";
import { AppError, AuthError, NetworkError } from "./errorHandler";

const API_V2_BASE = `${env.apiUrl}/api/v2`;

export function getApiBaseUrl(): string {
  return API_V2_BASE;
}

export function getApiV1BaseUrl(): string {
  return `${env.apiUrl}/v1`;
}

/** Résout l'URL complète selon le préfixe du chemin (v1 auth vs api/v2 back-office). */
export function resolveApiUrl(endpoint: string): string {
  if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
    return endpoint;
  }
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  if (path.startsWith("/v1/")) {
    return `${env.apiUrl}${path}`;
  }
  return `${API_V2_BASE}${path}`;
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

/** Routes auth publiques (login portail, mot de passe oublié, OTP, refresh). */
function isPublicAuthEndpoint(endpoint: string): boolean {
  if (!endpoint.includes("/auth/")) return false;
  return (
    endpoint.includes("/login") ||
    endpoint.includes("/forgot") ||
    endpoint.includes("/otp/") ||
    endpoint.includes("/refresh")
  );
}

export async function fetchClient(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  /** Routes publiques : pas de Bearer (logout/me nécessitent le JWT). */
  const isAuthRequest = isPublicAuthEndpoint(endpoint);

  try {
    const headers = await createHeaders(
      options.headers as Record<string, string>,
      isAuthRequest
    );

    const url = resolveApiUrl(endpoint);

    const response = await fetch(url, { ...options, headers });

    if (response.status === 401 && !isAuthRequest) {
      const role = useAuthStore.getState().user?.role;
      useAuthStore.getState().clearSession();
      if (typeof window !== "undefined") {
        window.location.href =
          LOGIN_BY_PORTAL[role as keyof typeof LOGIN_BY_PORTAL] ?? "/login";
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
