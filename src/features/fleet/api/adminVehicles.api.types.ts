import type { ApiV1Pagination } from "@/core/api/v1Pagination";

export interface ApiV1VehicleItem {
  id: string;
  partner_id?: string | null;
  driver_id?: string | null;
  brand_id?: string | null;
  model_id?: string | null;
  color_id?: string | null;
  category_id?: string | null;
  plate_number?: string | null;
  vin?: string | null;
  manufacture_year?: number | null;
  seats_count?: number | null;
  max_weight_kg?: number | null;
  status?: string | null;
  approved_at?: string | null;
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export interface ApiAdminVehiclesListResponse {
  status?: string;
  items?: ApiV1VehicleItem[];
  pagination?: ApiV1Pagination;
}

export interface ApiV1VehicleCreateBody {
  partnerId: string;
  categoryCode: string;
  brandCode: string;
  modelCode: string;
  colorCode: string;
  manufactureYear: number;
  plateNumber?: string;
  seatsCount?: number;
}

export interface ApiV1VehicleCreateResponse {
  status?: string;
  vehicle?: ApiV1VehicleItem;
}

export interface ApiCatalogVehicleCategory {
  id: string;
  code: string;
  label: string;
  active?: boolean;
}

export interface ApiCatalogVehicleBrand {
  id: string;
  code: string;
  label: string;
  active?: boolean;
}

export interface ApiCatalogVehicleModel {
  id: string;
  code: string;
  label: string;
  brand_id?: string;
  year_from?: number | null;
  year_to?: number | null;
  active?: boolean;
}

export interface ApiCatalogVehicleColor {
  id: string;
  code: string;
  label: string;
  hex?: string;
  active?: boolean;
}

export interface ApiCatalogListResponse<T> {
  status?: string;
  items?: T[];
}

export interface ApiCatalogBrandModelsResponse {
  status?: string;
  brand?: ApiCatalogVehicleBrand;
  items?: ApiCatalogVehicleModel[];
}
