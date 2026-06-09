interface CountryFlagProps {
  flagUrl?: string | null;
  /** Code ISO (ex. CI) — fallback URL drapeau si `flagUrl` absent. */
  countryCode?: string;
  size?: number;
  className?: string;
}

export function resolveCountryFlagUrl(
  flagUrl?: string | null,
  countryCode?: string
): string | null {
  if (flagUrl?.trim()) return flagUrl.trim();
  if (countryCode?.trim()) {
    return `https://hatscripts.github.io/circle-flags/flags/${countryCode.trim().toLowerCase()}.svg`;
  }
  return null;
}

export function CountryFlag({
  flagUrl,
  countryCode,
  size = 20,
  className = "",
}: CountryFlagProps) {
  const src = resolveCountryFlagUrl(flagUrl, countryCode);
  if (!src) return null;

  return (
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      className={`shrink-0 rounded-full object-cover ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
