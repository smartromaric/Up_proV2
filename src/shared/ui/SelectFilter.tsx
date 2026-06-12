interface SelectFilterOption<T extends string> {
  value: T;
  label: string;
}

interface SelectFilterProps<T extends string> {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: SelectFilterOption<T>[];
  /** Sélecteur plus large pour les libellés longs (ex. filtres chauffeurs). */
  wide?: boolean;
  className?: string;
}

export function SelectFilter<T extends string>({
  label,
  value,
  onChange,
  options,
  wide = false,
  className = "",
}: SelectFilterProps<T>) {
  const selectWidth = wide
    ? "w-full min-w-0 sm:min-w-[12.5rem] md:min-w-[14rem]"
    : "w-full min-w-0 sm:min-w-[140px]";

  return (
    <label className={`flex w-full min-w-0 flex-col gap-1 sm:w-auto ${className}`}>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className={`${selectWidth} max-w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2`}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
