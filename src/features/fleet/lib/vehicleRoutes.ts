export function buildAdminVehicleDetailPath(
  vehicleId: string | number,
  partnerId?: string | number | null
): string {
  const base = `/admin/fleet/vehicles/${vehicleId}`;
  if (partnerId == null || partnerId === "") return base;
  return `${base}?partner_id=${encodeURIComponent(String(partnerId))}`;
}
