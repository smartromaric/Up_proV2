import type { AdminEntityKey } from "@/features/assistant/catalog/adminEntities";

export interface RelationalIntent {
  targetEntity: AdminEntityKey;
  sourceEntity: AdminEntityKey;
  sourceQuery: string;
  previewMessage: string;
}

function cleanQuery(raw: string): string {
  return raw.replace(/[?.!,]+$/g, "").trim();
}

const RELATION_RULES: Array<{
  target: AdminEntityKey;
  source: AdminEntityKey;
  targetLabel: string;
  sourceLabel: string;
  patterns: RegExp[];
}> = [
  {
    target: "partners",
    source: "drivers",
    targetLabel: "partenaire",
    sourceLabel: "chauffeur",
    patterns: [
      /partenaire\s+(?:du|de la|de l'|de)\s+(?:chauffeur|chauffeure?|driver)\s+(.+)/i,
      /ouvre(?:r|z)?\s+(?:moi\s+)?(?:le|la)?\s*partenaire\s+(?:du|de la|de)\s+(?:chauffeur|chauffeure?)\s+(.+)/i,
    ],
  },
  {
    target: "drivers",
    source: "vehicles",
    targetLabel: "chauffeur",
    sourceLabel: "véhicule",
    patterns: [
      /chauffeur\s+(?:du|de la|de l'|de)\s+(?:véhicule|vehicule|auto|moto|scooter)\s+(?:plaque\s+)?(.+)/i,
      /ouvre(?:r|z)?\s+(?:moi\s+)?(?:le|la)?\s*chauffeur\s+(?:du|de la|de)\s+(?:véhicule|vehicule)\s+(?:plaque\s+)?(.+)/i,
    ],
  },
  {
    target: "vehicles",
    source: "drivers",
    targetLabel: "véhicule",
    sourceLabel: "chauffeur",
    patterns: [
      /véhicule\s+(?:du|de la|de l'|de)\s+(?:chauffeur|chauffeure?|driver)\s+(.+)/i,
      /ouvre(?:r|z)?\s+(?:moi\s+)?(?:le|la)?\s*véhicule\s+(?:du|de la|de)\s+(?:chauffeur|chauffeure?)\s+(.+)/i,
    ],
  },
  {
    target: "partners",
    source: "vehicles",
    targetLabel: "partenaire",
    sourceLabel: "véhicule",
    patterns: [
      /partenaire\s+(?:du|de la|de l'|de)\s+(?:véhicule|vehicule|auto|moto)\s+(?:plaque\s+)?(.+)/i,
      /ouvre(?:r|z)?\s+(?:moi\s+)?(?:le|la)?\s*partenaire\s+(?:du|de la|de)\s+(?:véhicule|vehicule)\s+(?:plaque\s+)?(.+)/i,
    ],
  },
  {
    target: "franchises",
    source: "partners",
    targetLabel: "franchise",
    sourceLabel: "partenaire",
    patterns: [
      /franchise\s+(?:du|de la|de l'|de)\s+(?:partenaire|partner)\s+(.+)/i,
      /ouvre(?:r|z)?\s+(?:moi\s+)?(?:la)?\s*franchise\s+(?:du|de la|de)\s+(?:partenaire|partner)\s+(.+)/i,
    ],
  },
  {
    target: "franchises",
    source: "drivers",
    targetLabel: "franchise",
    sourceLabel: "chauffeur",
    patterns: [
      /franchise\s+(?:du|de la|de l'|de)\s+(?:chauffeur|chauffeure?|driver)\s+(.+)/i,
    ],
  },
  {
    target: "drivers",
    source: "trips",
    targetLabel: "chauffeur",
    sourceLabel: "course",
    patterns: [
      /chauffeur\s+(?:de la|du|de)\s+course\s+(.+)/i,
      /chauffeur\s+(?:de la|du|de)\s+(?:trip|trajet)\s+(.+)/i,
    ],
  },
  {
    target: "partners",
    source: "trips",
    targetLabel: "partenaire",
    sourceLabel: "course",
    patterns: [
      /partenaire\s+(?:de la|du|de)\s+course\s+(.+)/i,
    ],
  },
  {
    target: "clients",
    source: "trips",
    targetLabel: "client",
    sourceLabel: "course",
    patterns: [
      /client\s+(?:de la|du|de)\s+course\s+(.+)/i,
    ],
  },
  {
    target: "vehicles",
    source: "trips",
    targetLabel: "véhicule",
    sourceLabel: "course",
    patterns: [
      /véhicule\s+(?:de la|du|de)\s+course\s+(.+)/i,
    ],
  },
];

export function matchRelationalIntent(text: string): RelationalIntent | null {
  const normalized = text.trim();
  for (const rule of RELATION_RULES) {
    for (const pattern of rule.patterns) {
      const match = normalized.match(pattern);
      const query = cleanQuery(match?.[1] ?? "");
      if (query.length >= 2) {
        return {
          targetEntity: rule.target,
          sourceEntity: rule.source,
          sourceQuery: query,
          previewMessage: `Recherche du ${rule.targetLabel} du ${rule.sourceLabel} « ${query} »…`,
        };
      }
    }
  }
  return null;
}

/** Paires supportées pour le LLM (OPEN_RELATED). */
export const SUPPORTED_RELATIONS = RELATION_RULES.map((r) => ({
  target: r.target,
  source: r.source,
  example: `${r.targetLabel} du ${r.sourceLabel}`,
}));
