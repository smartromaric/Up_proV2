"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { env } from "@/core/config/env";
import type { LiveMapTripRoute } from "@/shared/types";
import { resolveTripRoutesGeometry } from "./mapboxDirections";
import { createLiveMapMarkerElement } from "./mapboxMarkerElement";
import {
  clearAllDriverMotions,
  removeDriverMotion,
  setDriverMotionTarget,
  snapDriverMarker,
} from "./mapboxDriverMotion";
import type { MapboxPointFeature } from "./mapboxMarkers";

mapboxgl.accessToken = env.mapboxToken;

const MAP_STYLES = {
  light: "mapbox://styles/mapbox/light-v11",
  dark: "mapbox://styles/mapbox/dark-v11",
} as const;

const ROUTES_SOURCE = "live-map-trip-routes";
const ROUTES_LAYER = "live-map-trip-routes-line";

function isValidMapCoord(lng: number, lat: number): boolean {
  return (
    Number.isFinite(lng) &&
    Number.isFinite(lat) &&
    lng >= -180 &&
    lng <= 180 &&
    lat >= -90 &&
    lat <= 90
  );
}

interface MapboxMapProps {
  features: MapboxPointFeature[];
  tripRoutes?: LiveMapTripRoute[];
  bounds?: [[number, number], [number, number]];
  zoneLabel?: string;
  cityLabel?: string;
  className?: string;
  /** Interpolation des déplacements chauffeurs (temps réel socket) */
  animateDriverMoves?: boolean;
}

function routesToGeoJson(
  routes: LiveMapTripRoute[],
  coordinatesByOrder: Map<string, [number, number][]>
) {
  return {
    type: "FeatureCollection" as const,
    features: routes.map((r) => ({
      type: "Feature" as const,
      properties: { ref: r.ref, status: r.status_label },
      geometry: {
        type: "LineString" as const,
        coordinates: coordinatesByOrder.get(r.order_id) ?? r.coordinates,
      },
    })),
  };
}

export function MapboxMap({
  features,
  tripRoutes = [],
  bounds,
  zoneLabel,
  cityLabel,
  className = "",
  animateDriverMoves = false,
}: MapboxMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersByIdRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const didFitBoundsRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [routeCoords, setRouteCoords] = useState<Map<string, [number, number][]>>(
    () => new Map()
  );
  const routesRequestRef = useRef(0);

  useEffect(() => {
    if (!env.mapboxToken || !containerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: MAP_STYLES.light,
      center: [-3.99, 5.35],
      zoom: 11,
      attributionControl: true,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
    map.on("load", () => setReady(true));
    mapRef.current = map;

    return () => {
      clearAllDriverMotions();
      markersByIdRef.current.forEach((m) => m.remove());
      markersByIdRef.current.clear();
      didFitBoundsRef.current = false;
      map.remove();
      mapRef.current = null;
      setReady(false);
    };
  }, []);

  useEffect(() => {
    if (!ready || !env.mapboxToken || tripRoutes.length === 0) {
      setRouteCoords(new Map());
      return;
    }

    const requestId = ++routesRequestRef.current;
    let cancelled = false;

    const segments = tripRoutes
      .filter((r) => r.coordinates.length >= 2)
      .map((r) => {
        const from = r.coordinates[0];
        const to = r.coordinates[r.coordinates.length - 1];
        return {
          order_id: r.order_id,
          from,
          to,
          fallback: r.coordinates,
        };
      });

    resolveTripRoutesGeometry(segments, env.mapboxToken).then((resolved) => {
      if (cancelled || routesRequestRef.current !== requestId) return;
      setRouteCoords(resolved);
    });

    return () => {
      cancelled = true;
    };
  }, [tripRoutes, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    if (map.getLayer(ROUTES_LAYER)) map.removeLayer(ROUTES_LAYER);
    if (map.getSource(ROUTES_SOURCE)) map.removeSource(ROUTES_SOURCE);

    if (tripRoutes.length > 0) {
      map.addSource(ROUTES_SOURCE, {
        type: "geojson",
        data: routesToGeoJson(tripRoutes, routeCoords),
      });
      map.addLayer({
        id: ROUTES_LAYER,
        type: "line",
        source: ROUTES_SOURCE,
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
        paint: {
          "line-color": "#405189",
          "line-width": 4,
          "line-opacity": 0.85,
        },
      });
    }
  }, [tripRoutes, routeCoords, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    const markersById = markersByIdRef.current;
    const nextIds = new Set(features.map((f) => f.id));

    for (const [id, marker] of markersById) {
      if (!nextIds.has(id)) {
        removeDriverMotion(marker);
        marker.remove();
        markersById.delete(id);
      }
    }

    for (const feature of features) {
      if (!isValidMapCoord(feature.lng, feature.lat)) continue;

      const target: [number, number] = [feature.lng, feature.lat];
      const existing = markersById.get(feature.id);
      const smoothDriver =
        animateDriverMoves && feature.kind === "driver";

      if (existing) {
        const root = existing.getElement();
        if (smoothDriver) {
          setDriverMotionTarget(
            existing,
            root,
            target,
            feature.heading,
            feature.speedKmh
          );
        } else {
          removeDriverMotion(existing);
          snapDriverMarker(existing, root, target, feature.heading);
        }
        continue;
      }

      const el = createLiveMapMarkerElement(feature);

      const popup = new mapboxgl.Popup({
        offset: 18,
        anchor: "bottom",
        closeButton: true,
        closeOnClick: true,
        maxWidth: "300px",
        className: "mapbox-live-popup",
      }).setHTML(feature.popupHtml);

      const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
        .setLngLat(target)
        .setPopup(popup)
        .addTo(map);

      if (smoothDriver) {
        setDriverMotionTarget(
          marker,
          el,
          target,
          feature.heading,
          feature.speedKmh
        );
      } else {
        snapDriverMarker(marker, el, target, feature.heading);
      }

      markersById.set(feature.id, marker);
    }

    if (!didFitBoundsRef.current && features.length > 0) {
      didFitBoundsRef.current = true;
      if (bounds) {
        map.fitBounds(bounds, { padding: 56, maxZoom: 14, duration: 600 });
      } else if (features.length === 1) {
        map.flyTo({ center: [features[0].lng, features[0].lat], zoom: 13 });
      }
    }
  }, [features, bounds, ready, animateDriverMoves]);

  if (!env.mapboxToken) {
    return (
      <div
        className={`flex h-full min-h-[320px] items-center justify-center rounded-card border border-dashed border-border bg-canvas p-6 text-center text-sm text-muted ${className}`}
      >
        Ajoutez <code className="text-xs">NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN</code> dans
        .env.local pour afficher Mapbox.
      </div>
    );
  }

  return (
    <div
      className={`relative h-[min(520px,70vh)] w-full overflow-hidden rounded-card border shadow-card ${className}`}
    >
      <div ref={containerRef} className="h-full w-full" />
      {(zoneLabel || cityLabel) && (
        <p className="pointer-events-none absolute left-4 top-4 z-10 rounded-lg bg-elevated/95 px-3 py-1.5 text-xs font-medium text-heading shadow-md backdrop-blur">
          {zoneLabel}
          {cityLabel ? (
            <span className="text-muted"> · {cityLabel}</span>
          ) : null}
        </p>
      )}
    </div>
  );
}
