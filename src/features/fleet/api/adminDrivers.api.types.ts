import type { ApiV1Pagination } from "@/core/api/v1Pagination";

/** GET /v1/admin/drivers — liste (pas de GET /:id sur l’API actuelle) */

export interface ApiAdminDriverProfile {
  displayName?: string | null;
  phone?: string | null;
  email?: string | null;
}

export interface ApiAdminDriverItem {
  id: string;
  user_id?: string;
  partner_id?: string | null;
  franchise_id?: string | null;
  city_id?: string | null;
  driver_code?: string | null;
  profile?: ApiAdminDriverProfile | null;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  zoneName?: string | null;
  partnerName?: string | null;
  vehicleLabel?: string | null;
  accountStatus?: string | null;
  availability?: string | null;
  onboarding_status?: string;
  availability_status?: string;
  kyc_status?: string;
  approval_status?: string;
  ride_category_code?: string | null;
  wallet_id?: string | null;
  current_vehicle_id?: string | null;
  rating_avg?: number | null;
  rating_count?: number;
  cancellation_rate?: number | null;
  reliability_score?: number | null;
  total_completed_orders?: number;
  accepts_cash?: boolean;
  accepts_wallet?: boolean;
  last_online_at?: string | null;
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export interface ApiAdminDriversResponse {
  status: string;
  generatedAt?: string;
  items?: ApiAdminDriverItem[];
  pagination?: ApiV1Pagination;
}
