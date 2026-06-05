import type { ApiV1Pagination } from "@/core/api/v1Pagination";

/** GET /v1/admin/partners */

export interface ApiAdminPartnerItem {
  id: string;
  franchise_id?: string | null;
  legal_name?: string | null;
  trade_name?: string | null;
  name?: string | null;
  franchiseName?: string | null;
  cityLabel?: string | null;
  driversCount?: number | null;
  partner_type?: string | null;
  city_id?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  commission_rate?: number | null;
  status?: string | null;
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export interface ApiAdminPartnersResponse {
  status: string;
  generatedAt?: string;
  items?: ApiAdminPartnerItem[];
  pagination?: ApiV1Pagination;
}
