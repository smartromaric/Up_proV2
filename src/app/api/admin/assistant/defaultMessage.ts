import type { AssistantAction } from "@/features/assistant/types";
import { getEntityDef, type AdminEntityKey } from "@/features/assistant/catalog/adminEntities";

export function defaultMessageForAction(action: AssistantAction): string {
  switch (action.type) {
    case "LIST_ENTITY": {
      const def = getEntityDef(action.entity);
      return `J'ouvre la liste des ${def.labelPlural}.`;
    }
    case "FIND_ENTITY": {
      const def = getEntityDef(action.entity);
      return `Recherche ${def.label} : ${action.query}…`;
    }
    case "OPEN_RELATED":
      return `Recherche du lien ${action.targetEntity} ← ${action.sourceEntity}…`;
    case "OPEN_ENTITY": {
      const def = getEntityDef(action.entity);
      return `J'ouvre ${def.label} ${action.id.slice(0, 8)}…`;
    }
    case "FIND_VEHICLE":
      return `Recherche du véhicule ${action.query}…`;
    case "FIND_DRIVER":
      return `Recherche du chauffeur ${action.query}…`;
    case "FIND_TRIP":
      return `Recherche de la course ${action.query}…`;
    case "LIST_VEHICLES":
      return "J'ouvre la liste des véhicules.";
    case "LIST_DRIVERS":
      return "J'ouvre la liste des chauffeurs.";
    case "LIST_TRIPS":
      return action.status
        ? `J'affiche les courses (${action.status}).`
        : "J'ouvre la liste des courses.";
    case "NAVIGATE":
      return "J'ouvre la page demandée.";
    case "OPEN_VEHICLE_DETAIL":
      return "J'ouvre la fiche véhicule.";
    case "OPEN_DRIVER_DETAIL":
      return "J'ouvre la fiche chauffeur.";
    case "OPEN_TRIP_DETAIL":
      return "J'ouvre le détail de la course.";
    case "OPEN_CLIENT_DETAIL":
      return "J'ouvre la fiche client.";
    default:
      return "Voici le résultat.";
  }
}

export function entityKeyFromLegacy(action: AssistantAction): AdminEntityKey | null {
  switch (action.type) {
    case "OPEN_DRIVER_DETAIL":
    case "FIND_DRIVER":
    case "LIST_DRIVERS":
      return "drivers";
    case "OPEN_TRIP_DETAIL":
    case "FIND_TRIP":
    case "LIST_TRIPS":
      return "trips";
    case "OPEN_VEHICLE_DETAIL":
    case "FIND_VEHICLE":
    case "LIST_VEHICLES":
      return "vehicles";
    case "OPEN_CLIENT_DETAIL":
      return "clients";
    default:
      return null;
  }
}
