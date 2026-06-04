/** Itinéraires routiers Mapbox Directions (remplace les segments droits). */

export type LngLat = [number, number];

const EARTH_RADIUS_M = 6_371_000;

/** Distance Haversine en mètres. */
export function haversineDistanceM(a: LngLat, b: LngLat): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[1] - a[1]);
  const dLng = toRad(b[0] - a[0]);
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function pathLengthM(coordinates: LngLat[]): number {
  let total = 0;
  for (let i = 1; i < coordinates.length; i++) {
    total += haversineDistanceM(coordinates[i - 1], coordinates[i]);
  }
  return total;
}

function bearingBetween(a: LngLat, b: LngLat): number {
  const dLng = b[0] - a[0];
  const dLat = b[1] - a[1];
  const distSq = dLng * dLng + dLat * dLat;
  if (distSq < 1e-14) return 0;
  const rad = Math.atan2(dLng, dLat);
  return ((rad * (180 / Math.PI) + 360) % 360);
}

/** Point et cap le long d’une polyligne (distance depuis le départ, en m). */
export function positionAlongPath(
  coordinates: LngLat[],
  distanceM: number
): { lng: number; lat: number; bearing: number } {
  if (coordinates.length === 0) {
    return { lng: 0, lat: 0, bearing: 0 };
  }
  if (coordinates.length === 1) {
    return {
      lng: coordinates[0][0],
      lat: coordinates[0][1],
      bearing: 0,
    };
  }

  let remaining = Math.max(0, distanceM);
  for (let i = 1; i < coordinates.length; i++) {
    const from = coordinates[i - 1];
    const to = coordinates[i];
    const segLen = haversineDistanceM(from, to);
    if (segLen <= 0) continue;

    if (remaining <= segLen) {
      const t = remaining / segLen;
      return {
        lng: from[0] + (to[0] - from[0]) * t,
        lat: from[1] + (to[1] - from[1]) * t,
        bearing: bearingBetween(from, to),
      };
    }
    remaining -= segLen;
  }

  const last = coordinates[coordinates.length - 1];
  const prev = coordinates[coordinates.length - 2];
  return {
    lng: last[0],
    lat: last[1],
    bearing: bearingBetween(prev, last),
  };
}

function projectPointOnSegment(
  a: LngLat,
  b: LngLat,
  p: LngLat
): { t: number; distToSegM: number } {
  const ax = a[0];
  const ay = a[1];
  const bx = b[0];
  const by = b[1];
  const px = p[0];
  const py = p[1];
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 1e-20) {
    return { t: 0, distToSegM: haversineDistanceM(a, p) };
  }
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
  const proj: LngLat = [ax + dx * t, ay + dy * t];
  return { t, distToSegM: haversineDistanceM(proj, p) };
}

/** Distance le long de la polyligne au point le plus proche de `point`. */
export function closestDistanceAlongPath(
  coordinates: LngLat[],
  point: LngLat
): { distanceM: number; distanceToPathM: number } {
  if (coordinates.length === 0) {
    return { distanceM: 0, distanceToPathM: Infinity };
  }
  if (coordinates.length === 1) {
    return {
      distanceM: 0,
      distanceToPathM: haversineDistanceM(coordinates[0], point),
    };
  }

  let along = 0;
  let bestAlong = 0;
  let minDist = Infinity;

  for (let i = 1; i < coordinates.length; i++) {
    const from = coordinates[i - 1];
    const to = coordinates[i];
    const segLen = haversineDistanceM(from, to);
    const { t, distToSegM } = projectPointOnSegment(from, to, point);
    if (distToSegM < minDist) {
      minDist = distToSegM;
      bestAlong = along + t * segLen;
    }
    along += segLen;
  }

  return { distanceM: bestAlong, distanceToPathM: minDist };
}

/** Déplace un point selon un cap (degrés) et une distance (m). */
export function offsetLngLat(
  from: LngLat,
  bearingDeg: number,
  distanceM: number
): LngLat {
  if (distanceM <= 0) return from;
  const br = (bearingDeg * Math.PI) / 180;
  const lat1 = (from[1] * Math.PI) / 180;
  const lng1 = (from[0] * Math.PI) / 180;
  const angDist = distanceM / EARTH_RADIUS_M;
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angDist) +
      Math.cos(lat1) * Math.sin(angDist) * Math.cos(br)
  );
  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(br) * Math.sin(angDist) * Math.cos(lat1),
      Math.cos(angDist) - Math.sin(lat1) * Math.sin(lat2)
    );
  return [(lng2 * 180) / Math.PI, (lat2 * 180) / Math.PI];
}

const routeCache = new Map<string, LngLat[]>();

function cacheKey(from: LngLat, to: LngLat): string {
  return `${from[0].toFixed(5)},${from[1].toFixed(5)}_${to[0].toFixed(5)},${to[1].toFixed(5)}`;
}

interface DirectionsResponse {
  routes?: Array<{
    geometry?: { coordinates?: LngLat[] };
  }>;
}

/**
 * Récupère la géométrie GeoJSON d’un trajet driving Mapbox entre deux points.
 * Retourne null si échec (l’appelant peut garder le segment droit).
 */
export async function fetchMapboxDrivingRoute(
  from: LngLat,
  to: LngLat,
  accessToken: string
): Promise<LngLat[] | null> {
  const key = cacheKey(from, to);
  const cached = routeCache.get(key);
  if (cached) return cached;

  const coords = `${from[0]},${from[1]};${to[0]},${to[1]}`;
  const url = new URL(
    `https://api.mapbox.com/directions/v5/mapbox/driving/${coords}`
  );
  url.searchParams.set("geometries", "geojson");
  url.searchParams.set("overview", "full");
  url.searchParams.set("access_token", accessToken);

  try {
    const res = await fetch(url.toString());
    if (!res.ok) return null;

    const data = (await res.json()) as DirectionsResponse;
    const coordinates = data.routes?.[0]?.geometry?.coordinates;
    if (!coordinates?.length) return null;

    routeCache.set(key, coordinates);
    return coordinates;
  } catch {
    return null;
  }
}

/** Résout plusieurs segments en parallèle (lots de 4 pour limiter la charge). */
export async function resolveTripRoutesGeometry(
  segments: { order_id: string; from: LngLat; to: LngLat; fallback: LngLat[] }[],
  accessToken: string
): Promise<Map<string, LngLat[]>> {
  const result = new Map<string, LngLat[]>();
  const batchSize = 4;

  for (let i = 0; i < segments.length; i += batchSize) {
    const batch = segments.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (seg) => {
        const path =
          (await fetchMapboxDrivingRoute(seg.from, seg.to, accessToken)) ??
          seg.fallback;
        result.set(seg.order_id, path);
      })
    );
  }

  return result;
}
