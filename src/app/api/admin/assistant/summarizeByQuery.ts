import type { AdminEntityKey } from "@/features/assistant/catalog/adminEntities";
import type { AssistantApiResponse } from "@/features/assistant/types";
import { getEntityDef } from "@/features/assistant/catalog/adminEntities";
import {
  fetchDriverComplianceHints,
  summarizeEntityById,
} from "./pageContextFetcher";
import { getItemId, getItemLabel, searchEntityMatches } from "./entityResolver";

export async function resolveSummarizeByQuery(
  entity: AdminEntityKey,
  query: string,
  authHeader: string
): Promise<AssistantApiResponse> {
  const def = getEntityDef(entity);
  const q = query.trim();
  const matches = await searchEntityMatches(entity, q, authHeader);

  if (matches.length === 0) {
    return {
      message: `Aucun ${def.label} trouvé pour « ${q} ».`,
      action: { type: "LIST_ENTITY", entity },
    };
  }

  if (matches.length > 1) {
    const summary = await summarizeEntityById(entity, getItemId(matches[0]!), authHeader);
    const others = matches
      .slice(0, 5)
      .map((m) => `• ${getItemLabel(entity, m)}`)
      .join("\n");
    return {
      message: summary
        ? `${matches.length} ${def.labelPlural} correspondent à « ${q} ». Voici le plus probable :\n\n${summary}\n\nAutres candidats :\n${others}`
        : `${matches.length} ${def.labelPlural} correspondent — précisez le nom ou le téléphone.`,
      action: { type: "OPEN_ENTITY", entity, id: getItemId(matches[0]!) },
      candidates: matches.slice(0, 5).map((item) => ({
        id: getItemId(item),
        label: getItemLabel(entity, item),
        kind: entity,
      })),
    };
  }

  const id = getItemId(matches[0]!);
  const label = getItemLabel(entity, matches[0]!);
  const summary = await summarizeEntityById(entity, id, authHeader);
  const hints =
    entity === "drivers" ? await fetchDriverComplianceHints(id, authHeader) : [];
  const hintBlock =
    hints.length > 0
      ? `\n\nPoints d'attention :\n${hints.map((h) => `• ${h}`).join("\n")}`
      : "";

  return {
    message: summary
      ? `${def.label.charAt(0).toUpperCase() + def.label.slice(1)} : ${label}\n\n${summary}${hintBlock}`
      : `Fiche trouvée (${label}) mais détail indisponible.`,
    action: { type: "OPEN_ENTITY", entity, id },
  };
}
