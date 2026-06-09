import { apiClient } from "@/core/http/apiClient";
import { LINKS } from "@/core/api/links";
import { env } from "@/core/config/env";
import { resolveCityIdByLabel } from "@/core/api/catalogLookup.service";
import type {
  ApiFranchiseRegisterPayload,
  ApiFranchiseRegisterResponse,
} from "./franchiseRegister.api.types";
import type {
  FranchiseCreatePayload,
  FranchiseCreateResponse,
} from "./franchises.service";

function isDevApiHost(): boolean {
  return /upjunoo-dev\.tech/i.test(env.apiUrl);
}

export function splitAdminName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { firstName: "Admin", lastName: "Franchise" };
  }
  if (parts.length === 1) {
    return { firstName: "Admin", lastName: parts[0]! };
  }
  return {
    firstName: parts[0]!,
    lastName: parts.slice(1).join(" "),
  };
}

function mapRegisterResponse(
  payload: FranchiseCreatePayload,
  response: ApiFranchiseRegisterResponse
): FranchiseCreateResponse {
  const franchiseId =
    response.franchiseId ??
    response.member?.franchise_id ??
    payload.franchise_id ??
    "";

  return {
    id: franchiseId,
    name: payload.name.trim(),
    city: payload.city.trim(),
    status: payload.status,
    partners_count: 0,
    drivers_count: 0,
    zones_count: 0,
    revenue_month_fcfa: 0,
    contact_email: payload.contact_email.trim(),
    contact_phone: payload.contact_phone.trim(),
    portal_login_email: payload.contact_email.trim(),
  };
}

/** POST /v1/auth/franchise/register — compte portail + membre franchise. */
export async function registerFranchisePortalAccount(
  payload: FranchiseCreatePayload
): Promise<FranchiseCreateResponse> {
  if (!payload.franchise_id?.trim()) {
    throw new Error(
      "Contournement : sélectionnez une franchise seed. La création sans franchiseId est une demande backend (FR-CREATE-01, docs/DEMANDES-2026-06-08.md)."
    );
  }

  const cityId =
    payload.city_id?.trim() || (await resolveCityIdByLabel(payload.city));
  if (!cityId) {
    throw new Error("Sélectionnez une ville du catalogue.");
  }

  const { firstName, lastName } = splitAdminName(payload.name);

  const body: ApiFranchiseRegisterPayload = {
    email: payload.contact_email.trim(),
    password: payload.admin_password,
    phone: payload.contact_phone.trim() || undefined,
    firstName,
    lastName,
    cityId,
    franchiseId: payload.franchise_id.trim(),
    franchiseName: payload.name.trim(),
    ...(isDevApiHost() ? { devBypass: true } : {}),
  };

  const response = await apiClient.post<ApiFranchiseRegisterResponse>(
    LINKS.auth.v1.franchiseRegister,
    body
  );

  if (!response.franchiseId && !response.member?.franchise_id) {
    throw new Error(
      response.error?.message ??
        "Inscription portail franchise sans identifiant franchise en réponse."
    );
  }

  return mapRegisterResponse(payload, response);
}
