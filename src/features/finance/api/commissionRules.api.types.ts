export interface ApiCommissionRule {
  id: string;
  franchise_id?: string | null;
  partner_id?: string | null;
  city_id?: string | null;
  service_type?: string;
  category_code?: string | null;
  rule_name?: string;
  platform_rate?: number;
  franchise_rate?: number;
  partner_rate?: number;
  driver_rate?: number;
  fiscality_rate?: number;
  platform_fixed_xof?: number;
  franchise_fixed_xof?: number;
  partner_fixed_xof?: number;
  driver_fixed_xof?: number;
  fiscality_fixed_xof?: number;
  basis?: string;
  active?: boolean;
  priority?: number;
  effective_from?: string;
  effective_to?: string | null;
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export interface ApiCommissionRulesListResponse {
  status?: string;
  generatedAt?: string;
  items?: ApiCommissionRule[];
}

export interface ApiCommissionRuleMutationResponse {
  status?: string;
  rule?: ApiCommissionRule;
  item?: ApiCommissionRule;
}

export interface ApiCommissionRuleUpsertBody {
  franchise_id?: string | null;
  partner_id?: string | null;
  city_id?: string | null;
  service_type?: string;
  category_code?: string | null;
  rule_name?: string;
  platform_rate?: number;
  franchise_rate?: number;
  partner_rate?: number;
  driver_rate?: number;
  fiscality_rate?: number;
  platform_fixed_xof?: number;
  franchise_fixed_xof?: number;
  partner_fixed_xof?: number;
  driver_fixed_xof?: number;
  fiscality_fixed_xof?: number;
  basis?: string;
  active?: boolean;
  priority?: number;
  effective_from?: string;
  effective_to?: string | null;
  metadata?: Record<string, unknown>;
}
