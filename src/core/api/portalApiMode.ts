import { env } from "@/core/config/env";

/** MSW legacy `/api/v2` pour portails franchise / partenaire. */
export function useLegacyPortalApi(): boolean {
  return env.useMocks && !env.useRealAuth;
}
