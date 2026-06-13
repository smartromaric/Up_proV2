import type { AdminEntityKey } from "@/features/assistant/catalog/adminEntities";

/** Requêtes FIND invalides (bruit après « chauffeur … »). */
const INVALID_FIND_QUERY =
  /^(?:sur|de|du|des|la|le|les|un|une|liste|premier|première|1er|1ère|ouvre|ouvrir|montre|affiche|actuel|actuelle)\b/i;

const INVALID_FIND_PHRASES =
  /^(?:sur la|de la|du|des|la liste|liste des|premier|première|sur la liste)/i;

export function isValidEntityFindQuery(query: string): boolean {
  const q = query.trim();
  if (q.length < 2) return false;
  if (INVALID_FIND_QUERY.test(q)) return false;
  if (INVALID_FIND_PHRASES.test(q)) return false;
  if (/^(?:sur|de|la|le|les)\s+\S/i.test(q)) return false;
  return true;
}

export function matchOpenFirstEntityIntent(text: string): AdminEntityKey | null {
  if (!/premier|première|premiere|1er|1ère|1ere|first|top/i.test(text)) {
    return null;
  }
  if (!/ouvr|montre|affiche|va |aller|fiche|detail|détail/i.test(text)) {
    return null;
  }

  if (/chauffeur|driver/i.test(text)) return "drivers";
  if (/véhicule|vehicule|voiture/i.test(text)) return "vehicles";
  if (/partenaire|partner/i.test(text)) return "partners";
  if (/course|trip/i.test(text)) return "trips";
  if (/client/i.test(text)) return "clients";
  if (/franchise/i.test(text)) return "franchises";

  return null;
}
