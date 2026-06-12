/** Chemins pages admin (liens carte live, alertes, etc.). */

export const adminPaths = {
  trip: (id: string | number) => `/admin/ops/trips/${id}`,
  driver: (id: string | number) => `/admin/fleet/drivers/${id}`,
  client: (id: string | number) => `/admin/fleet/clients/${id}`,
  tripForensic: (id: string | number) => `/admin/ops/trips/${id}/forensic`,
} as const;
