import { apiClient } from "@/core/http/apiClient";
import { LINKS } from "@/core/api/links";
import type { ApiAdminPartnersResponse } from "@/features/network/api/adminPartners.api.types";
import type {
  ApiCatalogBrandModelsResponse,
  ApiCatalogListResponse,
  ApiCatalogVehicleBrand,
  ApiCatalogVehicleCategory,
  ApiCatalogVehicleColor,
  ApiCatalogVehicleModel,
} from "./adminVehicles.api.types";

export interface VehicleCatalogLookups {
  categoryById: Map<string, { code: string; label: string }>;
  categoryByCode: Map<string, { id: string; label: string }>;
  brandById: Map<string, { code: string; label: string }>;
  modelById: Map<string, { label: string; code: string }>;
  colorById: Map<string, { code: string; label: string }>;
  partnerNameById: Map<string, string>;
}

let catalogCache: VehicleCatalogLookups | null = null;

export async function fetchVehicleCategories(): Promise<ApiCatalogVehicleCategory[]> {
  const response = await apiClient.get<ApiCatalogListResponse<ApiCatalogVehicleCategory>>(
    LINKS.v1.catalog.vehicleCategories
  );
  return (response.items ?? []).filter((item) => item.active !== false);
}

export async function fetchVehicleBrands(): Promise<ApiCatalogVehicleBrand[]> {
  const response = await apiClient.get<ApiCatalogListResponse<ApiCatalogVehicleBrand>>(
    `${LINKS.v1.catalog.vehicleBrands}?limit=100`
  );
  return (response.items ?? []).filter((item) => item.active !== false);
}

export async function fetchVehicleBrandModels(
  brandCode: string
): Promise<ApiCatalogVehicleModel[]> {
  if (!brandCode.trim()) return [];
  const response = await apiClient.get<ApiCatalogBrandModelsResponse>(
    `${LINKS.v1.catalog.vehicleBrandModels(brandCode)}?limit=100`
  );
  return (response.items ?? []).filter((item) => item.active !== false);
}

export async function fetchVehicleColors(): Promise<ApiCatalogVehicleColor[]> {
  const response = await apiClient.get<ApiCatalogListResponse<ApiCatalogVehicleColor>>(
    `${LINKS.v1.catalog.vehicleColors}?limit=50`
  );
  return (response.items ?? []).filter((item) => item.active !== false);
}

async function fetchPartnerNameById(): Promise<Map<string, string>> {
  try {
    const response = await apiClient.get<ApiAdminPartnersResponse>(
      `${LINKS.admin.v1.partners}?limit=200`
    );
    return new Map(
      (response.items ?? []).map((item) => [
        String(item.id),
        item.name ?? item.trade_name ?? item.legal_name ?? String(item.id),
      ])
    );
  } catch {
    return new Map();
  }
}

export async function fetchVehicleCatalogLookups(): Promise<VehicleCatalogLookups> {
  if (catalogCache) return catalogCache;

  const [categories, brands, colors, partnerNameById] = await Promise.all([
    fetchVehicleCategories(),
    fetchVehicleBrands(),
    fetchVehicleColors(),
    fetchPartnerNameById(),
  ]);

  const brandModels = await Promise.all(
    brands.slice(0, 30).map((brand) => fetchVehicleBrandModels(brand.code))
  );

  const categoryById = new Map<string, { code: string; label: string }>();
  const categoryByCode = new Map<string, { id: string; label: string }>();
  for (const category of categories) {
    categoryById.set(category.id, { code: category.code, label: category.label });
    categoryByCode.set(category.code, { id: category.id, label: category.label });
  }

  const brandById = new Map<string, { code: string; label: string }>();
  for (const brand of brands) {
    brandById.set(brand.id, { code: brand.code, label: brand.label });
  }

  const modelById = new Map<string, { label: string; code: string }>();
  for (const models of brandModels) {
    for (const model of models) {
      modelById.set(model.id, { label: model.label, code: model.code });
    }
  }

  const colorById = new Map<string, { code: string; label: string }>();
  for (const color of colors) {
    colorById.set(color.id, { code: color.code, label: color.label });
  }

  catalogCache = {
    categoryById,
    categoryByCode,
    brandById,
    modelById,
    colorById,
    partnerNameById,
  };

  return catalogCache;
}

export function clearVehicleCatalogCache(): void {
  catalogCache = null;
}
