import type { ListParams } from "@/shared/types/listParams";

export const adminVehiclesKeys = {
  all: ["admin", "fleet", "vehicles"] as const,
  detail: (vehicleId: string, partnerId?: string) =>
    [...adminVehiclesKeys.all, "detail", vehicleId, partnerId ?? ""] as const,
  list: (filters?: ListParams) =>
    [...adminVehiclesKeys.all, "list", filters] as const,
  catalog: {
    categories: ["admin", "fleet", "vehicles", "catalog", "categories"] as const,
    brands: ["admin", "fleet", "vehicles", "catalog", "brands"] as const,
    colors: ["admin", "fleet", "vehicles", "catalog", "colors"] as const,
    models: (brandCode: string) =>
      ["admin", "fleet", "vehicles", "catalog", "models", brandCode] as const,
  },
};
