"use client";

import { useQuery } from "@tanstack/react-query";
import { partnerCatalogService } from "./catalog.service";

export const catalogKeys = {
  all: ["catalog"] as const,
  categories: () => [...catalogKeys.all, "vehicle-categories"] as const,
  colors: () => [...catalogKeys.all, "vehicle-colors"] as const,
  brands: () => [...catalogKeys.all, "vehicle-brands"] as const,
  models: (brandCode: string) =>
    [...catalogKeys.all, "vehicle-models", brandCode] as const,
};

export function useVehicleCategories() {
  return useQuery({
    queryKey: catalogKeys.categories(),
    queryFn: partnerCatalogService.getCategories,
    staleTime: 1000 * 60 * 60,
  });
}

export function useVehicleColors() {
  return useQuery({
    queryKey: catalogKeys.colors(),
    queryFn: partnerCatalogService.getColors,
    staleTime: 1000 * 60 * 60,
  });
}

export function useVehicleBrands() {
  return useQuery({
    queryKey: catalogKeys.brands(),
    queryFn: partnerCatalogService.getBrands,
    staleTime: 1000 * 60 * 60,
  });
}

export function useVehicleModelsByBrand(brandCode: string) {
  return useQuery({
    queryKey: catalogKeys.models(brandCode),
    queryFn: () => partnerCatalogService.getModelsByBrand(brandCode),
    enabled: Boolean(brandCode),
    staleTime: 1000 * 60 * 60,
  });
}
