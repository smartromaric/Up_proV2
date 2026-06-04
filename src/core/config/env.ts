export const env = {
  /** Base API sans suffixe version (ex. https://api.upjunoo-dev.tech) */
  apiUrl:
    process.env.NEXT_PUBLIC_API_URL ?? "https://api.upjunoo-dev.tech",
  useMocks: process.env.NEXT_PUBLIC_USE_MOCKS === "true",
  /** Auth Supabase /v1 — activé si true ou si les mocks sont désactivés */
  useRealAuth:
    process.env.NEXT_PUBLIC_USE_REAL_AUTH === "true" ||
    process.env.NEXT_PUBLIC_USE_MOCKS !== "true",
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? "UpJunoo Pro",
  /** Token public Mapbox (pk.) — carte live */
  mapboxToken: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? "",
} as const;
