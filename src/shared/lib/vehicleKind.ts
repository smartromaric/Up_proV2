import type { Vehicle, VehicleCategory } from "@/shared/types";

export type VehicleKind = "motorcycle" | "car" | "van";
export type VehicleServiceKind = "taxi" | "delivery" | "other";

const MOTO_PATTERN = /\b(moto|motorcycle|2w|two[- ]?wheel|scooter|bike)\b/i;

export function inferVehicleKind(
  vehicle: Pick<Vehicle, "category" | "category_code" | "category_label" | "model" | "brand">
): VehicleKind {
  const haystack = [
    vehicle.category_code,
    vehicle.category_label,
    vehicle.model,
    vehicle.brand,
    vehicle.category,
  ]
    .filter(Boolean)
    .join(" ");

  if (MOTO_PATTERN.test(haystack)) return "motorcycle";
  if (vehicle.category === "van") return "van";
  return "car";
}

export function inferVehicleService(
  category: VehicleCategory
): VehicleServiceKind {
  if (category === "delivery") return "delivery";
  if (category === "taxi" || category === "premium") return "taxi";
  return "other";
}

export const VEHICLE_KIND_LABELS: Record<VehicleKind, string> = {
  motorcycle: "Moto",
  car: "Voiture",
  van: "Utilitaire",
};

export const VEHICLE_SERVICE_LABELS: Record<VehicleServiceKind, string> = {
  taxi: "Taxi",
  delivery: "Livraison",
  other: "Autre",
};
