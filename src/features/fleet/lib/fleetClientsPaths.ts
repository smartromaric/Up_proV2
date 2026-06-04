export type FleetClientsPortal = "admin" | "franchise";

export function getFleetClientsPaths(portal: FleetClientsPortal) {
  const list =
    portal === "admin" ? "/admin/fleet/clients" : "/franchise/clients";
  return {
    list,
    detail: (id: string | number) => `${list}/${id}`,
    tripDetail: (tripId: string) =>
      portal === "admin"
        ? `/admin/ops/trips/${tripId}`
        : `/franchise/trips/${tripId}`,
    breadcrumbList:
      portal === "admin" ? (["Admin", "Flotte"] as const) : (["Franchise", "Flotte"] as const),
    breadcrumbDetail: (name: string) =>
      portal === "admin"
        ? (["Admin", "Flotte", "Clients", name] as const)
        : (["Franchise", "Flotte", "Clients", name] as const),
  };
}
