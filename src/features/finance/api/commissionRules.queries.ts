"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ApiCommissionRuleUpsertBody } from "./commissionRules.api.types";
import { commissionRulesKeys } from "./commissionRules.keys";
import { commissionRulesService } from "./commissionRules.service";

export function useCommissionRulesList() {
  return useQuery({
    queryKey: commissionRulesKeys.list(),
    queryFn: () => commissionRulesService.list(),
  });
}

export function useSaveCommissionRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string | null;
      body: ApiCommissionRuleUpsertBody;
    }) => commissionRulesService.saveWithNotify(id, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: commissionRulesKeys.all });
    },
  });
}
