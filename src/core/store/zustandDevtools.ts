/** Active Redux DevTools en local uniquement (voir README / extension Chrome). */
export const isZustandDevtoolsEnabled =
  process.env.NODE_ENV === "development";

export const zustandDevtoolsOptions = {
  enabled: isZustandDevtoolsEnabled,
} as const;
