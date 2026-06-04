"use client";

import { useMemo, useEffect, useState } from "react";
import { env } from "@/core/config/env";
import { useLiveMap } from "../api/liveMap.queries";
import { mergeLiveMapPositionDeltas } from "../api/liveMap.realtime";
import { useAdminLiveMapSocket } from "./useAdminLiveMapSocket";
import type { LiveMapScopeFiltersValue } from "../api/liveMap.types";
import type { LiveMapSocketStatus } from "../api/liveMap.realtime.types";

function useLegacyLiveMap(): boolean {
  return env.useMocks && !env.useRealAuth;
}

export function useLiveMapWithRealtime(filters?: LiveMapScopeFiltersValue) {
  const legacy = useLegacyLiveMap();
  const socketEnabled = !legacy && env.useRealAuth;
  const [httpPollActive, setHttpPollActive] = useState(true);

  const query = useLiveMap(filters, { pollSnapshot: httpPollActive });

  const { deltas, status, clearDeltas } = useAdminLiveMapSocket(
    query.data?.realtime,
    socketEnabled && Boolean(query.data)
  );

  useEffect(() => {
    const connected = socketEnabled && status === "connected";
    setHttpPollActive(!connected);
  }, [socketEnabled, status]);

  useEffect(() => {
    setHttpPollActive(true);
    clearDeltas();
  }, [filters?.franchiseId, filters?.partnerId, clearDeltas]);

  const data = useMemo(() => {
    if (!query.data) return undefined;
    return mergeLiveMapPositionDeltas(query.data, deltas);
  }, [query.data, deltas]);

  const realtimeActive = socketEnabled && status === "connected";

  return {
    ...query,
    data,
    socketStatus: status as LiveMapSocketStatus,
    realtimeActive,
    httpPollingActive: httpPollActive,
    clearRealtimeDeltas: clearDeltas,
  };
}
