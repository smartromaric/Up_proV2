import type { LiveMapRealtimeConfig } from "@/shared/types";

/** Alias API — meta.realtime */
export type AdminLiveMapRealtimeConfig = LiveMapRealtimeConfig & {
  auth?: { token?: string };
  persistent?: boolean;
};

export interface AdminLiveMapLocationsPayload {
  at: string;
  count: number;
  drivers: AdminLiveMapLocationDelta[];
}

export interface AdminLiveMapLocationDelta {
  id: string;
  latitude: number;
  longitude: number;
  heading: number | null;
  speedKmh: number | null;
  recordedAt: string;
  ageSeconds: number;
}

export type LiveMapSocketStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";
