import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import {
  entityDetailPath,
  entityListPath,
  type AdminEntityKey,
} from "@/features/assistant/catalog/adminEntities";
import type { AssistantAction } from "@/features/assistant/types";

function legacyEntityPath(action: AssistantAction): string | null {
  switch (action.type) {
    case "OPEN_DRIVER_DETAIL":
      return entityDetailPath("drivers", action.driverId);
    case "OPEN_TRIP_DETAIL":
      return entityDetailPath("trips", action.tripId);
    case "OPEN_CLIENT_DETAIL":
      return entityDetailPath("clients", action.clientId);
    case "OPEN_VEHICLE_DETAIL":
      return entityDetailPath("vehicles", action.vehicleId);
    case "LIST_DRIVERS":
      return entityListPath("drivers");
    case "LIST_VEHICLES":
      return entityListPath("vehicles");
    case "LIST_TRIPS":
      return action.status && action.status !== "all"
        ? `${entityListPath("trips")}?status=${encodeURIComponent(action.status)}`
        : entityListPath("trips");
    default:
      return null;
  }
}

export function buildAssistantPath(action: AssistantAction): string | null {
  switch (action.type) {
    case "NAVIGATE":
      return action.path;
    case "LIST_ENTITY":
      return entityListPath(action.entity);
    case "OPEN_ENTITY": {
      const detail = entityDetailPath(action.entity, action.id);
      return detail ?? entityListPath(action.entity);
    }
    default:
      return legacyEntityPath(action);
  }
}

export function executeAssistantAction(
  action: AssistantAction | null | undefined,
  router: AppRouterInstance
): boolean {
  if (!action) return false;
  const path = buildAssistantPath(action);
  if (!path) return false;
  router.push(path);
  return true;
}

export function openEntityDetail(
  router: AppRouterInstance,
  entity: AdminEntityKey,
  id: string
): void {
  const path = entityDetailPath(entity, id) ?? entityListPath(entity);
  router.push(path);
}
