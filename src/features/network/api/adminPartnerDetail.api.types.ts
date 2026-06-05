export interface ApiV1PartnerItem {
  id: string;
  franchise_id?: string | null;
  legal_name?: string | null;
  trade_name?: string | null;
  name?: string | null;
  partner_type?: string | null;
  city_id?: string | null;
  address?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  commission_rate?: number | null;
  status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface ApiV1PartnerDetailResponse {
  status: string;
  generatedAt?: string;
  partner: ApiV1PartnerItem;
}
