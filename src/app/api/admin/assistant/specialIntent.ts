import type { AssistantPageContext } from "@/features/assistant/lib/assistantPageContext";
import { parseSummaryTarget } from "./summaryIntent";
import { extractDriverNameQuery } from "./driverQueryExtract";

export type SpecialIntentKind =
  | "COMPLIANCE_DRIVER"
  | "COMPLIANCE_VEHICLE"
  | "KYC_MISSING"
  | "WALLET_DRIVER"
  | "WALLET_PARTNER"
  | "PARTNER_REVENUE"
  | "DISPUTE_SUMMARY"
  | "TICKET_SUMMARY"
  | "LIVE_LOCATION"
  | "LIVE_ONLINE"
  | "WORKFLOW_DRIVER";

export interface SpecialIntent {
  kind: SpecialIntentKind;
  query: string;
  driverId?: string;
}

function extractDriverQuery(text: string): string | null {
  return extractDriverNameQuery(text);
}

function extractVehicleQuery(text: string): string | null {
  const plate = text.match(/\b([A-Z]{2}-\d{3,4}-[A-Z]{1,3}-\d{2})\b/i)?.[1];
  if (plate) return plate.toUpperCase();
  const m = text.match(/(?:véhicule|vehicule|voiture|plate)\s+(.+?)(?:\?|$)/i);
  return m?.[1]?.trim().replace(/[?.!]+$/g, "") ?? null;
}

function extractPartnerQuery(text: string): string | null {
  const target = parseSummaryTarget(`résume le partenaire ${text}`);
  if (target?.entity === "partners") return target.query;
  const m = text.match(/(?:partenaire|partner)\s+(.+?)(?:\?|$)/i);
  return m?.[1]?.trim().replace(/[?.!]+$/g, "") ?? null;
}

export function matchSpecialIntent(
  text: string,
  context?: AssistantPageContext
): SpecialIntent | null {
  const t = text.trim();

  if (
    /traiter (?:le )?dossier|workflow.*chauffeur|dossier (?:du )?chauffeur/i.test(t)
  ) {
    const q =
      extractDriverQuery(t) ??
      (context?.entity === "drivers" && context.entityLabel
        ? context.entityLabel
        : "");
    if (q) return { kind: "WORKFLOW_DRIVER", query: q };
  }

  if (
    /(?:peut|peux).*(?:rouler|conduire)|conformit[eé].*chauffeur|pourquoi.*bloqu|est.?il bloqu|qu.?est.ce qui bloque|peut.?il rouler/i.test(
      t
    )
  ) {
    if (context?.entity === "drivers" && context.entityId && !extractDriverQuery(t)) {
      return {
        kind: "COMPLIANCE_DRIVER",
        query: context.entityLabel ?? context.entityId,
        driverId: context.entityId,
      };
    }
    const q = extractDriverQuery(t);
    if (q) return { kind: "COMPLIANCE_DRIVER", query: q };
  }

  if (
    /(?:véhicule|vehicule|voiture).*(?:rouler|valid|conform|bloqu)|pourquoi.*véhicule.*bloqu/i.test(
      t
    )
  ) {
    const q = extractVehicleQuery(t);
    if (q) return { kind: "COMPLIANCE_VEHICLE", query: q };
  }

  if (
    /pi[eè]ces? kyc|documents? kyc|kyc manquant|documents? manquants?|quelles pi[eè]ces/i.test(
      t
    ) &&
    /chauffeur|conducteur|dossier/i.test(t)
  ) {
    const q =
      extractDriverQuery(t) ??
      (context?.entity === "drivers" && context.entityLabel
        ? context.entityLabel
        : null);
    if (q) return { kind: "KYC_MISSING", query: q };
  }

  if (/wallet|solde|portefeuille/i.test(t)) {
    if (context?.entity === "drivers" && context.entityId) {
      return {
        kind: "WALLET_DRIVER",
        query: context.entityLabel ?? context.entityId,
        driverId: context.entityId,
      };
    }
    if (/chauffeur|conducteur/i.test(t)) {
      const q = extractDriverQuery(t);
      if (q) return { kind: "WALLET_DRIVER", query: q };
    }
  }

  if (/wallet|solde|portefeuille/i.test(t) && /partenaire|partner/i.test(t)) {
    const q = extractPartnerQuery(t);
    if (q) return { kind: "WALLET_PARTNER", query: q };
  }

  if (
    /chiffre d.?affaires|ca du partenaire|revenu.*partenaire|combien.*partenaire.*gagn/i.test(
      t
    )
  ) {
    const q = extractPartnerQuery(t);
    if (q) return { kind: "PARTNER_REVENUE", query: q };
  }

  if (/litige|dispute/i.test(t) && /r[eé]sum|synth|situation|d[eé]tail|ouvert/i.test(t)) {
    const ref = t.match(/(?:litige|dispute)\s+(.+?)(?:\?|$)/i)?.[1]?.trim();
    return { kind: "DISPUTE_SUMMARY", query: ref ?? "" };
  }

  if (/ticket/i.test(t) && /r[eé]sum|synth|situation|support|ouvert/i.test(t)) {
    const subj = t.match(/ticket\s+(.+?)(?:\?|$)/i)?.[1]?.trim();
    return { kind: "TICKET_SUMMARY", query: subj ?? "" };
  }

  if (
    /(?:o[uù] est|position|localisation|g[eé]oloc)/i.test(t) &&
    /chauffeur|conducteur/i.test(t)
  ) {
    const q = extractDriverQuery(t);
    if (q) return { kind: "LIVE_LOCATION", query: q };
  }

  if (
    /chauffeurs? en ligne|ops live|carte live|live map|combien.*en ligne/i.test(t)
  ) {
    return { kind: "LIVE_ONLINE", query: "" };
  }

  return null;
}

export function specialIntentToken(intent: SpecialIntent): string {
  const q = encodeURIComponent(intent.query);
  const id = intent.driverId ? `:${intent.driverId}` : "";
  return `__SPECIAL__:${intent.kind}:${q}${id}`;
}

export function parseSpecialIntentToken(message: string): SpecialIntent | null {
  if (!message.startsWith("__SPECIAL__:")) return null;
  const rest = message.slice("__SPECIAL__:".length);
  const [kind, ...parts] = rest.split(":");
  const last = parts[parts.length - 1];
  const maybeId =
    parts.length > 1 && last && /^[0-9a-f-]{8,}$/i.test(last) ? last : undefined;
  const queryParts = maybeId ? parts.slice(0, -1) : parts;
  const query = decodeURIComponent(queryParts.join(":"));
  return {
    kind: kind as SpecialIntentKind,
    query,
    driverId: maybeId,
  };
}
