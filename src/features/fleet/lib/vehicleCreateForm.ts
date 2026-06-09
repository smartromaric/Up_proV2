import type { CreateDriverPayload } from "@/features/partner/api/drivers.service";
import type { VehiclePieceFile } from "@/features/partner/components/VehicleCreatePiecesSection";

export function isDriverComplete(driver: CreateDriverPayload | null): boolean {
  if (!driver) return false;
  return (
    driver.first_name.trim().length > 0 &&
    driver.last_name.trim().length > 0 &&
    driver.phone.trim().length > 0 &&
    driver.zone.trim().length > 0
  );
}

export function vehicleCreateSubmitLabel(
  pieces: VehiclePieceFile[],
  hasDriver = true
): string {
  const parts: string[] = ["Créer le véhicule"];
  if (hasDriver) parts.push("chauffeur");
  if (pieces.length > 0) parts.push("pièces");
  return parts.join(" + ");
}
