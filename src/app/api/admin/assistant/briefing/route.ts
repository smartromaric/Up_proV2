import { NextRequest, NextResponse } from "next/server";
import { LINKS } from "@/core/api/links";

const API_ORIGIN = (
  process.env.NEXT_PUBLIC_API_URL ?? "https://api.upjunoo-dev.tech"
).replace(/\/$/, "");

export interface AssistantBriefingAlert {
  severity: "info" | "warning" | "critical";
  label: string;
  count?: number;
  href: string;
}

export interface AssistantBriefingResponse {
  greeting: string;
  alerts: AssistantBriefingAlert[];
}

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

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ message: "Authentification requise." }, { status: 401 });
  }

  const alerts: AssistantBriefingAlert[] = [];

  const dashboard = await apiGet<{
    dashboard?: {
      alerts?: Array<{
        code?: string;
        severity?: string;
        count?: number;
        label?: string;
        actionUrl?: string;
      }>;
      summary?: {
        kyc?: { pendingReview?: number };
        ridesBreakdownToday?: { inProgress?: number };
      };
    };
  }>(LINKS.admin.v1.dashboard, authHeader);

  for (const a of dashboard?.dashboard?.alerts ?? []) {
    if (!a.label) continue;
    const href = a.actionUrl?.startsWith("/")
      ? a.actionUrl
      : `/admin/${(a.actionUrl ?? "").replace(/^\/?admin\/?/, "")}`;
    alerts.push({
      severity:
        a.severity === "critical" || a.severity === "warning" ? a.severity : "info",
      label: a.count != null ? `${a.label} (${a.count})` : a.label,
      count: a.count,
      href: href || "/admin/dashboard",
    });
  }

  const kycPending = dashboard?.dashboard?.summary?.kyc?.pendingReview;
  if (kycPending != null && kycPending > 0 && !alerts.some((a) => a.href.includes("kyc"))) {
    alerts.push({
      severity: kycPending >= 10 ? "warning" : "info",
      label: `${kycPending} KYC en attente de revue`,
      count: kycPending,
      href: "/admin/fleet/kyc",
    });
  }

  const tripsLive = dashboard?.dashboard?.summary?.ridesBreakdownToday?.inProgress;
  if (tripsLive != null && tripsLive > 0) {
    alerts.push({
      severity: "info",
      label: `${tripsLive} course(s) en cours aujourd'hui`,
      count: tripsLive,
      href: "/admin/ops/trips?status=in_progress",
    });
  }

  const queue = await apiGet<{ items?: unknown[]; pagination?: { total?: number } }>(
    `${LINKS.admin.v1.kycQueue}?per_page=1&page=1`,
    authHeader
  );
  const queueTotal = queue?.pagination?.total ?? queue?.items?.length;
  if (queueTotal != null && queueTotal > 0 && !alerts.some((a) => a.href.includes("kyc"))) {
    alerts.push({
      severity: queueTotal >= 5 ? "warning" : "info",
      label: `${queueTotal} dossier(s) dans la file KYC`,
      count: queueTotal,
      href: "/admin/fleet/kyc",
    });
  }

  const greeting =
    alerts.length === 0
      ? "Tout semble calme. Je peux ouvrir une liste, résumer une fiche ou préparer une inscription."
      : `${alerts.length} point(s) d'attention aujourd'hui.`;

  return NextResponse.json({ greeting, alerts } satisfies AssistantBriefingResponse);
}
