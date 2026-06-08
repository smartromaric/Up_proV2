/** GET /v1/partners/{id}/drivers */

export interface ApiV1PartnerDriverItem {
  id: string;
  user_id?: string | null;
  partner_id?: string | null;
  franchise_id?: string | null;
  driver_code?: string | null;
  onboarding_status?: string | null;
  availability_status?: string | null;
  kyc_status?: string | null;
  approval_status?: string | null;
  ride_category_code?: string | null;
  rating_avg?: number | null;
  rating_count?: number | null;
  total_completed_orders?: number | null;
  metadata?: {
    zoneLabel?: string;
    [key: string]: unknown;
  } | null;
  profile?: {
    displayName?: string | null;
    first_name?: string | null;
    last_name?: string | null;
  } | null;
}

export interface ApiV1PartnerDriversResponse {
  status?: string;
  items?: ApiV1PartnerDriverItem[];
  pagination?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}
