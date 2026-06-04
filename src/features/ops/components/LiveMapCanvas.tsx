"use client";

import { useMemo } from "react";
import type { LiveMapData } from "@/shared/types";
import { env } from "@/core/config/env";
import { MapboxMap } from "@/shared/components/map/MapboxMap";
import {
  boundsToMapboxLngLatBounds,
  liveMapDataToMapFeatures,
} from "@/shared/components/map/mapboxMarkers";
import { LiveMapCanvasLegacy, LiveMapLegend } from "./LiveMapCanvasLegacy";

interface LiveMapCanvasProps {
  data: LiveMapData;
}

export function LiveMapCanvas({ data }: LiveMapCanvasProps) {
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
            />
          </div>
        </div>
      </div>
    );
  }

  return <LiveMapCanvasLegacy data={data} />;
}
