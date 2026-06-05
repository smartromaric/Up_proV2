import { apiClient } from "@/core/http/apiClient";
import { LINKS } from "@/core/api/links";
import type { ApiAdminDashboardResponse } from "@/features/ops/api/dashboard.api.types";

interface BootstrapCity {
  id: string;
  label?: string | null;
  slug?: string | null;
}

interface CatalogBootstrapResponse {
  catalogs?: {
    foundation?: {
      cities?: BootstrapCity[];
    };
  };
}

let cityByIdCache: Map<string, string> | null = null;
let franchiseNameByIdCache: Map<string, string> | null = null;

export async function fetchCityLabelById(): Promise<Map<string, string>> {
  if (cityByIdCache) return cityByIdCache;

  try {
    const boot = await apiClient.get<CatalogBootstrapResponse>(
      "/v1/catalog/bootstrap"
    );
    const cities = boot.catalogs?.foundation?.cities ?? [];
    cityByIdCache = new Map(
      cities
        .filter((c) => c.id && c.label)
        .map((c) => [c.id, c.label!.trim()])
    );
  } catch {
    cityByIdCache = new Map();
  }

  return cityByIdCache;
}

export async function fetchFranchiseNameById(): Promise<Map<string, string>> {
  if (franchiseNameByIdCache) return franchiseNameByIdCache;

  try {
    const dash = await apiClient.get<ApiAdminDashboardResponse>(
      LINKS.admin.v1.dashboard
    );
    const franchises = dash.dashboard?.filters?.options?.franchises ?? [];
    franchiseNameByIdCache = new Map(
      franchises
        .filter((f) => f.id && f.name)
        .map((f) => [String(f.id), f.name!.trim()])
    );
  } catch {
    franchiseNameByIdCache = new Map();
  }

  return franchiseNameByIdCache;
}

export async function fetchNetworkLookups(): Promise<{
  cityById: Map<string, string>;
  franchiseNameById: Map<string, string>;
}> {
  const [cityById, franchiseNameById] = await Promise.all([
    fetchCityLabelById(),
    fetchFranchiseNameById(),
  ]);
  return { cityById, franchiseNameById };
}
