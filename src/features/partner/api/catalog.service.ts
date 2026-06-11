import { apiClient } from "@/core/http/apiClient";
import { LINKS } from "@/core/api/links";

export interface VehicleCategory {
  code: string;
  label: string;
  description?: string;
}

export interface VehicleColor {
  code: string;
  label: string;
  hex?: string;
}

export interface VehicleBrand {
  code: string;
  label: string;
}

export interface VehicleModel {
  ref: string;
  label: string;
  brand_code: string;
}

interface CatalogListResponse<T> {
  items?: T[];
  data?: T[];
  status?: string;
}

function extractItems<T>(res: CatalogListResponse<T>): T[] {
  return res.items ?? res.data ?? [];
}

export const partnerCatalogService = {
  getCategories: async (): Promise<VehicleCategory[]> => {
    const res = await apiClient.get<CatalogListResponse<VehicleCategory>>(
      LINKS.partner.catalog.vehicleCategories
    );
    return extractItems(res);
  },

  getColors: async (): Promise<VehicleColor[]> => {
    const res = await apiClient.get<CatalogListResponse<VehicleColor>>(
      LINKS.partner.catalog.vehicleColors
    );
    return extractItems(res);
  },

  getBrands: async (): Promise<VehicleBrand[]> => {
    const res = await apiClient.get<CatalogListResponse<VehicleBrand>>(
      LINKS.partner.catalog.vehicleBrands
    );
    return extractItems(res);
  },

  getModelsByBrand: async (brandCode: string): Promise<VehicleModel[]> => {
    if (!brandCode) return [];
    const res = await apiClient.get<CatalogListResponse<VehicleModel>>(
      LINKS.partner.catalog.vehicleBrandModels(brandCode)
    );
    return extractItems(res);
  },
};
