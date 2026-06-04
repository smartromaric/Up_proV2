import type { LiveMapData } from "@/shared/types";
import type { AdminLiveMapLocationDelta } from "./liveMap.realtime.types";

/** Fusionne les deltas GPS socket sur le snapshot HTTP. */
export function mergeLiveMapPositionDeltas(
  data: LiveMapData,
  deltas: Map<string, AdminLiveMapLocationDelta>
): LiveMapData {
  if (deltas.size === 0) return data;

  return {
    ...data,
    drivers: data.drivers.map((driver) => {
      const delta = deltas.get(String(driver.id));
      if (!delta) return driver;
      const { latitude, longitude } = delta;
      if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
      ) {
        return driver;
      }
      return {
        ...driver,
        lat: latitude,
        lng: longitude,
        heading: delta.heading ?? undefined,
        speed_kmh: delta.speedKmh ?? undefined,
      };
    }),
  };
}

/** Socket.IO attend une URL HTTP(S) ; l’API peut renvoyer wss://. */
export function normalizeSocketIoUrl(url: string): string {
  return url.replace(/^wss:/i, "https:").replace(/^ws:/i, "http:");
}
