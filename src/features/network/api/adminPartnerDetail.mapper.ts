import type { PartnerDetail } from "@/shared/types";
import type { ApiV1PartnerDetailResponse } from "./adminPartnerDetail.api.types";
import type { PartnerLookupMaps } from "./adminPartners.mapper";
import { mapAdminPartnerItemToPartner } from "./adminPartners.mapper";
import type { ApiAdminPartnerItem } from "./adminPartners.api.types";

function mapPartnerStatus(status?: string | null): PartnerDetail["status"] {
  const key = String(status ?? "pending").toLowerCase();
  if (key === "active") return "active";
  if (key === "suspended") return "suspended";
  return "pending";
}

export function mapV1PartnerDetailToPartnerDetail(
  response: ApiV1PartnerDetailResponse,
  lookups?: PartnerLookupMaps
): PartnerDetail {
  const p = response.partner;
  const listShape: ApiAdminPartnerItem = {
    id: p.id,
    franchise_id: p.franchise_id,
    legal_name: p.legal_name,
    trade_name: p.trade_name,
    name: p.name ?? p.trade_name ?? p.legal_name,
    city_id: p.city_id,
    contact_phone: p.contact_phone,
    contact_email: p.contact_email,
    status: p.status,
    driversCount: 0,
  };
  const base = mapAdminPartnerItemToPartner(listShape, lookups);

  return {
    ...base,
    address: p.address?.trim() || "—",
    created_at: p.created_at ?? new Date().toISOString(),
    stats: {
      drivers_count: 0,
      drivers_online: 0,
      trips_month: 0,
      revenue_month_fcfa: 0,
      wallet_balance_fcfa: 0,
      pending_withdrawal_fcfa: 0,
    },
    drivers: [],
    recent_trips: [],
    status: mapPartnerStatus(p.status),
  };
}
