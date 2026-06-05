import { env } from "@/core/config/env";

/** MSW legacy `/api/v2` tant que l’auth réelle n’est pas activée. */
export function useLegacyAdminApi(): boolean {
  return env.useMocks && !env.useRealAuth;
}
