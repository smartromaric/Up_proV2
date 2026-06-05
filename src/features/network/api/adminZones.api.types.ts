export interface ApiGeoPoint {
  type?: string;
  coordinates?: [number, number];
}

export interface ApiV1ZoneItem {
  id: string;
  city_id?: string | null;
  franchise_id?: string | null;
  code?: string | null;
  label?: string | null;
  zone_type?: string | null;
  geometry?: {
    type?: string;
    coordinates?: number[][][] | number[][];
  } | null;
  center_point?: ApiGeoPoint | null;
  active?: boolean;
  priority?: number;
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
  /** Présent sur GET /v1/zones/hot */
  demand?: {
    zoneId?: string;
    rides?: number;
    deliveries?: number;
    total?: number;
  };
  /** Présent sur GET /v1/geo/hot-zones */
  heatLevel?: number;
  surge?: number;
}

export interface ApiV1ZonesListResponse {
  status?: string;
  zones?: ApiV1ZoneItem[];
  pagination?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface ApiV1ZoneDetailResponse {
  status?: string;
  zone?: ApiV1ZoneItem;
}

export interface ApiV1ZoneDemandResponse {
  status?: string;
  demand?: {
    zoneId?: string;
    rides?: number;
    deliveries?: number;
    total?: number;
  };
}

export interface ApiGeoHotZonesResponse {
  status?: string;
  generatedAt?: string;
  items?: ApiV1ZoneItem[];
  meta?: {
    count?: number;
    countryCode?: string | null;
    citySlug?: string | null;
  };
}
