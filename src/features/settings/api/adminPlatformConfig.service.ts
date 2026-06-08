import { apiClient } from "@/core/http/apiClient";
import { LINKS } from "@/core/api/links";
import { env } from "@/core/config/env";
import type {
  ApiPaydunyaConfigResponse,
  ApiPaymentsReconcileBatchResponse,
  ApiWeatherConfigResponse,
  ApiWeatherRefreshResponse,
  PaydunyaConfigDocument,
  WeatherConfigDocument,
} from "./adminPlatformConfig.api.types";

export function isLegacyPlatformSettings(): boolean {
  return env.useMocks && !env.useRealAuth;
}

export const adminPlatformConfigService = {
  getPaydunya: () =>
    apiClient.get<ApiPaydunyaConfigResponse>(LINKS.admin.v1.paydunyaConfig),

  updatePaydunya: (document: PaydunyaConfigDocument) =>
    apiClient.put<ApiPaydunyaConfigResponse>(LINKS.admin.v1.paydunyaConfig, {
      document,
    }),

  getWeather: () =>
    apiClient.get<ApiWeatherConfigResponse>(LINKS.admin.v1.weatherConfig),

  updateWeather: (document: WeatherConfigDocument) =>
    apiClient.put<ApiWeatherConfigResponse>(LINKS.admin.v1.weatherConfig, {
      document,
    }),

  refreshWeather: () =>
    apiClient.post<ApiWeatherRefreshResponse>(LINKS.admin.v1.weatherRefresh, {}),

  reconcilePaymentsBatch: () =>
    apiClient.post<ApiPaymentsReconcileBatchResponse>(
      LINKS.admin.v1.paymentsReconcileBatch,
      {}
    ),
};
