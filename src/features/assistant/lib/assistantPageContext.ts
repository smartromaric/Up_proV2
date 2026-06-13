import type { AdminEntityKey } from "@/features/assistant/catalog/adminEntities";

export interface AssistantPageContext {
  pathname: string;
  entity?: AdminEntityKey;
  entityId?: string;
  entityLabel?: string;
  /** Page liste (sans id) — ex. /admin/fleet/drivers */
  isListPage?: boolean;
}

const DETAIL_PATTERNS: Array<{
  pattern: RegExp;
  entity: AdminEntityKey;
}> = [
  { pattern: /^\/admin\/fleet\/drivers\/([^/]+)$/, entity: "drivers" },
  { pattern: /^\/admin\/fleet\/vehicles\/([^/]+)$/, entity: "vehicles" },
  { pattern: /^\/admin\/fleet\/clients\/([^/]+)$/, entity: "clients" },
  { pattern: /^\/admin\/ops\/trips\/([^/]+)$/, entity: "trips" },
  { pattern: /^\/admin\/network\/partners\/([^/]+)$/, entity: "partners" },
  { pattern: /^\/admin\/network\/franchises\/([^/]+)$/, entity: "franchises" },
  { pattern: /^\/admin\/network\/zones\/([^/]+)$/, entity: "zones" },
  { pattern: /^\/admin\/ops\/sos\/incidents\/([^/]+)$/, entity: "sos-incidents" },
  { pattern: /^\/admin\/finance\/transactions\/([^/]+)$/, entity: "transactions" },
  { pattern: /^\/admin\/finance\/withdrawals\/([^/]+)$/, entity: "withdrawals" },
];

const LIST_PATTERNS: Array<{
  pattern: RegExp;
  entity: AdminEntityKey;
}> = [
  { pattern: /^\/admin\/fleet\/drivers\/?$/, entity: "drivers" },
  { pattern: /^\/admin\/fleet\/vehicles\/?$/, entity: "vehicles" },
  { pattern: /^\/admin\/fleet\/clients\/?$/, entity: "clients" },
  { pattern: /^\/admin\/ops\/trips\/?$/, entity: "trips" },
  { pattern: /^\/admin\/network\/partners\/?$/, entity: "partners" },
  { pattern: /^\/admin\/network\/franchises\/?$/, entity: "franchises" },
];

export function buildAssistantPageContext(pathname: string): AssistantPageContext {
  const path = pathname.split("?")[0] ?? pathname;

  for (const { pattern, entity } of DETAIL_PATTERNS) {
    const m = path.match(pattern);
    if (m?.[1] && m[1] !== "new") {
      return { pathname: path, entity, entityId: m[1], isListPage: false };
    }
  }

  for (const { pattern, entity } of LIST_PATTERNS) {
    if (pattern.test(path)) {
      return { pathname: path, entity, isListPage: true };
    }
  }

  return { pathname: path };
}
