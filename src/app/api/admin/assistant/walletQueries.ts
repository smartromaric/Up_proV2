import { LINKS } from "@/core/api/links";
import type { AssistantApiResponse } from "@/features/assistant/types";
import { assistantApiGet, record, str } from "./assistantApiClient";
import { searchEntityMatches, getItemId, getItemLabel } from "./entityResolver";

export async function buildDriverWalletReport(
  query: string,
  authHeader: string,
  driverId?: string
): Promise<AssistantApiResponse> {
  let id = driverId;
  let label = query;

  if (!id) {
    const matches = await searchEntityMatches("drivers", query, authHeader);
    if (!matches.length) {
      return { message: `Chauffeur introuvable : « ${query} ».`, action: null };
    }
    id = getItemId(matches[0]!);
    label = getItemLabel("drivers", matches[0]!);
  }

  const wallet = await assistantApiGet<Record<string, unknown>>(
    LINKS.v1.drivers.wallet(id),
    authHeader
  );
  const w = record(wallet?.wallet) ?? wallet;
  const balance =
    w?.balanceCachedXof ??
    w?.availableXof ??
    w?.available_xof ??
    w?.balance_cached_xof;

  const ledger = await assistantApiGet<{ items?: Record<string, unknown>[] }>(
    `${LINKS.v1.drivers.ledger(id)}?per_page=5&page=1`,
    authHeader
  );
  const moves = (ledger?.items ?? []).slice(0, 5).map((m) => {
    const amt = Number(m.amount_xof ?? m.amountXof ?? m.amount_fcfa ?? 0);
    return `• ${str(m.label ?? m.type)} : ${amt.toLocaleString("fr-FR")} FCFA`;
  });

  return {
    message: [
      `Wallet chauffeur — ${label}`,
      balance != null
        ? `Solde disponible : ${Number(balance).toLocaleString("fr-FR")} FCFA`
        : "Solde : non disponible via API",
      moves.length ? `\nDerniers mouvements :\n${moves.join("\n")}` : "",
    ].join("\n"),
    action: { type: "OPEN_ENTITY", entity: "drivers", id },
  };
}

export async function buildPartnerWalletReport(
  query: string,
  authHeader: string
): Promise<AssistantApiResponse> {
  const matches = await searchEntityMatches("partners", query, authHeader);
  if (!matches.length) {
    return { message: `Partenaire introuvable : « ${query} ».`, action: null };
  }
  const id = getItemId(matches[0]!);
  const label = getItemLabel("partners", matches[0]!);

  const wallet = await assistantApiGet<Record<string, unknown>>(
    LINKS.v1.partners.wallet(id),
    authHeader
  );
  const w = record(wallet?.wallet) ?? wallet;
  const balance = w?.balanceCachedXof ?? w?.availableXof ?? w?.available_xof;
  const pending = w?.pendingWithdrawalXof ?? w?.pending_withdrawal_xof;

  return {
    message: [
      `Wallet partenaire — ${label}`,
      balance != null
        ? `Solde : ${Number(balance).toLocaleString("fr-FR")} FCFA`
        : "Solde : non disponible",
      pending != null
        ? `Retraits en attente : ${Number(pending).toLocaleString("fr-FR")} FCFA`
        : "",
      "",
      "Recharges chauffeurs : Finance → Recharges ou via l'assistant (« recharge 5000 F au chauffeur X »).",
    ].join("\n"),
    action: { type: "OPEN_ENTITY", entity: "partners", id },
  };
}

export async function buildPartnerRevenueReport(
  query: string,
  authHeader: string
): Promise<AssistantApiResponse> {
  const matches = await searchEntityMatches("partners", query, authHeader);
  if (!matches.length) {
    return { message: `Partenaire introuvable : « ${query} ».`, action: null };
  }
  const id = getItemId(matches[0]!);
  const label = getItemLabel("partners", matches[0]!);

  const orders = await assistantApiGet<{
    rides?: Record<string, unknown>[];
    deliveries?: Record<string, unknown>[];
  }>(`${LINKS.admin.v1.orders}?partner_id=${encodeURIComponent(id)}&per_page=100&page=1`, authHeader);

  const all = [...(orders?.rides ?? []), ...(orders?.deliveries ?? [])];
  let revenue = 0;
  let completed = 0;
  for (const o of all) {
    const status = str(o.status).toLowerCase();
    if (status.includes("complete") || status === "completed") {
      completed += 1;
      revenue += Number(o.final_price_xof ?? o.estimated_price_xof ?? o.amount_xof ?? 0);
    }
  }

  const detail = await assistantApiGet<Record<string, unknown>>(
    LINKS.admin.partners.getById(id),
    authHeader
  );
  const stats =
    record(record(detail?.partner)?.stats) ??
    record(detail?.stats) ??
    record(detail?.partner);
  const driversCount = Number(stats?.driversCount ?? matches[0]!.driversCount ?? 0);

  return {
    message: [
      `Chiffre d'affaires — ${label}`,
      `Courses terminées (échantillon 100 récentes) : ${completed}`,
      `CA estimé sur cet échantillon : ${revenue.toLocaleString("fr-FR")} FCFA`,
      driversCount ? `Chauffeurs rattachés : ${driversCount}` : "",
      "",
      "Pour le CA exact du mois, consultez la fiche partenaire (onglet activité).",
    ]
      .filter(Boolean)
      .join("\n"),
    action: { type: "OPEN_ENTITY", entity: "partners", id },
  };
}
