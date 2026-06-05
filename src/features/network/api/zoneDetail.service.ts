import { apiClient } from "@/core/http/apiClient";
import { fetchNetworkLookups } from "@/core/api/catalogLookup.service";
import { LINKS } from "@/core/api/links";
import { useLegacyAdminApi } from "@/core/api/v1AdminMode";
import type { ZoneDetail } from "@/shared/types";
import type {
  ApiV1ZoneDemandResponse,
  ApiV1ZoneDetailResponse,
} from "./adminZones.api.types";
import { mapApiZoneToDetail } from "./adminZones.mapper";
import { fetchZoneSurgeById } from "./zones.service";

export const zoneDetailService = {
  getById: async (id: string | number): Promise<ZoneDetail> => {
    if (useLegacyAdminApi()) {
      return apiClient.get<ZoneDetail>(`/admin/network/zones/${id}`);
    }

    const zoneId = String(id);
    const [{ cityById, franchiseNameById }, surgeByZoneId, profile, demand] =
      await Promise.all([
        fetchNetworkLookups(),
        fetchZoneSurgeById(),
        apiClient.get<ApiV1ZoneDetailResponse>(
          LINKS.admin.zones.getById(zoneId)
        ),
        apiClient
          .get<ApiV1ZoneDemandResponse>(LINKS.admin.zones.demand(zoneId))
          .catch(() => null),
      ]);

    const item = profile.zone;
    if (!item) {
      throw new Error("ZONE_NOT_FOUND");
    }

    return mapApiZoneToDetail(
      item,
      demand,
      { cityById, franchiseNameById, surgeByZoneId }
    );
  },

  updatePolygon: (
    id: string | number,
    polygon_geojson: NonNullable<ZoneDetail["polygon_geojson"]>
  ) =>
    apiClient.put<ZoneDetail>(`/admin/network/zones/${id}/polygon`, {
      polygon_geojson,
    }),
};
