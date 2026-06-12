import type { ReactNode } from "react";
import { FILTER_FIELD_CLASS, FILTER_LABEL_CLASS } from "./filterControlStyles";

interface FilterFieldProps {
  label: string;
  children: ReactNode;
  className?: string;
  htmlFor?: string;
}

/** Bloc label + contrôle aligné avec les autres filtres (SelectFilter, etc.). */
export function FilterField({
  label,
  children,
  className = "",
  htmlFor,
}: FilterFieldProps) {
  return (
    <div className={`${FILTER_FIELD_CLASS} ${className}`}>
      <span className={FILTER_LABEL_CLASS} id={htmlFor ? `${htmlFor}-label` : undefined}>
        {label}
      </span>
      {children}
    </div>
  );
}
