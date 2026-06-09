"use client";

import { useQuery } from "@tanstack/react-query";
import { adminVehiclesService } from "./adminVehicles.service";
import { adminVehiclesKeys } from "./vehicles.keys";

export function useAdminVehicleDetail(
  vehicleId: string,
  partnerId?: string
) {
  return useQuery({
    queryKey: adminVehiclesKeys.detail(vehicleId, partnerId),
    queryFn: () => adminVehiclesService.getById(vehicleId, partnerId),
    enabled: Boolean(vehicleId),
  });
}
