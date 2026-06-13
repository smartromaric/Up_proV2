import { LINKS } from "@/core/api/links";
import type { AssistantApiResponse } from "@/features/assistant/types";
import {
  getEntityDef,
  type AdminEntityKey,
} from "@/features/assistant/catalog/adminEntities";
import {
  getItemId,
  getItemLabel,
  resolveOpenEntity,
  searchEntityMatches,
} from "./entityResolver";

const itemId = getItemId;
const itemLabel = getItemLabel;

function pickId(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number") return String(value);
  return null;
}

async function relatedIdFromRecord(
  source: AdminEntityKey,
  target: AdminEntityKey,
  item: Record<string, unknown>,
  authHeader: string | null
): Promise<string | null> {
  if (source === "drivers") {
    if (target === "partners") return pickId(item.partner_id);
    if (target === "vehicles") return pickId(item.current_vehicle_id);
    if (target === "franchises") return pickId(item.franchise_id);
  }

  if (source === "vehicles") {
    if (target === "partners") return pickId(item.partner_id);
    if (target === "drivers") {
      const direct = pickId(item.driver_id);
      if (direct) return direct;
      const embedded = item.driver as Record<string, unknown> | undefined;
      if (embedded?.id) return pickId(embedded.id);

      const partnerId = pickId(item.partner_id);
      const vehicleId = itemId(item);
      if (partnerId && vehicleId) {
        const detail = await fetchVehicleDetail(partnerId, vehicleId, authHeader);
        if (detail) return detail;
      }
    }
  }

  if (source === "partners" && target === "franchises") {
    return pickId(item.franchise_id);
  }

  if (source === "trips") {
    if (target === "drivers") {
      return pickId(item.driver_id) ?? pickId(item.driverId);
    }
    if (target === "partners") {
      return pickId(item.partner_id) ?? pickId(item.partnerId);
    }
    if (target === "clients") {
      return (
        pickId(item.client_id) ??
        pickId(item.user_id) ??
        pickId(item.customer_id)
      );
    }
    if (target === "vehicles") {
      return pickId(item.vehicle_id) ?? pickId(item.current_vehicle_id);
    }
  }

  return null;
}

async function fetchVehicleDetail(
  partnerId: string,
  vehicleId: string,
  authHeader: string | null
): Promise<string | null> {
  const API_ORIGIN = (
    process.env.NEXT_PUBLIC_API_URL ?? "https://api.upjunoo-dev.tech"
  ).replace(/\/$/, "");
  const headers: Record<string, string> = {
    Accept: "application/json",
    "X-Client-Type": "back-office",
  };
  if (authHeader) headers.Authorization = authHeader;

  const response = await fetch(
    `${API_ORIGIN}${LINKS.admin.partners.vehicleById(partnerId, vehicleId)}`,
    { headers }
  );
  if (!response.ok) return null;

  const data = (await response.json()) as {
    vehicle?: {
      driver_id?: string | null;
      driver?: { id?: string | null };
    };
  };
  const vehicle = data.vehicle;
  if (!vehicle) return null;
  return pickId(vehicle.driver_id) ?? pickId(vehicle.driver?.id);
}

export async function resolveOpenRelated(
  targetEntity: AdminEntityKey,
  sourceEntity: AdminEntityKey,
  sourceQuery: string,
  authHeader: string | null
): Promise<AssistantApiResponse> {
  const sourceDef = getEntityDef(sourceEntity);
  const targetDef = getEntityDef(targetEntity);
  const matches = await searchEntityMatches(
    sourceEntity,
    sourceQuery,
    authHeader
  );

  if (matches.length === 0) {
    return {
      message: `Aucun ${sourceDef.label} trouvé pour « ${sourceQuery} ».`,
      action: { type: "LIST_ENTITY", entity: sourceEntity },
    };
  }

  if (matches.length > 1) {
    return {
      message: `Plusieurs ${sourceDef.labelPlural} correspondent à « ${sourceQuery} ». Précisez lequel pour ouvrir son ${targetDef.label}.`,
      action: { type: "LIST_ENTITY", entity: sourceEntity },
      candidates: matches.slice(0, 5).map((item) => ({
        id: itemId(item),
        label: itemLabel(sourceEntity, item),
        kind: sourceEntity,
      })),
    };
  }

  const sourceItem = matches[0];
  const sourceName = itemLabel(sourceEntity, sourceItem);
  const relatedId = await relatedIdFromRecord(
    sourceEntity,
    targetEntity,
    sourceItem,
    authHeader
  );

  if (!relatedId) {
    return {
      message: `${sourceName} n'a pas de ${targetDef.label} associé dans l'API.`,
      action: {
        type: "OPEN_ENTITY",
        entity: sourceEntity,
        id: itemId(sourceItem),
      },
    };
  }

  const open = resolveOpenEntity(targetEntity, relatedId);
  return {
    ...open,
    message: `J'ouvre le ${targetDef.label} de ${sourceName}.`,
  };
}
