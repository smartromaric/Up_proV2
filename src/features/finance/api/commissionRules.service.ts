import { apiClient } from "@/core/http/apiClient";
import { notificationService } from "@/core/http/notificationService";
import { LINKS } from "@/core/api/links";
import type {
  ApiCommissionRuleMutationResponse,
  ApiCommissionRuleUpsertBody,
  ApiCommissionRulesListResponse,
} from "./commissionRules.api.types";
import {
  mapApiCommissionRule,
  type CommissionRule,
} from "./commissionRules.mapper";

export const commissionRulesService = {
  list: async (): Promise<CommissionRule[]> => {
    const response = await apiClient.get<ApiCommissionRulesListResponse>(
      LINKS.admin.v1.commissionRules
    );
    return (response.items ?? []).map(mapApiCommissionRule);
  },

  create: async (body: ApiCommissionRuleUpsertBody): Promise<CommissionRule> => {
    const response = await apiClient.post<ApiCommissionRuleMutationResponse>(
      LINKS.admin.v1.commissionRules,
      body
    );
    const raw = response.rule ?? response.item;
    if (!raw) throw new Error("COMMISSION_RULE_CREATE_FAILED");
    return mapApiCommissionRule(raw);
  },

  update: async (
    id: string,
    body: ApiCommissionRuleUpsertBody
  ): Promise<CommissionRule> => {
    const response = await apiClient.patch<ApiCommissionRuleMutationResponse>(
      LINKS.admin.v1.commissionRuleById(id),
      body
    );
    const raw = response.rule ?? response.item;
    if (!raw) throw new Error("COMMISSION_RULE_UPDATE_FAILED");
    return mapApiCommissionRule(raw);
  },

  saveWithNotify: async (
    id: string | null,
    body: ApiCommissionRuleUpsertBody
  ): Promise<CommissionRule> => {
    const response = id
      ? await apiClient.patch<ApiCommissionRuleMutationResponse>(
          LINKS.admin.v1.commissionRuleById(id),
          body
        )
      : await apiClient.post<ApiCommissionRuleMutationResponse>(
          LINKS.admin.v1.commissionRules,
          body
        );

    notificationService.success(
      id ? "Règle commission enregistrée" : "Règle commission créée"
    );

    const raw = response.rule ?? response.item;
    if (!raw) throw new Error("COMMISSION_RULE_SAVE_FAILED");
    return mapApiCommissionRule(raw);
  },
};
