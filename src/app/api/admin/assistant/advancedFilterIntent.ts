import type { EntityListFilterMatch } from "@/features/assistant/lib/entityListFilters";
import { entityListPathWithQuery } from "@/features/assistant/lib/entityListFilters";
import type { AdminEntityKey } from "@/features/assistant/catalog/adminEntities";

export interface AdvancedFilterMatch extends EntityListFilterMatch {
  combined?: boolean;
}

function extractPartnerName(text: string): string | null {
  const m = text.match(
    /(?:partenaire|partner|chez|de la soci[eé]t[eé])\s+([A-Za-zÀ-ÿ0-9''\-\s]{2,40})/i
  );
  return m?.[1]?.trim().replace(/\s+(en ligne|suspendu|kyc).*$/i, "") ?? null;
}

function extractZoneName(text: string): string | null {
  const m = text.match(/(?:zone|quartier|commune|ville)\s+([A-Za-zÀ-ÿ0-9''\-\s]{2,30})/i);
  return m?.[1]?.trim() ?? null;
}

export function matchAdvancedFilterIntent(text: string): AdvancedFilterMatch | null {
  const t = text.toLowerCase();
  const partner = extractPartnerName(text);
  const zone = extractZoneName(text);

  const params: Record<string, string> = {};
  let entity: AdminEntityKey = "drivers";
  let messageParts: string[] = [];

  if (partner) {
    params.partner_id = partner;
    params.q = partner;
    messageParts.push(`partenaire « ${partner} »`);
  }
  if (zone) {
    params.zone = zone;
    params.city = zone;
    messageParts.push(`zone « ${zone} »`);
  }

  if (/chauffeur.*suspendu|suspendus.*partenaire/i.test(text)) {
    params.account_status = "suspended";
    messageParts.unshift("chauffeurs suspendus");
  } else if (/chauffeur.*(en ligne|online)|en ligne.*partenaire/i.test(text)) {
    params.availability = "online";
    messageParts.unshift("chauffeurs en ligne");
  } else if (/kyc.*(en attente|pending)|en attente.*kyc/i.test(text)) {
    entity = "kyc";
    messageParts.unshift("file KYC");
  } else if (/compte.*(en attente|pending)/i.test(text)) {
    params.account_status = "pending";
    messageParts.unshift("comptes en attente");
  }

  if (messageParts.length >= 2 || (messageParts.length === 1 && (partner || zone))) {
    const label = messageParts.join(", ");
    return {
      entity,
      queryParams: params,
      message: `J'affiche : ${label}.`,
      combined: true,
    };
  }

  if (partner && /chauffeur/i.test(t)) {
    return {
      entity: "drivers",
      queryParams: { q: partner, partner_id: partner },
      message: `Chauffeurs du partenaire « ${partner} ».`,
      combined: true,
    };
  }

  return null;
}

export { entityListPathWithQuery };
