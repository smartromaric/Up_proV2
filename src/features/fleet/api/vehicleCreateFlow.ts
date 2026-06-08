import { apiClient } from "@/core/http/apiClient";
import { LINKS } from "@/core/api/links";
import type { CreateDriverPayload } from "@/features/partner/api/drivers.service";
import type { VehiclePieceFile } from "@/features/partner/components/VehicleCreatePiecesSection";
import type { DriverDocumentFile } from "@/shared/types/driverDocuments";
import type { VehicleDetail } from "@/shared/types";
import type { CreateDriverV1Context } from "./partnerDrivers.v1.service";
import type { VehicleDocumentType } from "@/shared/types/vehicleDocuments";

export interface VehicleCreateFlowOptions {
  pieces?: VehiclePieceFile[];
  driver?: CreateDriverPayload | null;
  driverDocuments?: DriverDocumentFile[];
  partnerId?: string;
  rideCategoryCode?: string;
}

type CreatedDriver = {
  id: string | number;
  first_name: string;
  last_name: string;
};

export async function applyVehicleCreateFlow(
  vehicle: VehicleDetail,
  options: VehicleCreateFlowOptions,
  handlers: {
    legacyDocumentsPath?: (vehicleId: string | number) => string;
    createDriverWithDocuments?: (
      driver: CreateDriverPayload,
      documents: DriverDocumentFile[],
      context: CreateDriverV1Context
    ) => Promise<CreatedDriver>;
    assignDriver?: (
      vehicleId: string | number,
      driver: CreatedDriver
    ) => Promise<VehicleDetail>;
  }
): Promise<VehicleDetail> {
  const { pieces = [], driver, driverDocuments = [] } = options;
  let current = vehicle;

  for (const piece of pieces) {
    try {
      if (handlers.legacyDocumentsPath) {
        current = await apiClient.post<VehicleDetail>(
          handlers.legacyDocumentsPath(current.id),
          { type: piece.type as VehicleDocumentType, filename: piece.file.name }
        );
      }
    } catch {
      // Upload pièce indisponible (API v1)
    }
  }

  if (driver && handlers.createDriverWithDocuments && handlers.assignDriver) {
    const driverContext: CreateDriverV1Context = {
      partnerId: options.partnerId,
      rideCategoryCode: options.rideCategoryCode,
    };
    const createdDriver = await handlers.createDriverWithDocuments(
      driver,
      driverDocuments,
      driverContext
    );
    current = await handlers.assignDriver(current.id, createdDriver);
    return {
      ...current,
      driver_name: `${createdDriver.first_name} ${createdDriver.last_name}`.trim(),
    };
  }

  return current;
}

export function legacyPartnerDocumentsPath(vehicleId: string | number): string {
  return `/partner/vehicles/${vehicleId}/documents`;
}

export function legacyAdminDocumentsPath(vehicleId: string | number): string {
  return `/admin/fleet/vehicles/${vehicleId}/documents`;
}

export async function assignDriverV1(
  vehicleId: string | number,
  driver: CreatedDriver,
  baseVehicle?: VehicleDetail
): Promise<VehicleDetail> {
  const response = await apiClient.post<{
    vehicle?: VehicleDetail;
    assignment?: { vehicle?: VehicleDetail };
  }>(LINKS.v1.vehicles.assignDriver(String(vehicleId)), {
    driverId: String(driver.id),
  });

  const assigned =
    response.vehicle ?? response.assignment?.vehicle ?? baseVehicle ?? ({} as VehicleDetail);

  return {
    ...assigned,
    id: assigned.id ?? vehicleId,
    driver_name: `${driver.first_name} ${driver.last_name}`.trim(),
  };
}
