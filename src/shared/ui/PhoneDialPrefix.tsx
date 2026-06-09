import { CountryFlag } from "./CountryFlag";

interface PhoneDialPrefixProps {
  dialCode: string;
  flagUrl?: string | null;
  /** Code ISO (ex. CI) — fallback URL drapeau si `flagUrl` absent. */
  countryCode?: string;
}

export function PhoneDialPrefix({
  dialCode,
  flagUrl,
  countryCode,
}: PhoneDialPrefixProps) {
  return (
    <div className="flex min-w-[6.75rem] shrink-0 items-center justify-center gap-1.5 border-r border-border bg-canvas px-2.5 text-sm font-medium text-foreground">
      <CountryFlag flagUrl={flagUrl} countryCode={countryCode} size={20} />
      <span>{dialCode}</span>
    </div>
  );
}
