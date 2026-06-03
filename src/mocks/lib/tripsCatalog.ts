import tripsList from "../data/trips-list.json";
import type { Trip, TripStatus } from "@/shared/types";
import type { ListQuery } from "./listQuery";
import { matchesSearch } from "./listQuery";

const SERVICES: Trip["service"][] = ["taxi", "delivery", "rental", "freight"];
const STATUSES: TripStatus[] = [
  "requested",
  "matching",
  "assigned",
  "arrived",
  "in_progress",
  "completed",
  "cancelled",
];
const ROUTES = [
  { from: "Cocody, Angré", to: "Plateau, SCIAM" },
  { from: "Yopougon, Gesco", to: "Marcory, Zone 4" },
  { from: "Treichville, Port", to: "Adjamé, Gare" },
  { from: "Plateau, Hôtel Ivoire", to: "Cocody, Riviera" },
];

function buildCatalog(): Trip[] {
  const seed = tripsList.data as Trip[];
  const rows: Trip[] = [...seed];
  for (let i = 0; i < 95; i++) {
    const template = seed[i % seed.length];
    const route = ROUTES[i % ROUTES.length];
    rows.push({
      ...template,
      id: String(100 + i),
      ref: `TR-${88400 + i}`,
      service: SERVICES[i % SERVICES.length],
      status: STATUSES[i % STATUSES.length],
      from_label: route.from,
      to_label: route.to,
      client_name: `Client ${i + 1}`,
      driver_name: i % 4 === 0 ? undefined : template.driver_name,
      amount_fcfa: 2500 + (i % 20) * 500,
      created_at: new Date(Date.now() - i * 3600000).toISOString(),
    });
  }
  return rows;
}

export const TRIPS_CATALOG = buildCatalog();

export function filterTrips(rows: Trip[], query: ListQuery): Trip[] {
  let list = rows.filter((t) =>
    matchesSearch(
      query.search,
      t.ref,
      t.client_name,
      t.driver_name,
      t.from_label,
      t.to_label
    )
  );
  if (query.status) {
    list = list.filter((t) => t.status === query.status);
  }
  if (query.service) {
    list = list.filter((t) => t.service === query.service);
  }
  return list;
}
