export const COMMISSION_SERVICE_TYPES = [
  { value: "RIDE", label: "Taxi" },
  { value: "DELIVERY", label: "Livraison" },
  { value: "DELIVERY_CARGO", label: "Livraison cargo" },
  { value: "RENTAL", label: "Location" },
  { value: "FREIGHT", label: "Fret" },
] as const;

export const COMMISSION_SERVICE_TYPE_LABELS: Record<string, string> =
  Object.fromEntries(
    COMMISSION_SERVICE_TYPES.map((item) => [item.value, item.label])
  );

export const COMMISSION_BASIS_OPTIONS = [
  { value: "FINAL_PRICE", label: "Prix final" },
  { value: "GROSS_AMOUNT", label: "Montant brut" },
] as const;

export const COMMISSION_SCOPE_OPTIONS = [
  { value: "global", label: "Globale" },
  { value: "franchise", label: "Franchise" },
  { value: "partner", label: "Partenaire" },
] as const;

export type CommissionRuleScopeKind =
  (typeof COMMISSION_SCOPE_OPTIONS)[number]["value"];
