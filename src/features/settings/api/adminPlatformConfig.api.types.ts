import type { ApiV1FranchiseItem } from "@/features/network/api/adminFranchises.api.types";

export interface PaydunyaConfigDocument {
  schemaVersion: number;
  enabled: boolean;
  mode: "test" | "live" | string;
  callbackUrl?: string | null;
  store?: {
    name?: string;
    tagline?: string;
    phone?: string | null;
    logoUrl?: string | null;
    websiteUrl?: string | null;
  };
  enabledChannels?: Record<string, string[]>;
  feesPayer?: string;
}

export interface ApiPaydunyaConfigResponse {
  status?: string;
  generatedAt?: string;
  settingKey?: string;
  schemaVersion?: number;
  document?: PaydunyaConfigDocument;
  fromDatabase?: boolean;
}

export interface WeatherRefreshConfig {
  enabled?: boolean;
  intervalMinutes?: number;
  gridStepKm?: number;
  cityRadiusKmDefault?: number;
  cityRadiusKmMetro?: number;
  metroMinZones?: number;
  batchConcurrency?: number;
  maxCellsPerCity?: number;
  cityOverrides?: Record<string, { radiusKm?: number; gridStepKm?: number }>;
}

export interface WeatherConfigDocument {
  schemaVersion: number;
  enabled: boolean;
  cacheEnabled?: boolean;
  cacheTtlSeconds?: number;
  geohashPrecision?: number;
  heatThresholdCelsius?: number;
  fetchTimeoutMs?: number;
  apiBaseUrl?: string | null;
  fallbackCondition?: string;
  activeServiceTypes?: string[];
  refresh?: WeatherRefreshConfig;
}

export interface ApiWeatherConfigResponse {
  status?: string;
  generatedAt?: string;
  settingKey?: string;
  schemaVersion?: number;
  document?: WeatherConfigDocument;
  fromDatabase?: boolean;
  scheduler?: {
    enabled?: boolean;
    nextRunAt?: string | null;
  };
}

export interface ApiWeatherRefreshResponse {
  status?: string;
  queued?: boolean;
  jobId?: string;
}

export interface ApiPaymentsReconcileBatchResponse {
  status?: string;
  scanned?: number;
  updated?: number;
  fulfilled?: number;
  errors?: unknown[];
}

export interface ApiAdminFranchiseDetailResponse {
  status?: string;
  generatedAt?: string;
  franchise?: ApiV1FranchiseItem;
  summary?: {
    partnersCount?: number;
    driversCount?: number;
    zonesCount?: number;
    revenueMonthXof?: number;
  };
}
