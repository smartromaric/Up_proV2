"use client";

import { useMemo } from "react";
import { resolveMapEngine } from "@/core/config/mapProvider";
import {
  boundsFromGeoPoints,
  ringLngLatToSvgPoints,
  type MapBounds,
} from "@/shared/lib/mapProjection";
import { getZonePolygonRings } from "@/shared/components/map/zonesMapGeoJson";
import type { ZonePolygonGeoJson } from "@/shared/types";
import { ZonesMap } from "./ZonesMap";
import type { ZoneMapItem } from "./AbidjanZonesMap";

interface ZonePolygonMapProps {
  polygon?: ZonePolygonGeoJson;
  zoneName: string;
  center_lng?: number;
  center_lat?: number;
  className?: string;
  mapBounds?: MapBounds;
}

export function ZonePolygonMap({
  polygon,
  zoneName,
  center_lng,
  center_lat,
  className = "h-64",
  mapBounds,
}: ZonePolygonMapProps) {
  const rings = getZonePolygonRings(polygon);
  const bounds = useMemo(() => {
    if (mapBounds) return mapBounds;
    if (rings.length) {
      const points = rings.flatMap((ring) =>
        ring.map(([lng, lat]) => ({ lng, lat }))
      );
      return boundsFromGeoPoints(points);
    }
    if (
      center_lng != null &&
      center_lat != null &&
      Number.isFinite(center_lng) &&
      Number.isFinite(center_lat)
    ) {
      return boundsFromGeoPoints([{ lng: center_lng, lat: center_lat }]);
    }
    return boundsFromGeoPoints([]);
  }, [mapBounds, rings, center_lng, center_lat]);

  const hasPolygon = rings.length > 0;
  const centerPoint =
    center_lng != null &&
    center_lat != null &&
    Number.isFinite(center_lng) &&
    Number.isFinite(center_lat)
      ? ringLngLatToSvgPoints([[center_lng, center_lat]], bounds)
      : null;
  const [centerX, centerY] = centerPoint?.split(",") ?? [];

  const mapboxZone = useMemo((): ZoneMapItem[] => {
    if (hasPolygon && polygon) {
      return [
        {
          id: "zone-detail",
          name: zoneName,
          type: "standard",
          polygon_geojson: polygon,
        },
      ];
    }
    if (center_lng != null && center_lat != null) {
      return [
        {
          id: "zone-detail",
          name: zoneName,
          type: "standard",
          center_lng,
          center_lat,
        },
      ];
    }
    return [];
  }, [hasPolygon, polygon, zoneName, center_lng, center_lat]);

  if (resolveMapEngine() !== "legacy") {
    return (
      <div className="space-y-2">
        <ZonesMap
          zones={mapboxZone}
          cityLabel={zoneName}
          className={className}
          emptyMessage="Périmètre non défini"
          mapBounds={bounds}
        />
        <p className="text-xs text-muted">
          {hasPolygon
            ? "Polygone actif"
            : center_lng != null
              ? "Centre géographique (polygone non fourni par l'API)"
              : "Périmètre non défini"}
        </p>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-card border border-border bg-map ${className}`}
    >
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(rgba(64,81,137,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(64,81,137,0.1) 1px, transparent 1px)
          `,
          backgroundSize: "28px 28px",
        }}
      />
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {hasPolygon &&
          rings.map((ring, index) => (
            <polygon
              key={index}
              points={ringLngLatToSvgPoints(ring, bounds)}
              fill="rgba(10,179,156,0.25)"
              stroke="#0ab39c"
              strokeWidth="0.8"
            />
          ))}
        {!hasPolygon && centerX && centerY && (
          <>
            <circle
              cx={centerX}
              cy={centerY}
              r="3"
              fill="rgba(10,179,156,0.2)"
              stroke="#0ab39c"
              strokeWidth="0.4"
            />
            <circle
              cx={centerX}
              cy={centerY}
              r="1.2"
              fill="#0ab39c"
              stroke="#fff"
              strokeWidth="0.3"
            />
          </>
        )}
      </svg>
      <p className="absolute bottom-3 left-3 rounded bg-surface/90 px-2 py-1 text-xs font-medium text-foreground shadow-sm">
        {zoneName}
        {hasPolygon
          ? " · polygone actif"
          : centerX
            ? " · centre géographique"
            : " · périmètre non défini"}
      </p>
    </div>
  );
}
