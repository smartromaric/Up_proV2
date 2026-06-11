export const commissionRulesKeys = {
  all: ["finance", "commission-rules"] as const,
  list: () => [...commissionRulesKeys.all, "list"] as const,
  partner: (partnerId: string, franchiseId: string) =>
    [...commissionRulesKeys.all, "partner", partnerId, franchiseId] as const,
};
