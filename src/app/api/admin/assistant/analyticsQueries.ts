import { buildV1ListQuery } from "@/core/api/v1Pagination";
import { LINKS } from "@/core/api/links";
import type { AssistantApiResponse } from "@/features/assistant/types";

const API_ORIGIN = (
  process.env.NEXT_PUBLIC_API_URL ?? "https://api.upjunoo-dev.tech"
).replace(/\/$/, "");

async function apiGet<T>(path: string, authHeader: string): Promise<T | null> {
  const response = await fetch(`${API_ORIGIN}${path}`, {
    headers: {
      Accept: "application/json",
      Authorization: authHeader,
      "X-Client-Type": "back-office",
    },
  });
  if (!response.ok) return null;
  return response.json() as Promise<T>;
}

function partnerName(p: Record<string, unknown>): string {
  return String(p.trade_name ?? p.tradeName ?? p.name ?? p.legal_name ?? "Partenaire");
}

export async function buildPartnerPerformanceRanking(
  authHeader: string
): Promise<AssistantApiResponse> {
  const data = await apiGet<{ items?: Record<string, unknown>[] }>(
    `${LINKS.admin.v1.partners}${buildV1ListQuery({ per_page: 100, page: 1 })}`,
    authHeader
  );

  const items = data?.items ?? [];
  if (!items.length) {
    return {
      message: "Aucun partenaire trouvé pour établir un classement.",
      action: null,
    };
  }

  const ranked = items
    .map((p) => ({
      id: String(p.id ?? ""),
      name: partnerName(p),
      city: String(p.cityLabel ?? p.city ?? "—"),
      drivers: Number(p.driversCount ?? 0),
      status: String(p.status ?? "—"),
    }))
    .sort((a, b) => b.drivers - a.drivers);

  const top = ranked[0]!;
  const lines = ranked.slice(0, 5).map(
    (p, i) =>
      `${i + 1}. ${p.name} — ${p.drivers} chauffeur(s), ville ${p.city}, statut ${p.status}`
  );

  return {
    message: [
      `Partenaire le plus fourni en chauffeurs : ${top.name} (${top.drivers} chauffeur(s)).`,
      "",
      "Top 5 (critère : nombre de chauffeurs — proxy de taille d'activité) :",
      ...lines,
      "",
      "Pour le chiffre d'affaires exact, ouvrez la fiche partenaire (courses + wallet).",
    ].join("\n"),
    action: top.id
      ? { type: "OPEN_ENTITY", entity: "partners", id: top.id }
      : { type: "LIST_ENTITY", entity: "partners" },
  };
}

export async function buildDriverPerformanceRanking(
  authHeader: string
): Promise<AssistantApiResponse> {
  const data = await apiGet<{ items?: Record<string, unknown>[] }>(
    `${LINKS.admin.v1.drivers}${buildV1ListQuery({ per_page: 100, page: 1 })}`,
    authHeader
  );

  const items = data?.items ?? [];
  if (!items.length) {
    return { message: "Aucun chauffeur trouvé.", action: null };
  }

  const ranked = items
    .map((d) => {
      const profile = d.profile as Record<string, unknown> | undefined;
      const name =
        (profile?.displayName as string) ??
        [d.firstName, d.lastName].filter(Boolean).join(" ") ??
        String(d.driver_code ?? "Chauffeur");
      return {
        id: String(d.id ?? ""),
        name,
        orders: Number(d.total_completed_orders ?? 0),
        rating: d.rating_avg != null ? Number(d.rating_avg) : null,
        availability: String(d.availability ?? d.availability_status ?? "—"),
      };
    })
    .sort((a, b) => b.orders - a.orders || (b.rating ?? 0) - (a.rating ?? 0));

  const top = ranked[0]!;
  const lines = ranked.slice(0, 5).map((d, i) => {
    const rating = d.rating != null ? `, note ${d.rating.toFixed(1)}` : "";
    return `${i + 1}. ${d.name} — ${d.orders} course(s) terminée(s)${rating}, ${d.availability}`;
  });

  return {
    message: [
      `Chauffeur le plus actif (courses terminées) : ${top.name} (${top.orders} course(s)).`,
      "",
      "Top 5 :",
      ...lines,
    ].join("\n"),
    action: top.id
      ? { type: "OPEN_ENTITY", entity: "drivers", id: top.id }
      : { type: "LIST_ENTITY", entity: "drivers" },
  };
}

export async function buildPartnerRevenueRanking(
  authHeader: string
): Promise<AssistantApiResponse> {
  const [partnersData, ordersData] = await Promise.all([
    apiGet<{ items?: Record<string, unknown>[] }>(
      `${LINKS.admin.v1.partners}${buildV1ListQuery({ per_page: 50, page: 1 })}`,
      authHeader
    ),
    apiGet<{
      rides?: Record<string, unknown>[];
      deliveries?: Record<string, unknown>[];
    }>(
      `${LINKS.admin.v1.orders}${buildV1ListQuery({ per_page: 200, page: 1 })}`,
      authHeader
    ),
  ]);

  const partners = partnersData?.items ?? [];
  const orders = [
    ...(ordersData?.rides ?? []),
    ...(ordersData?.deliveries ?? []),
  ];

  const revenueByPartner = new Map<string, number>();
  const completedByPartner = new Map<string, number>();

  for (const o of orders) {
    const status = String(o.status ?? "").toLowerCase();
    if (!status.includes("complete") && status !== "completed") continue;
    const pid = String(o.partner_id ?? o.partnerId ?? "");
    if (!pid) continue;
    const amount = Number(
      o.final_price_xof ?? o.estimated_price_xof ?? o.amount_xof ?? 0
    );
    revenueByPartner.set(pid, (revenueByPartner.get(pid) ?? 0) + amount);
    completedByPartner.set(pid, (completedByPartner.get(pid) ?? 0) + 1);
  }

  const ranked = partners
    .map((p) => {
      const id = String(p.id ?? "");
      return {
        id,
        name: partnerName(p),
        revenue: revenueByPartner.get(id) ?? 0,
        completed: completedByPartner.get(id) ?? 0,
        drivers: Number(p.driversCount ?? 0),
      };
    })
    .filter((p) => p.revenue > 0 || p.completed > 0)
    .sort((a, b) => b.revenue - a.revenue || b.completed - a.completed);

  if (!ranked.length) {
    return buildPartnerPerformanceRanking(authHeader);
  }

  const top = ranked[0]!;
  const lines = ranked.slice(0, 5).map(
    (p, i) =>
      `${i + 1}. ${p.name} — ${p.revenue.toLocaleString("fr-FR")} FCFA (${p.completed} course(s))`
  );

  return {
    message: [
      `Partenaire avec le plus de CA (échantillon récent) : ${top.name} (${top.revenue.toLocaleString("fr-FR")} FCFA).`,
      "",
      "Top 5 par chiffre d'affaires :",
      ...lines,
    ].join("\n"),
    action: top.id
      ? { type: "OPEN_ENTITY", entity: "partners", id: top.id }
      : { type: "LIST_ENTITY", entity: "partners" },
  };
}

export async function resolveAnalyticsQuery(
  kind: string,
  authHeader: string
): Promise<AssistantApiResponse> {
  switch (kind) {
    case "partner_performance":
      return buildPartnerPerformanceRanking(authHeader);
    case "partner_revenue":
      return buildPartnerRevenueRanking(authHeader);
    case "driver_performance":
      return buildDriverPerformanceRanking(authHeader);
    default:
      return {
        message: "Analyse non disponible pour cette question.",
        action: null,
      };
  }
}
