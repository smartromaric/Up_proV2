/** Identifiant de périmètre : mock numérique ou UUID API v1. */
export type ScopeId = number | string;

export function parseScopeId(value: string): ScopeId | null {
  if (!value) return null;
  if (/^\d+$/.test(value)) return Number(value);
  return value;
}
