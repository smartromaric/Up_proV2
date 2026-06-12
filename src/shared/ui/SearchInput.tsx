import { FILTER_CONTROL_CLASS } from "./filterControlStyles";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Rechercher…",
  className = "",
}: SearchInputProps) {
  return (
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`${FILTER_CONTROL_CLASS} w-full max-w-xs md:max-w-sm ${className}`}
    />
  );
}
