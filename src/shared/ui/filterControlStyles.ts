/** Styles partagés pour labels, champs et barres de filtres. */

export const FILTER_LABEL_CLASS =
  "mb-0 block text-[10px] font-semibold uppercase tracking-wider text-muted";

export const FILTER_FIELD_CLASS =
  "flex w-full min-w-0 flex-col gap-1.5 sm:w-auto";

export const FILTER_CONTROL_CLASS =
  "min-h-[42px] rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none ring-teal/30 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60";

export const FILTER_SELECT_CLASS = `${FILTER_CONTROL_CLASS} w-full max-w-full`;

export const FILTER_CHIP_CLASS =
  "inline-flex min-h-[42px] items-center rounded-lg px-3 text-xs font-medium transition-colors duration-150";

export const FILTER_TOOLBAR_GAP = "gap-3";
