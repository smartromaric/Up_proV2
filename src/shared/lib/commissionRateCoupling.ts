/** Arrondi taux décimal (4 décimales). */
export function roundCommissionRate(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}

/** Pool franchise + partenaire (inchangé quand on ajuste la répartition). */
export function partnerFranchisePool(
  franchiseRate: number,
  partnerRate: number
): number {
  return roundCommissionRate(franchiseRate + partnerRate);
}

/** Taux franchise dérivé quand le taux partenaire change (pool constant). */
export function coupledFranchiseRate(pool: number, partnerRate: number): number {
  return roundCommissionRate(Math.max(0, pool - partnerRate));
}

/** Taux partenaire dérivé quand le taux franchise change (pool constant). */
export function coupledPartnerRate(pool: number, franchiseRate: number): number {
  return roundCommissionRate(Math.max(0, pool - franchiseRate));
}

export function formatRatePercent(rate: number): string {
  return `${(rate * 100).toFixed(2).replace(/\.?0+$/, "")} %`;
}

export function parseRatePercentInput(raw: string): number | null {
  const cleaned = raw.replace("%", "").replace(",", ".").trim();
  if (!cleaned) return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return null;
  return roundCommissionRate(n / 100);
}

export function validatePartnerRateInPool(
  pool: number,
  partnerRate: number
): string | null {
  if (partnerRate < 0) return "Le taux partenaire ne peut pas être négatif.";
  if (partnerRate > pool + 0.0001) {
    return `Le taux partenaire ne peut pas dépasser ${formatRatePercent(pool)} (pool franchise + partenaire).`;
  }
  return null;
}

export function validateFranchiseRateInPool(
  pool: number,
  franchiseRate: number
): string | null {
  if (franchiseRate < 0) return "Le taux franchise ne peut pas être négatif.";
  if (franchiseRate > pool + 0.0001) {
    return `Le taux franchise ne peut pas dépasser ${formatRatePercent(pool)} (pool franchise + partenaire).`;
  }
  return null;
}

export function validatePoolSplit(
  pool: number,
  franchiseRate: number,
  partnerRate: number
): string | null {
  return (
    validatePartnerRateInPool(pool, partnerRate) ??
    validateFranchiseRateInPool(pool, franchiseRate) ??
    (Math.abs(franchiseRate + partnerRate - pool) > 0.0002
      ? "La somme franchise + partenaire doit rester égale au pool."
      : null)
  );
}
