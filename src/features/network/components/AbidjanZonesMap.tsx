"use client";

import { useEffect, useMemo, useState } from "react";
import type { LiveMapHotZone, Zone, ZonePolygonGeoJson } from "@/shared/types";
import { getZonePolygonRings } from "@/shared/components/map/zonesMapGeoJson";
import { resolveMapEngine } from "@/core/config/mapProvider";
import {
  boundsFromGeoPoints,
  ringLngLatToSvgPoints,
  svgPointToLatLng,
  type MapBounds,
} from "@/shared/lib/mapProjection";
import { ZoneTypePill } from "@/shared/ui/ZoneTypePill";
import { Button } from "@/shared/ui/Button";
import { ZonesMap } from "./ZonesMap";

export interface ZoneMapItem {
  id: number | string;
  name: string;
  type: Zone["type"];
  city?: string;
  franchise_name?: string;
  polygon_geojson?: ZonePolygonGeoJson;
  center_lng?: number;
  center_lat?: number;
  heatLevel?: number;
  surge_multiplier?: number;
}

const ZONE_COLORS = [
  "rgba(10,179,156,0.28)",
  "rgba(64,81,137,0.22)",
  "rgba(245,158,11,0.22)",
  "rgba(99,102,241,0.2)",
  "rgba(236,72,153,0.18)",
];

export function computeZonesMapBounds(zones: ZoneMapItem[]): MapBounds {
  const points: Array<{ lng: number; lat: number }> = [];
  for (const zone of zones) {
    const rings = getZonePolygonRings(zone.polygon_geojson);
    if (rings.length) {
      for (const ring of rings) {
        for (const [lng, lat] of ring) {
          if (Number.isFinite(lng) && Number.isFinite(lat)) {
            points.push({ lng, lat });
          }
        }
      }
    } else if (
      zone.center_lng != null &&
      zone.center_lat != null &&
      Number.isFinite(zone.center_lng) &&
      Number.isFinite(zone.center_lat)
    ) {
      points.push({ lng: zone.center_lng, lat: zone.center_lat });
    }
  }
  return boundsFromGeoPoints(points);
}

interface AbidjanZonesMapProps {
  mode: "select" | "draw";
  zones: ZoneMapItem[];
  hotZones?: LiveMapHotZone[];
  cityLabel?: string;
  selectedZoneId?: number | string | null;
  onSelectZone?: (zone: ZoneMapItem) => void;
  draftRing?: number[][];
  onDraftPoint?: (lng: number, lat: number) => void;
  onUndoDraftPoint?: () => void;
  onClearDraft?: () => void;
  mapBounds?: MapBounds;
}

export function AbidjanZonesMap({
  mode,
  zones,
  hotZones = [],
  cityLabel = "Abidjan",
  selectedZoneId = null,
  onSelectZone,
  draftRing = [],
  onDraftPoint,
  onUndoDraftPoint,
  onClearDraft,
  mapBounds,
}: AbidjanZonesMapProps) {
  const [drawBounds, setDrawBounds] = useState<MapBounds | null>(null);

  useEffect(() => {
    if (mode === "draw") {
      setDrawBounds(
        (prev) => prev ?? mapBounds ?? computeZonesMapBounds(zones)
      );
    } else {
      setDrawBounds(null);
    }
  }, [mode, mapBounds, zones]);

  const bounds = useMemo(
    () =>
      mode === "draw" && drawBounds
        ? drawBounds
        : mapBounds ?? computeZonesMapBounds(zones),
    [mode, drawBounds, mapBounds, zones]
  );

  const handleMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (mode !== "draw" || !onDraftPoint) return;
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;
    const { lat, lng } = svgPointToLatLng(xPct, yPct, bounds);
    onDraftPoint(lng, lat);
  };

  const draftPoints =
    draftRing.length >= 2 ? ringLngLatToSvgPoints(draftRing, bounds) : "";
  const closedDraft =
    draftRing.length >= 3
      ? ringLngLatToSvgPoints([...draftRing, draftRing[0]], bounds)
      : draftPoints;

  if (resolveMapEngine() !== "legacy") {
    return (
      <div className="space-y-3">
        <ZonesMap
          zones={zones}
          hotZones={hotZones}
          cityLabel={cityLabel}
          selectedZoneId={selectedZoneId}
          onSelectZone={onSelectZone}
          mode={mode}
          draftRing={draftRing}
          onDraftPoint={onDraftPoint}
          mapBounds={bounds}
        />
        {mode === "draw" && (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              className="!text-xs"
              disabled={draftRing.length === 0}
              onClick={onUndoDraftPoint}
            >
              Annuler le dernier point
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="!text-xs"
              disabled={draftRing.length === 0}
              onClick={onClearDraft}
            >
              Effacer le tracé
            </Button>
            <p className="self-center text-xs text-muted">
              Cliquez sur la carte pour placer au moins 3 points et délimiter la zone.
            </p>
          </div>
        )}
        {mode === "select" && (
          <ZonesMapLegend
            zones={zones}
            selectedZoneId={selectedZoneId}
            onSelectZone={onSelectZone}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative h-[min(380px,50vh)] overflow-hidden rounded-card border border-border bg-map shadow-card">
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
        <p className="absolute left-3 top-3 z-10 rounded-lg bg-surface/90 px-2.5 py-1 text-xs font-medium text-foreground shadow-sm">
          {cityLabel}
        </p>
        {hotZones.length > 0 && mode === "select" && (
          <p className="absolute right-3 top-3 z-10 max-w-[calc(100%-1.5rem)] whitespace-nowrap rounded-lg bg-surface/90 px-2.5 py-1 text-xs text-muted shadow-sm">
            <span className="mr-2 inline-block h-2 w-2 rounded-full bg-amber-500" />
            {hotZones.length} zone{hotZones.length > 1 ? "s chaudes" : " chaude"}
          </p>
        )}
        {mode === "draw" && (
          <p className="absolute right-3 top-3 z-10 rounded-lg bg-teal/90 px-2.5 py-1 text-xs font-medium text-white shadow-sm">
            {draftRing.length} point{draftRing.length !== 1 ? "s" : ""}
          </p>
        )}

        <svg
          className={`absolute inset-0 h-full w-full ${
            mode === "draw" ? "cursor-crosshair" : ""
          }`}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          onClick={handleMapClick}
        >
          {hotZones.map((zone) => {
            const pt = ringLngLatToSvgPoints([[zone.lng, zone.lat]], bounds);
            const [cx, cy] = pt.split(",").map((value) => Number(value.trim()));
            if (!Number.isFinite(cx) || !Number.isFinite(cy)) return null;
            const heat = Math.min(3, Math.max(1, zone.heatLevel));
            const radius = heat >= 3 ? 4.5 : heat >= 2 ? 3.6 : 2.8;
            return (
              <g key={`hot-${zone.id}`} className="pointer-events-none">
                <circle
                  cx={cx}
                  cy={cy}
                  r={radius * 1.8}
                  fill={
                    heat >= 3
                      ? "rgba(239,68,68,0.28)"
                      : heat >= 2
                        ? "rgba(249,115,22,0.24)"
                        : "rgba(245,158,11,0.22)"
                  }
                />
                <circle
                  cx={cx}
                  cy={cy}
                  r={radius}
                  fill={
                    heat >= 3 ? "#ef4444" : heat >= 2 ? "#f97316" : "#f59e0b"
                  }
                  stroke="#ffffff"
                  strokeWidth="0.35"
                  opacity="0.92"
                />
              </g>
            );
          })}
          {zones.map((zone, i) => {
            const rings = getZonePolygonRings(zone.polygon_geojson);
            const selected = String(selectedZoneId) === String(zone.id);
            const isReference = mode === "draw";
            const color = ZONE_COLORS[i % ZONE_COLORS.length];

            if (rings.length) {
              return rings.map((ring, ringIndex) => {
                const points = ringLngLatToSvgPoints(ring, bounds);
                return (
                  <polygon
                    key={`${zone.id}-${ringIndex}`}
                    points={points}
                    fill={color}
                    stroke={selected ? "#0ab39c" : "#405189"}
                    strokeWidth={selected ? 1.2 : 0.5}
                    className={
                      isReference
                        ? "pointer-events-none opacity-35"
                        : "cursor-pointer transition-opacity hover:opacity-90"
                    }
                    onClick={
                      isReference
                        ? undefined
                        : (ev) => {
                            ev.stopPropagation();
                            onSelectZone?.(zone);
                          }
                    }
                  />
                );
              });
            }

            if (
              zone.center_lng != null &&
              zone.center_lat != null &&
              Number.isFinite(zone.center_lng) &&
              Number.isFinite(zone.center_lat)
            ) {
              const pt = ringLngLatToSvgPoints(
                [[zone.center_lng, zone.center_lat]],
                bounds
              );
              const [cx, cy] = pt.split(",");
              return (
                <g key={zone.id}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={selected ? 2.4 : 1.8}
                    fill={color}
                    stroke={selected ? "#0ab39c" : "#405189"}
                    strokeWidth={selected ? 0.9 : 0.5}
                    className={
                      isReference
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                    onClick={
                      isReference
                        ? undefined
                        : (ev) => {
                            ev.stopPropagation();
                            onSelectZone?.(zone);
                          }
                    }
                  />
                  {!isReference && (
                    <title>{zone.name}</title>
                  )}
                </g>
              );
            }

            return null;
          })}

          {mode === "draw" && draftRing.length >= 2 && (
            <polyline
              points={draftPoints}
              fill="none"
              stroke="#0ab39c"
              strokeWidth="0.8"
              strokeDasharray="2 1"
              pointerEvents="none"
            />
          )}
          {mode === "draw" && draftRing.length >= 3 && (
            <polygon
              points={closedDraft}
              fill="rgba(10,179,156,0.25)"
              stroke="#0ab39c"
              strokeWidth="0.9"
              pointerEvents="none"
            />
          )}
          {mode === "draw" &&
            draftRing.map(([lng, lat], idx) => {
              const pt = ringLngLatToSvgPoints([[lng, lat]], bounds);
              const [x, y] = pt.split(",");
              return (
                <circle
                  key={`${lng}-${lat}-${idx}`}
                  cx={x}
                  cy={y}
                  r="1.2"
                  fill="#0ab39c"
                  stroke="#fff"
                  strokeWidth="0.3"
                  pointerEvents="none"
                />
              );
            })}
        </svg>

        {mode === "select" && zones.length === 0 && (
          <p className="absolute inset-0 flex items-center justify-center text-sm text-muted">
            Aucune zone cartographiée
          </p>
        )}
      </div>

      {mode === "draw" && (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            className="!text-xs"
            disabled={draftRing.length === 0}
            onClick={onUndoDraftPoint}
          >
            Annuler le dernier point
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="!text-xs"
            disabled={draftRing.length === 0}
            onClick={onClearDraft}
          >
            Effacer le tracé
          </Button>
          <p className="self-center text-xs text-muted">
            Cliquez sur la carte pour placer au moins 3 points et délimiter la zone.
          </p>
        </div>
      )}

      {mode === "select" && (
        <ZonesMapLegend
          zones={zones}
          selectedZoneId={selectedZoneId}
          onSelectZone={onSelectZone}
        />
      )}
    </div>
  );
}

export function ZonesMapLegend({
  zones,
  selectedZoneId,
  onSelectZone,
}: {
  zones: ZoneMapItem[];
  selectedZoneId?: number | string | null;
  onSelectZone?: (zone: ZoneMapItem) => void;
}) {
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {zones.map((zone) => (
        <li key={zone.id}>
          <button
            type="button"
            onClick={() => onSelectZone?.(zone)}
            className={`w-full rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
              String(selectedZoneId) === String(zone.id)
                ? "border-teal bg-teal/5 ring-1 ring-teal/30"
                : "border-border bg-surface hover:border-teal/30"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-foreground">{zone.name}</span>
              <ZoneTypePill type={zone.type} />
            </div>
            {zone.franchise_name && (
              <p className="mt-1 text-xs text-muted">{zone.franchise_name}</p>
            )}
          </button>
        </li>
      ))}
    </ul>
  );
}
