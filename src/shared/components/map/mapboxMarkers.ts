import type { LiveMapData, LiveMapDriver, LiveMapOrderMarker } from "@/shared/types";
import {
  buildDriverPopupHtml,
  buildOrderMarkerPopupHtml,
} from "./liveMapPopup";

export interface MapboxPointFeature {
  id: string;
  lng: number;
  lat: number;
  kind: "driver" | "pickup" | "dropoff";
  color: string;
  label: string;
  sublabel?: string;
  pulse?: boolean;
  heading?: number;
  speedKmh?: number;
  popupHtml: string;
}

const DRIVER_COLORS: Record<LiveMapDriver["availability"], string> = {
  online: "#0ab39c",
  on_trip: "#405189",
  paused: "#f59e0b",
  offline: "#878a99",
};

export function liveMapDataToMapFeatures(data: LiveMapData): MapboxPointFeature[] {
  const driverFeatures: MapboxPointFeature[] = data.drivers.map((d) => {
    const tripLine = d.active_trip
      ? `${d.active_trip.ref} · ${d.active_trip.from_label} → ${d.active_trip.to_label}`
      : undefined;
    return {
      id: `driver-${d.id}`,
      lng: d.lng,
      lat: d.lat,
      kind: "driver",
      color: DRIVER_COLORS[d.availability],
      label: d.name,
      sublabel: tripLine ?? [d.partner_name, d.vehicle].filter(Boolean).join(" · "),
      pulse: d.availability === "online" || d.availability === "on_trip",
      heading: d.heading,
      speedKmh: d.speed_kmh,
      popupHtml: buildDriverPopupHtml(d),
    };
  });

  const orderFeatures: MapboxPointFeature[] = (data.order_markers ?? []).map(
    (m: LiveMapOrderMarker) => ({
      id: m.id,
      lng: m.lng,
      lat: m.lat,
      kind: m.kind,
      color: m.kind === "pickup" ? "#f59e0b" : "#6366f1",
      label: m.ref,
      sublabel: `${m.status_label} · ${m.label}`,
      pulse: m.kind === "pickup" && !m.driver_id,
      popupHtml: buildOrderMarkerPopupHtml(m),
    })
  );

  return [...driverFeatures, ...orderFeatures];
}

export function boundsToMapboxLngLatBounds(
  bounds: LiveMapData["bounds"]
): [[number, number], [number, number]] {
  return [
    [bounds.lng_min, bounds.lat_min],
    [bounds.lng_max, bounds.lat_max],
  ];
}
