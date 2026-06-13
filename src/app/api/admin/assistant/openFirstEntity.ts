import { buildV1ListQuery } from "@/core/api/v1Pagination";
import type { AssistantApiResponse } from "@/features/assistant/types";
import {
  ENTITY_LIST_API,
  getEntityDef,
  type AdminEntityKey,
} from "@/features/assistant/catalog/adminEntities";
import {
  getItemId,
  getItemLabel,
  resolveOpenEntity,
} from "./entityResolver";

const API_ORIGIN = (
  process.env.NEXT_PUBLIC_API_URL ?? "https://api.upjunoo-dev.tech"
).replace(/\/$/, "");

async function apiGet<T>(
  path: string,
  authHeader: string | null
): Promise<T | null> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "X-Client-Type": "back-office",
  };
  if (authHeader) headers.Authorization = authHeader;

  const response = await fetch(`${API_ORIGIN}${path}`, { headers });
  if (!response.ok) return null;
  return response.json() as Promise<T>;
}

function pickListItems(data: unknown, entity: AdminEntityKey): Record<string, unknown>[] {
  if (!data || typeof data !== "object") return [];
  const o = data as Record<string, unknown>;
  if (entity === "trips") {
    return [
      ...((o.rides as Record<string, unknown>[]) ?? []),
      ...((o.deliveries as Record<string, unknown>[]) ?? []),
    ];
  }
  return (o.items as Record<string, unknown>[]) ?? [];
}

export async function resolveOpenFirstEntity(
  entity: AdminEntityKey,
  authHeader: string | null
): Promise<AssistantApiResponse> {
  const def = getEntityDef(entity);
  const listApi = ENTITY_LIST_API[entity];

  if (!listApi || !def.detailPath) {
    return {
      message: `Je ne peux pas ouvrir le premier ${def.label} automatiquement.`,
      action: { type: "LIST_ENTITY", entity },
    };
  }

  const listData = await apiGet<unknown>(
    `${listApi}${buildV1ListQuery({ per_page: 1, page: 1 })}`,
    authHeader
  );
  const items = pickListItems(listData, entity);

  if (!items.length) {
    return {
      message: `La liste des ${def.labelPlural} est vide.`,
      action: { type: "LIST_ENTITY", entity },
    };
  }

  const first = items[0]!;
  const id = getItemId(first);
  if (!id) {
    return {
      message: `Impossible d'identifier le premier ${def.label}.`,
      action: { type: "LIST_ENTITY", entity },
    };
  }

  const label = getItemLabel(entity, first);
  const open = resolveOpenEntity(entity, id);
  return {
    ...open,
    message: `J'ouvre le premier ${def.label} : ${label}.`,
  };
}

export async function fetchFirstEntityId(
  entity: AdminEntityKey,
  authHeader: string | null
): Promise<string | null> {
  const listApi = ENTITY_LIST_API[entity];
  if (!listApi) return null;

  const listData = await apiGet<unknown>(
    `${listApi}${buildV1ListQuery({ per_page: 1, page: 1 })}`,
    authHeader
  );
  const items = pickListItems(listData, entity);
  const first = items[0];
  return first ? getItemId(first) : null;
}
