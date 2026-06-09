export function formatFCFA(amount: number): string {
  return (
    new Intl.NumberFormat("fr-CI", {
      style: "decimal",
      maximumFractionDigits: 0,
    }).format(amount) + " FCFA"
  );
}

export function formatPercent(value: number, signed = true): string {
  const prefix = signed && value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(1)} %`;
}

export function formatDateTime(
  iso: string | null | undefined,
  fallback = "—"
): string {
  const raw = iso?.trim();
  if (!raw) return fallback;

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return fallback;

  return new Intl.DateTimeFormat("fr-CI", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}
