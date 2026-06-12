/** Presets de plage de dates pour les listes et tableaux. */
export type DateRangePreset = "all" | "today" | "yesterday" | "3d" | "7d" | "custom";

export interface DateRangeValue {
  from: string;
  to: string;
}

/** Date locale au format YYYY-MM-DD (évite le décalage UTC). */
export function toLocalISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** Calcule la plage inclusive pour un preset donné. */
export function presetToDateRange(
  preset: DateRangePreset,
  customFrom = "",
  customTo = ""
): DateRangeValue | null {
  if (preset === "all") return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (preset === "custom") {
    const from = customFrom.trim();
    const to = customTo.trim();
    if (!from && !to) return null;
    return { from: from || to, to: to || from };
  }

  const to = toLocalISODate(today);

  switch (preset) {
    case "today":
      return { from: to, to };
    case "yesterday": {
      const yesterday = addDays(today, -1);
      const from = toLocalISODate(yesterday);
      return { from, to: from };
    }
    case "3d":
      return { from: toLocalISODate(addDays(today, -2)), to };
    case "7d":
      return { from: toLocalISODate(addDays(today, -6)), to };
    default:
      return null;
  }
}

export function formatDateRangeLabel(from: string, to: string): string {
  const fmt = new Intl.DateTimeFormat("fr-CI", { dateStyle: "medium" });
  const fromDate = new Date(`${from}T12:00:00`);
  const toDate = new Date(`${to}T12:00:00`);
  if (from === to) return fmt.format(fromDate);
  return `${fmt.format(fromDate)} → ${fmt.format(toDate)}`;
}

export const DATE_RANGE_PRESET_LABELS: Record<
  Exclude<DateRangePreset, "custom">,
  string
> = {
  all: "Tout",
  today: "Aujourd'hui",
  yesterday: "Hier",
  "3d": "3 jours",
  "7d": "7 jours",
};
