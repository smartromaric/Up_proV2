import type { AdminEntityKey } from "../catalog/adminEntities";
import { entityListPath } from "../catalog/adminEntities";

export interface EntityListFilterMatch {
  entity: AdminEntityKey;
  queryParams: Record<string, string>;
  message: string;
}

export function entityListPathWithQuery(
  entity: AdminEntityKey,
  queryParams: Record<string, string>
): string {
  const base = entityListPath(entity);
  const qs = new URLSearchParams(queryParams).toString();
  return qs ? `${base}?${qs}` : base;
}

export function matchEntityListFilterIntent(text: string): EntityListFilterMatch | null {
  const t = text.toLowerCase();

  if (/kyc.*(en attente|pending|à valider|a valider)|file kyc|documents kyc/i.test(text)) {
    return {
      entity: "kyc",
      queryParams: {},
      message: "J'ouvre la file KYC en attente.",
    };
  }

  if (/chauffeur.*(en attente|pending)|comptes en attente/i.test(text)) {
    return {
      entity: "drivers",
      queryParams: { account_status: "pending" },
      message: "J'affiche les chauffeurs en attente de validation.",
    };
  }

  if (/chauffeur.*suspendu|comptes suspendus/i.test(text)) {
    return {
      entity: "drivers",
      queryParams: { account_status: "suspended" },
      message: "J'affiche les chauffeurs suspendus.",
    };
  }

  if (/chauffeur.*(en ligne|online)|disponibles en ligne/i.test(text)) {
    return {
      entity: "drivers",
      queryParams: { availability: "online" },
      message: "J'affiche les chauffeurs en ligne.",
    };
  }

  if (/courses en cours|course en cours|trips en cours/i.test(text)) {
    return {
      entity: "trips",
      queryParams: { status: "in_progress" },
      message: "J'affiche les courses en cours.",
    };
  }

  if (/courses annulées|courses annulees/i.test(text)) {
    return {
      entity: "trips",
      queryParams: { status: "cancelled" },
      message: "J'affiche les courses annulées.",
    };
  }

  if (/retrait.*(en attente|pending)|withdrawals pending/i.test(text)) {
    return {
      entity: "withdrawals",
      queryParams: { status: "pending" },
      message: "J'affiche les retraits en attente.",
    };
  }

  if (/véhicule.*(sans carte grise|non valid)|vehicules en attente/i.test(text)) {
    return {
      entity: "vehicles",
      queryParams: { approval_status: "pending" },
      message: "J'affiche les véhicules en attente de validation.",
    };
  }

  if (/incident.*sos|sos non trait/i.test(text)) {
    return {
      entity: "sos-incidents",
      queryParams: { status: "open" },
      message: "J'affiche les incidents SOS ouverts.",
    };
  }

  if (t.includes("litige") && /ouvert|en cours/i.test(t)) {
    return {
      entity: "disputes",
      queryParams: { status: "open" },
      message: "J'affiche les litiges ouverts.",
    };
  }

  return null;
}
