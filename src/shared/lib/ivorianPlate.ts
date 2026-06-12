export type IvorianPlateVariant = "siv" | "legacy";

const SIV_PATTERN = /^([A-Z]{2})[\s.-]?(\d{1,4})[\s.-]?([A-Z]{2})$/i;
const LEGACY_PATTERN = /^(\d{1,4})[\s.-]?([A-Z]{1,3}\d{0,2})$/i;

export interface ParsedSivPlate {
  variant: "siv";
  letters1: string;
  numbers: string;
  letters2: string;
  display: string;
}

export interface ParsedLegacyPlate {
  variant: "legacy";
  numbers: string;
  letters: string;
  display: string;
}

export type ParsedIvorianPlate = ParsedSivPlate | ParsedLegacyPlate;

export function normalizePlateRaw(plate: string): string {
  return plate.trim().replace(/\s+/g, " ").toUpperCase();
}

export function getPlateVariant(plate: string): IvorianPlateVariant {
  const compact = plate.replace(/[\s.-]/g, "").toUpperCase();
  return compact.startsWith("AA") ? "siv" : "legacy";
}

export function parseIvorianPlate(plate: string): ParsedIvorianPlate | null {
  const raw = normalizePlateRaw(plate);
  if (!raw) return null;

  const variant = getPlateVariant(raw);

  if (variant === "siv") {
    const compact = raw.replace(/[\s.-]/g, "");
    const match = compact.match(/^([A-Z]{2})(\d{1,4})([A-Z]{2})$/i);
    if (match) {
      const [, l1, num, l2] = match;
      return {
        variant: "siv",
        letters1: l1.toUpperCase(),
        numbers: num,
        letters2: l2.toUpperCase(),
        display: `${l1.toUpperCase()}-${num}-${l2.toUpperCase()}`,
      };
    }
    const loose = raw.match(SIV_PATTERN);
    if (loose) {
      const [, l1, num, l2] = loose;
      return {
        variant: "siv",
        letters1: l1.toUpperCase(),
        numbers: num,
        letters2: l2.toUpperCase(),
        display: `${l1.toUpperCase()}-${num}-${l2.toUpperCase()}`,
      };
    }
  }

  const legacyMatch = raw.match(LEGACY_PATTERN);
  if (legacyMatch) {
    const [, num, letters] = legacyMatch;
    return {
      variant: "legacy",
      numbers: num,
      letters: letters.toUpperCase(),
      display: `${num} ${letters.toUpperCase()}`,
    };
  }

  return null;
}
