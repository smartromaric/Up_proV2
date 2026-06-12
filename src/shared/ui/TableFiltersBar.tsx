import type { ReactNode } from "react";
import { Button } from "./Button";
import { SearchInput } from "./SearchInput";

interface TableFiltersBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  totalLabel?: string;
  children?: ReactNode;
  /** Réinitialise recherche + tous les filtres de la page */
  onReset?: () => void;
  /** Affiche le bouton « Réinitialiser » (défaut : true si onReset fourni) */
  hasActiveFilters?: boolean;
  resetLabel?: string;
}

export function TableFiltersBar({
  search,
  onSearchChange,
  searchPlaceholder = "Rechercher…",
  totalLabel,
  children,
  onReset,
  hasActiveFilters = false,
  resetLabel = "Réinitialiser les filtres",
}: TableFiltersBarProps) {
  const showReset = Boolean(onReset) && hasActiveFilters;

  return (
    <div className="mb-4 space-y-3">
      {(children || showReset) && (
        <div className="flex flex-wrap items-end justify-between gap-3">
          {children ? (
            <div className="flex flex-1 flex-wrap items-end gap-3">{children}</div>
          ) : (
            <span />
          )}
          {showReset && (
            <Button
              type="button"
              variant="ghost"
              className="!px-3 !py-2 !text-xs shrink-0 text-teal hover:text-teal-dark"
              onClick={onReset}
            >
              {resetLabel}
            </Button>
          )}
        </div>
      )}
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end sm:gap-3">
        <div className="w-full min-w-0 flex-1 sm:min-w-[200px]">
          <SearchInput
            value={search}
            onChange={onSearchChange}
            placeholder={searchPlaceholder}
          />
        </div>
        {totalLabel && (
          <span className="flex min-h-[42px] items-center text-sm text-muted tabular-nums">
            {totalLabel}
          </span>
        )}
      </div>
    </div>
  );
}
