"use client";

import { Button } from "./Button";

interface BulkActionBarProps {
  count: number;
  onClear: () => void;
  actions?: {
    label: string;
    onClick: () => void;
    variant?: "primary" | "secondary";
    disabled?: boolean;
  }[];
}

export function BulkActionBar({ count, onClear, actions = [] }: BulkActionBarProps) {
  if (count === 0) return null;

  return (
    <div className="sticky bottom-4 z-20 mx-auto flex w-full max-w-2xl flex-col gap-3 rounded-card border border-teal/20 bg-teal/10 px-4 py-3 shadow-card backdrop-blur-sm animate-fade-up sm:bottom-6 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5">
      <span className="text-sm font-medium text-foreground">
        {count} élément{count > 1 ? "s" : ""} sélectionné{count > 1 ? "s" : ""}
      </span>
      <div className="flex flex-wrap items-center gap-2">
        {actions.map((action) => (
          <Button
            key={action.label}
            variant={action.variant ?? "secondary"}
            className="!py-1.5 !text-xs"
            disabled={action.disabled}
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        ))}
        <Button variant="ghost" className="!py-1.5 !text-xs" onClick={onClear}>
          Annuler
        </Button>
      </div>
    </div>
  );
}
