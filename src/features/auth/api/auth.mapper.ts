import type { AuthSession, PortalRole, Scope, User } from "@/shared/types";
import type {
  ApiAuthLoginResponse,
  ApiAuthMeResponse,
  ApiUserType,
} from "./auth.types";
import { ADMIN_BACKOFFICE_PERMISSIONS } from "./auth.permissions";

const PORTAL_BY_USER_TYPE: Record<string, PortalRole> = {
  ADMIN: "admin",
  PARTNER: "partner",
  FRANCHISE: "franchise",
  DRIVER: "dispatch",
  CLIENT: "admin",
};

const SCOPE_BY_PORTAL: Record<PortalRole, Scope> = {
  admin: "platform",
  franchise: "franchise",
  partner: "owner",
  dispatch: "platform",
};

function resolvePortal(
  expectedPortal: PortalRole,
  userType?: ApiUserType
): PortalRole {
  if (!userType) return expectedPortal;
  const mapped = PORTAL_BY_USER_TYPE[String(userType).toUpperCase()];
  return mapped ?? expectedPortal;
}

function defaultPermissions(portal: PortalRole): string[] {
  switch (portal) {
    case "admin":
      return ADMIN_BACKOFFICE_PERMISSIONS;
    case "partner":
      return [
        "ops.dashboard.view",
        "ops.trips.view",
        "ops.map.view",
        "fleet.drivers.view",
        "finance.wallets.view",
      ];
    case "franchise":
      return [
        "ops.dashboard.view",
        "ops.map.view",
        "ops.trips.view",
        "ops.dispatch.view",
        "network.partners.view",
        "fleet.drivers.view",
        "fleet.kyc.approve",
        "finance.wallets.view",
      ];
    case "dispatch":
      return ["ops.dispatch.view", "ops.trips.view", "ops.map.view"];
    default:
      return [];
  }
}

function extractAccessToken(data: ApiAuthLoginResponse): string {
  const token =
    data.accessToken ??
    data.session?.access_token ??
    "";
  if (!token) {
    throw new Error("Réponse auth invalide : access_token manquant");
  }
  return token;
}

function extractRefreshToken(data: ApiAuthLoginResponse): string | null {
  return (
    data.refreshToken ??
    data.session?.refresh_token ??
    null
  );
}

type ApiAuthUserPayload = Pick<
  ApiAuthLoginResponse,
  "profile" | "user" | "userType" | "role"
>;

function buildUserFromApi(
  data: ApiAuthUserPayload,
  expectedPortal: PortalRole
): User {
  const userType = data.userType ?? data.profile?.user_type ?? data.role;
  const portal = resolvePortal(expectedPortal, userType);

  if (
    expectedPortal === "admin" &&
    userType &&
    String(userType).toUpperCase() !== "ADMIN"
  ) {
    throw new Error(
      "Ce compte n'est pas un administrateur. Utilisez le portail correspondant."
    );
  }

  const profile = data.profile;
  const email =
    profile?.email ??
    (data.user as { email?: string } | undefined)?.email ??
    "";

  const name =
    profile?.display_name?.trim() ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
    email;

  return {
    id: profile?.id ?? "unknown",
    name,
    email,
    role: portal,
    scope: SCOPE_BY_PORTAL[portal],
    permissions: defaultPermissions(portal),
  };
}

/** Mappe la réponse Swagger /v1/auth/login vers le modèle back-office. */
export function mapApiLoginToAuthSession(
  data: ApiAuthLoginResponse,
  expectedPortal: PortalRole
): AuthSession {
  return {
    token: extractAccessToken(data),
    refreshToken: extractRefreshToken(data),
    user: buildUserFromApi(data, expectedPortal),
  };
}

/** Mappe GET /v1/auth/me vers le modèle User. */
export function mapApiMeToUser(
  data: ApiAuthMeResponse,
  expectedPortal: PortalRole
): User {
  return buildUserFromApi(data, expectedPortal);
}
