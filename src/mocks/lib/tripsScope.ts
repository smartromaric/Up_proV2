import franchisesList from "../data/franchises-list.json";
import partnersList from "../data/partners-list.json";
import type { LiveMapData, Trip } from "@/shared/types";

const FRANCHISES = franchisesList.data as {
  id: number;
  name: string;
  city: string;
}[];

const PARTNERS = partnersList.data as {
  id: number;
  name: string;
  franchise_id: number;
  franchise_name: string;
  city: string;
}[];

const DRIVER_PARTNER: Record<string, number> = {
  "Kouassi Jean": 12,
  "Traoré Aminata": 12,
  "Bamba Serge": 15,
};

export function getTripsScopeFilterOptions(): NonNullable<LiveMapData["filter_options"]> {
  return {
    franchises: FRANCHISES.map((f) => ({
      id: f.id,
      name: f.name,
      city: f.city,
    })),
    partners: PARTNERS.map((p) => ({
      id: p.id,
      name: p.name,
      franchise_id: p.franchise_id,
      franchise_name: p.franchise_name,
      city: p.city,
    })),
  };
}

export function enrichTripWithScope(trip: Trip, index: number): Trip {
  const partnerFromDriver =
    trip.driver_name != null ? DRIVER_PARTNER[trip.driver_name] : undefined;
  const partner =
    PARTNERS.find((p) => p.id === partnerFromDriver) ??
    PARTNERS[index % PARTNERS.length];
  return {
    ...trip,
    franchise_id: partner.franchise_id,
    franchise_name: partner.franchise_name,
    partner_id: partner.id,
    partner_name: partner.name,
  };
}

export function filterTripsByScope(
  rows: Trip[],
  franchiseId: number | null,
  partnerId: number | null
): Trip[] {
  let list = rows;
  if (partnerId != null) {
    list = list.filter((t) => t.partner_id === partnerId);
  } else if (franchiseId != null) {
    list = list.filter((t) => t.franchise_id === franchiseId);
  }
  return list;
}
