import dispatchConsoleSeed from "../data/dispatch-console.json";
import {
  buildLocalAbidjanLiveMap,
  getLiveMapCatalogDrivers,
} from "./liveMapBuilder";
import {
  filterTripsByScope,
  getFranchiseTripsFilterOptions,
  getTripsScopeFilterOptions,
} from "./tripsScope";
import type {
  DispatchConsoleData,
  DispatchDriverCandidate,
  DispatchQueueItem,
  Trip,
  TripsScopeFilterOptions,
} from "@/shared/types";

const DRIVER_PARTNER = Object.fromEntries(
  getLiveMapCatalogDrivers().map((d) => [d.id, d.partner_id])
);

export interface DispatchConsoleBuildOptions {
  trips: Trip[];
  franchiseId?: number | null;
  partnerId?: number | null;
  includeFilterOptions?: boolean;
  /** Options partenaires du territoire (portail franchise) */
  franchiseScope?: boolean;
}

function buildDispatchQueue(
  trips: Trip[],
  franchiseId: number | null,
  partnerId: number | null
): DispatchQueueItem[] {
  const pending = filterTripsByScope(
    trips.filter((t) => ["matching", "requested"].includes(t.status)),
    franchiseId,
    partnerId
  );

  const queue: DispatchQueueItem[] = [];
  for (const item of dispatchConsoleSeed.queue) {
    const trip = pending.find((t) => t.id === item.trip.id);
    if (!trip) continue;
    let candidates = item.candidates;
    if (partnerId != null) {
      candidates = candidates.filter((c) => DRIVER_PARTNER[c.id] === partnerId);
    } else if (franchiseId != null) {
      const ids = new Set(
        getLiveMapCatalogDrivers()
          .filter((d) => d.franchise_id === franchiseId)
          .map((d) => d.id)
      );
      candidates = candidates.filter((c) => ids.has(c.id));
    }
    queue.push({
      ...item,
      trip,
      candidates: candidates as DispatchDriverCandidate[],
    });
  }
  return queue;
}

export function buildDispatchConsole(
  options: DispatchConsoleBuildOptions
): DispatchConsoleData & { filter_options?: TripsScopeFilterOptions } {
  const franchiseId = options.franchiseId ?? null;
  const partnerId = options.partnerId ?? null;
  const queue = buildDispatchQueue(options.trips, franchiseId, partnerId);
  const localMap = buildLocalAbidjanLiveMap();
  let online = localMap.drivers.filter((d) => d.availability === "online");
  if (partnerId != null) {
    online = online.filter((d) => d.partner_id === partnerId);
  } else if (franchiseId != null) {
    online = online.filter((d) => d.franchise_id === franchiseId);
  }

  return {
    stats: {
      queue_size: queue.length,
      online_nearby: online.length,
      avg_wait_min: dispatchConsoleSeed.stats.avg_wait_min,
    },
    queue,
    map: dispatchConsoleSeed.map,
    filter_options: options.includeFilterOptions
      ? options.franchiseScope
        ? getFranchiseTripsFilterOptions()
        : getTripsScopeFilterOptions()
      : undefined,
    active_filter: {
      franchise_id: franchiseId,
      partner_id: partnerId,
    },
  };
}
