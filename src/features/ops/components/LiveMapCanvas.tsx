"use client";

import { useMemo } from "react";
import type { LiveMapData } from "@/shared/types";
import { env } from "@/core/config/env";
import { MapboxMap } from "@/shared/components/map/MapboxMap";
import {
  boundsToMapboxLngLatBounds,
  liveMapDataToMapFeatures,
} from "@/shared/components/map/mapboxMarkers";
import { useLiveMapHotZones } from "../api/liveMapHotZones.queries";
import type { LiveMapScopeFiltersValue } from "../api/liveMap.types";
import { LiveMapCanvasLegacy, LiveMapLegend } from "./LiveMapCanvasLegacy";

interface LiveMapCanvasProps {
  data: LiveMapData;
  scopeFilters?: LiveMapScopeFiltersValue;
}

export function LiveMapCanvas({ data, scopeFilters }: LiveMapCanvasProps) {
  const { data: hotZones = [] } = useLiveMapHotZones(scopeFilters);
  const features = useMemo(() => liveMapDataToMapFeatures(data), [data]);
  const bounds = useMemo(
    () => boundsToMapboxLngLatBounds(data.bounds),
    [data.bounds]
  );

  if (env.mapboxToken) {
    return (
      <div className="relative">
        <MapboxMap
          features={features}
          tripRoutes={data.trip_routes}
          hotZones={hotZones}
          bounds={bounds}
          zoneLabel={data.zone_name}
          cityLabel={data.city}
          animateDriverMoves={Boolean(env.mapboxToken)}
        />
        <div className="pointer-events-none absolute bottom-4 left-4 z-10">
          <div className="pointer-events-auto">
            <LiveMapLegend
              isGlobal={data.scope === "global"}
              showOrders={Boolean(data.order_markers?.length)}
              showHotZones={hotZones.length > 0}
            />
          </div>
        </div>
      </div>
    );
  }

  return <LiveMapCanvasLegacy data={data} hotZones={hotZones} />;
}
