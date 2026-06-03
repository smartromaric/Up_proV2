import type { TripMatchingDriver } from "@/shared/types";

/** Offres de course TR-88419 (admin trip id « 2 ») — recherche chauffeur */
export const TRIP_MATCHING_TR_88419: TripMatchingDriver[] = [
  {
    driver_id: 101,
    driver_name: "Kouassi Jean",
    outcome: "declined",
    reason: "Déjà en course à proximité",
  },
  {
    driver_id: 104,
    driver_name: "Bamba Serge",
    outcome: "declined",
    reason: "Hors zone habituelle",
  },
  {
    driver_id: 106,
    driver_name: "Ouattara Issa",
    outcome: "no_response",
    reason: "Pas de réponse sous 45 s",
  },
  {
    driver_id: 102,
    driver_name: "Traoré Aminata",
    outcome: "accepted",
  },
];

const BY_TRIP_REF: Record<string, TripMatchingDriver[]> = {
  "TR-88419": TRIP_MATCHING_TR_88419,
};

const BY_TRIP_ID: Record<string, TripMatchingDriver[]> = {
  "2": TRIP_MATCHING_TR_88419,
};

export function matchingDriversForTrip(
  tripId: string,
  tripRef?: string
): TripMatchingDriver[] | undefined {
  if (BY_TRIP_ID[tripId]) return BY_TRIP_ID[tripId];
  if (tripRef && BY_TRIP_REF[tripRef]) return BY_TRIP_REF[tripRef];
  return undefined;
}
