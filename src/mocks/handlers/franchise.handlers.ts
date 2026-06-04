import { http, HttpResponse } from "msw";
import dashboardFranchise from "../data/dashboard-franchise.json";
import subPartners from "../data/sub-partners-franchise.json";
import driversListFranchiseSeed from "../data/drivers-list-franchise.json";
import financeFranchise from "../data/finance-franchise.json";
import driverTransfersFranchiseSeed from "../data/driver-wallet-transfers-franchise.json";
import partnerTransfersFranchiseSeed from "../data/partner-wallet-transfers-franchise.json";
import territoryFranchise from "../data/territory-franchise.json";
import franchisePromosSeed from "../data/franchise-promos.json";
import franchisePromoRedemptions from "../data/franchise-promo-redemptions.json";
import fleetClientsList from "../data/fleet-clients-list.json";
import type {
  FranchisePromo,
  FranchisePromoDetail,
  FranchisePromoUser,
} from "@/features/franchise/api/promos.service";
import type { Paginated } from "@/shared/types";
import franchiseSupportTicketsSeed from "../data/franchise-support-tickets.json";
import franchiseSupportChatsSeed from "../data/franchise-support-chats.json";
import type {
  FranchiseSupportChat,
  FranchiseSupportChatDetail,
  FranchiseSupportMessage,
  FranchiseSupportTicket,
  FranchiseSupportTicketDetail,
} from "@/features/franchise/api/support.service";
import franchiseKycQueueSeed from "../data/franchise-kyc-queue.json";
import driverDetail from "../data/driver-detail.json";
import driverDetailPending from "../data/driver-detail-pending.json";
import { buildAdminLiveMap } from "../lib/liveMapBuilder";
import type {
  Driver,
  DriverDetail,
  KycQueueItem,
  PartnerDriverTransfer,
  PartnerDriverRechargeStats,
  FranchisePartnerTransfer,
} from "@/shared/types";
import { paginatedList, parseListQuery, matchesSearch } from "../lib/listQuery";
import {
  addPricingRule,
  findPricingRule,
  getPricingRules,
  updatePricingRule,
} from "../lib/pricingMockStore";
import { filterDrivers, DRIVERS_CATALOG } from "../lib/driversCatalog";
import { TRIPS_CATALOG, filterTrips } from "../lib/tripsCatalog";
import { getFranchiseTripsFilterOptions } from "../lib/tripsScope";
import franchisePartnerCommissionsSeed from "../data/franchise-partner-commissions.json";
import type {
  FranchiseCommissionsListResponse,
  FranchisePartnerCommission,
} from "@/features/franchise/api/commissions.service";
import franchiseReconciliationSeed from "../data/franchise-reconciliation.json";
import franchiseMarketingCampaignsSeed from "../data/franchise-marketing-campaigns.json";
import franchiseMarketingBannersSeed from "../data/franchise-marketing-banners.json";
import type {
  FranchiseReconciliationListResponse,
  FranchiseReconciliationRow,
} from "@/features/franchise/api/reconciliation.service";
import type {
  FranchiseBanner,
  FranchiseCampaign,
} from "@/features/franchise/api/marketing.service";
import {
  activateFleetClient,
  getFleetClientDetail,
  listFleetClients,
  suspendFleetClient,
} from "../lib/fleetClientsMock";
import { buildDispatchConsole } from "../lib/dispatchConsoleBuilder";
import { getLiveMapCatalogDrivers } from "../lib/liveMapBuilder";
import tripDetail from "../data/trip-detail.json";
import type {
  DispatchConsoleData,
  PricingRule,
  Trip,
  TripsListResponse,
} from "@/shared/types";

type DriversList = { data: Driver[]; meta: typeof driversListFranchiseSeed.meta };
type KycQueue = { data: KycQueueItem[]; meta: typeof franchiseKycQueueSeed.meta };

const FRANCHISE_DRIVER_IDS = new Set(
  (driversListFranchiseSeed.data as Driver[]).map((d) => d.id)
);
const FRANCHISE_DRIVERS = DRIVERS_CATALOG.filter((d) => FRANCHISE_DRIVER_IDS.has(d.id));

let driversState: DriversList = {
  data: FRANCHISE_DRIVERS,
  meta: driversListFranchiseSeed.meta,
};

let kycQueueState: KycQueue = {
  data: franchiseKycQueueSeed.data as KycQueueItem[],
  meta: franchiseKycQueueSeed.meta,
};

type FranchiseFinance = typeof financeFranchise;
let financeState: FranchiseFinance = structuredClone(financeFranchise);

const franchiseTransfersSeed = driverTransfersFranchiseSeed as {
  stats: PartnerDriverRechargeStats;
  data: PartnerDriverTransfer[];
};

let franchiseDriverTransfers: PartnerDriverTransfer[] = [
  ...franchiseTransfersSeed.data,
];
let franchiseRechargeStats: PartnerDriverRechargeStats = {
  ...franchiseTransfersSeed.stats,
};

const partnerTransfersSeed = partnerTransfersFranchiseSeed as {
  stats: PartnerDriverRechargeStats;
  data: FranchisePartnerTransfer[];
};

let franchisePartnerTransfers: FranchisePartnerTransfer[] = [
  ...partnerTransfersSeed.data,
];
let franchisePartnerRechargeStats: PartnerDriverRechargeStats = {
  ...partnerTransfersSeed.stats,
};

let franchiseSupportChatsState: { data: FranchiseSupportChat[]; meta: typeof franchiseSupportChatsSeed.meta } =
  {
    data: franchiseSupportChatsSeed.data as FranchiseSupportChat[],
    meta: franchiseSupportChatsSeed.meta,
  };

function buildTicketDetail(ticket: FranchiseSupportTicket): FranchiseSupportTicketDetail {
  const opener: FranchiseSupportMessage = {
    id: `${ticket.id}-open`,
    author: ticket.reporter_name,
    role: "reporter",
    body: `Ouverture du ticket : ${ticket.subject}`,
    at: ticket.created_at,
  };
  return {
    ...ticket,
    messages:
      ticket.status === "resolved"
        ? [
            opener,
            {
              id: `${ticket.id}-close`,
              author: "Support franchise",
              role: "system",
              body: "Ticket marqué comme résolu.",
              at: ticket.updated_at,
            },
          ]
        : [
            opener,
            {
              id: `${ticket.id}-ack`,
              author: "Support franchise",
              role: "agent",
              body: "Nous avons bien reçu votre demande et traitons votre dossier.",
              at: ticket.updated_at,
            },
          ],
  };
}

const franchiseTicketDetails: Record<string, FranchiseSupportTicketDetail> =
  Object.fromEntries(
    (franchiseSupportTicketsSeed.data as FranchiseSupportTicket[]).map((t) => [
      t.id,
      buildTicketDetail(t),
    ])
  );

function buildChatDetail(chat: FranchiseSupportChat): FranchiseSupportChatDetail {
  const samples: Record<string, FranchiseSupportMessage[]> = {
    "CH-201": [
      {
        id: "CHM-1",
        author: "Aya Traoré",
        role: "reporter",
        body: "Bonjour, le chauffeur n'est pas arrivé au point de rendez-vous.",
        at: "2026-06-02T11:50:00Z",
      },
      {
        id: "CHM-2",
        author: "Support franchise",
        role: "agent",
        body: "Nous contactons le chauffeur et revenons vers vous sous 10 minutes.",
        at: "2026-06-02T12:00:00Z",
      },
      {
        id: "CHM-3",
        author: "Aya Traoré",
        role: "reporter",
        body: "Merci, le chauffeur est bien passé.",
        at: "2026-06-02T12:10:00Z",
      },
    ],
    "CH-198": [
      {
        id: "CHM-4",
        author: "Koné Ibrahim",
        role: "reporter",
        body: "Mon retrait wallet du 1er juin est toujours en attente.",
        at: "2026-06-02T10:30:00Z",
      },
      {
        id: "CHM-5",
        author: "Support franchise",
        role: "agent",
        body: "Le virement est en cours de validation bancaire.",
        at: "2026-06-02T11:00:00Z",
      },
      {
        id: "CHM-6",
        author: "Koné Ibrahim",
        role: "reporter",
        body: "Quand le virement sera crédité ?",
        at: "2026-06-02T11:45:00Z",
      },
    ],
    "CH-195": [
      {
        id: "CHM-7",
        author: "Cocody Express",
        role: "reporter",
        body: "Besoin d'un point sur les commissions mai.",
        at: "2026-06-02T09:30:00Z",
      },
    ],
    "CH-190": [
      {
        id: "CHM-8",
        author: "M. Bamba",
        role: "reporter",
        body: "Problème de double débit sur ma dernière course.",
        at: "2026-05-30T16:00:00Z",
      },
      {
        id: "CHM-9",
        author: "Support franchise",
        role: "agent",
        body: "Remboursement effectué sur votre wallet.",
        at: "2026-05-30T17:30:00Z",
      },
      {
        id: "CHM-10",
        author: "M. Bamba",
        role: "reporter",
        body: "Merci, c'est bon pour moi.",
        at: "2026-05-30T18:00:00Z",
      },
    ],
  };
  return {
    ...chat,
    messages: samples[chat.id] ?? [
      {
        id: `${chat.id}-start`,
        author: chat.participant_name,
        role: "reporter",
        body: chat.last_message_preview,
        at: chat.updated_at,
      },
    ],
  };
}

const franchiseChatDetails: Record<string, FranchiseSupportChatDetail> =
  Object.fromEntries(
    franchiseSupportChatsState.data.map((c) => [c.id, buildChatDetail(c)])
  );

const FRANCHISE_PARTNERS = subPartners.data as {
  id: number;
  name: string;
  status: string;
}[];

const FRANCHISE_TERRITORY_ID = 1;
const FRANCHISE_TERRITORY_NAME =
  (territoryFranchise as { franchise_name?: string }).franchise_name ?? "Côte d'Ivoire";

type FranchisePromoSeed = Omit<FranchisePromo, "assigned_users"> & {
  assigned_user_ids?: number[];
};

const fleetClientsCatalog = fleetClientsList.data as {
  id: number;
  full_name: string;
  phone: string;
}[];

function resolvePromoAssignedUsers(ids: number[]): FranchisePromoUser[] {
  return ids
    .map((id) => fleetClientsCatalog.find((c) => c.id === id))
    .filter((c): c is (typeof fleetClientsCatalog)[number] => c != null)
    .map((c) => ({ id: c.id, full_name: c.full_name, phone: c.phone }));
}

function hydrateFranchisePromo(raw: FranchisePromoSeed): FranchisePromo {
  const ids = raw.assigned_user_ids ?? [];
  const { assigned_user_ids: _drop, ...rest } = raw;
  return {
    ...rest,
    assigned_users: resolvePromoAssignedUsers(ids),
  };
}

let franchisePromosState: Paginated<FranchisePromo> = {
  data: (franchisePromosSeed.data as FranchisePromoSeed[]).map(hydrateFranchisePromo),
  meta: franchisePromosSeed.meta,
};

let franchiseCampaignsState: Paginated<FranchiseCampaign> = {
  data: franchiseMarketingCampaignsSeed.data as FranchiseCampaign[],
  meta: franchiseMarketingCampaignsSeed.meta,
};

let franchiseBannersState: Paginated<FranchiseBanner> = {
  data: franchiseMarketingBannersSeed.data as FranchiseBanner[],
  meta: franchiseMarketingBannersSeed.meta,
};

const promoRedemptionsById = franchisePromoRedemptions as Record<
  string,
  FranchisePromoDetail["recent_redemptions"]
>;

const promoCreatedAt: Record<number, string> = {
  1: "2025-12-01T10:00:00Z",
  2: "2026-01-15T08:00:00Z",
  3: "2025-06-01T12:00:00Z",
};
let franchiseTripsState: Trip[] = TRIPS_CATALOG.filter(
  (t) => t.franchise_id === FRANCHISE_TERRITORY_ID
);

const franchiseDriverNames: Record<number, string> = Object.fromEntries(
  getLiveMapCatalogDrivers().map((d) => [d.id, d.name])
);

function franchiseDispatchConsoleResponse(request: Request): DispatchConsoleData {
  const url = new URL(request.url);
  const partnerId = url.searchParams.get("partner_id");
  return buildDispatchConsole({
    trips: franchiseTripsState,
    franchiseId: FRANCHISE_TERRITORY_ID,
    partnerId: partnerId ? Number(partnerId) : null,
    includeFilterOptions: true,
    franchiseScope: true,
  });
}

function franchiseAvailableFcfa() {
  return Math.max(
    0,
    financeState.balance_fcfa - Math.floor(financeState.payouts_pending_fcfa * 0.2)
  );
}

const driverDetails: Record<string, DriverDetail> = {
  "101": { ...(driverDetail as DriverDetail), id: 101 },
  "103": { ...(driverDetailPending as unknown as DriverDetail), id: 103 },
  "110": {
    ...(driverDetail as DriverDetail),
    id: 110,
    first_name: "Traoré",
    last_name: "Aminata",
    account_status: "approved",
  },
  "112": {
    ...(driverDetailPending as unknown as DriverDetail),
    id: 112,
    first_name: "Koné",
    last_name: "Aminata",
    zone: "Cocody",
    owner_name: "Cocody Express",
  },
};

function getDriverDetail(id: string): DriverDetail {
  const base = driverDetails[id] ?? { ...driverDetail, id: Number(id) || 101 };
  const fromList = driversState.data.find((d) => String(d.id) === id);
  if (fromList) {
    return {
      ...base,
      ...fromList,
      first_name: fromList.first_name,
      last_name: fromList.last_name,
      account_status: fromList.account_status,
      availability: fromList.availability,
    };
  }
  return base;
}

function setDriverDetail(id: string, detail: DriverDetail) {
  driverDetails[id] = detail;
  const idx = driversState.data.findIndex((d) => String(d.id) === id);
  if (idx >= 0) {
    const next = [...driversState.data];
    next[idx] = {
      ...next[idx],
      account_status: detail.account_status,
      availability: detail.availability,
      first_name: detail.first_name,
      last_name: detail.last_name,
    };
    driversState.data = next;
  }
}

function removeFromKycQueue(driverId: number) {
  const data = kycQueueState.data.filter((q) => q.driver_id !== driverId);
  kycQueueState.data = data;
  kycQueueState.meta.total = data.length;
}

export const franchiseHandlers = [
  http.get("*/api/v2/franchise/dashboard", () => {
    return HttpResponse.json({
      ...dashboardFranchise,
      pending_kyc: kycQueueState.meta.total,
    });
  }),

  http.get("*/api/v2/franchise/ops/map", ({ request }) => {
    const url = new URL(request.url);
    return HttpResponse.json(
      buildAdminLiveMap({
        franchise_id: "1",
        partner_id: url.searchParams.get("partner_id"),
      })
    );
  }),

  http.get("*/api/v2/franchise/ops/trips", ({ request }) => {
    const query = parseListQuery(request);
    const scopedQuery = { ...query, franchise_id: FRANCHISE_TERRITORY_ID };
    const filtered = filterTrips(franchiseTripsState, scopedQuery);
    const body: TripsListResponse = {
      ...paginatedList(filtered, query),
      filter_options: getFranchiseTripsFilterOptions(),
    };
    return HttpResponse.json(body);
  }),

  http.get("*/api/v2/franchise/ops/trips/:id", ({ params }) => {
    const id = String(params.id);
    const fromList = franchiseTripsState.find((t) => t.id === id);
    if (!fromList) {
      return HttpResponse.json({ message: "Course introuvable" }, { status: 404 });
    }
    return HttpResponse.json({
      ...tripDetail,
      ...fromList,
      id,
      timeline: tripDetail.timeline,
    });
  }),

  http.get("*/api/v2/franchise/ops/dispatch", ({ request }) => {
    return HttpResponse.json(franchiseDispatchConsoleResponse(request));
  }),

  http.post("*/api/v2/franchise/ops/dispatch/trips/:id/assign", async ({ params, request }) => {
    const id = String(params.id);
    const body = (await request.json()) as { driver_id?: number };
    const driverId = body.driver_id;
    if (!driverId) {
      return HttpResponse.json({ message: "Chauffeur requis" }, { status: 422 });
    }

    const idx = franchiseTripsState.findIndex((t) => t.id === id);
    if (idx < 0) {
      return HttpResponse.json({ message: "Course introuvable" }, { status: 404 });
    }
    const trip = franchiseTripsState[idx];
    if (!["matching", "requested"].includes(trip.status)) {
      return HttpResponse.json(
        { message: "Cette course n'est plus en attente d'assignation" },
        { status: 409 }
      );
    }

    const driverName = franchiseDriverNames[driverId] ?? `Chauffeur #${driverId}`;
    const updated: Trip = {
      ...trip,
      status: "assigned",
      driver_name: driverName,
    };
    franchiseTripsState[idx] = updated;

    return HttpResponse.json({
      ok: true,
      trip: updated,
      message: `Course ${trip.ref} assignée à ${driverName}`,
    });
  }),

  http.get("*/api/v2/franchise/territory", () => {
    return HttpResponse.json(territoryFranchise);
  }),

  http.get("*/api/v2/franchise/partners", ({ request }) => {
    const query = parseListQuery(request);
    let list = subPartners.data.filter((p) =>
      matchesSearch(query.search, p.name, p.city, p.contact_email)
    );
    if (query.status) list = list.filter((p) => p.status === query.status);
    return HttpResponse.json(paginatedList(list, query));
  }),

  http.get("*/api/v2/franchise/partners/:id", ({ params }) => {
    const id = Number(params.id);
    const partner = subPartners.data.find((p) => p.id === id) ?? subPartners.data[0];
    return HttpResponse.json({
      ...partner,
      franchise_name: territoryFranchise.franchise_name,
      legal_name: `${partner.name} SARL`,
      address: partner.city,
      created_at: "2023-01-15T00:00:00Z",
      vehicles_count: Math.floor(partner.drivers_count * 0.8),
    });
  }),

  http.get("*/api/v2/franchise/drivers", ({ request }) => {
    const query = parseListQuery(request);
    const filtered = filterDrivers(driversState.data, query);
    return HttpResponse.json(paginatedList(filtered, query));
  }),

  http.get("*/api/v2/franchise/drivers/kyc-queue", ({ request }) => {
    const query = parseListQuery(request);
    const list = kycQueueState.data.filter((row) =>
      matchesSearch(
        query.search,
        row.first_name,
        row.last_name,
        row.phone,
        row.zone,
        row.owner_name
      )
    );
    return HttpResponse.json(paginatedList(list, query));
  }),

  http.get("*/api/v2/franchise/drivers/:id", ({ params }) => {
    const id = String(params.id);
    return HttpResponse.json(getDriverDetail(id));
  }),

  http.post("*/api/v2/franchise/drivers/:id/kyc/approve", ({ params }) => {
    const id = String(params.id);
    const detail = getDriverDetail(id);
    const now = new Date().toISOString();
    const updated: DriverDetail = {
      ...detail,
      account_status: "approved",
      approved_at: now,
      kyc_documents: detail.kyc_documents.map((doc) => ({
        ...doc,
        status: "approved" as const,
        reviewed_at: now,
        status_note: undefined,
      })),
      timeline: [
        {
          id: "approved-now",
          type: "approved",
          label: "Compte approuvé",
          description: `Validation franchise ${territoryFranchise.franchise_name}`,
          at: now,
        },
        ...detail.timeline,
      ],
    };
    setDriverDetail(id, updated);
    removeFromKycQueue(Number(id));
    return HttpResponse.json({ ok: true, message: "Chauffeur approuvé", driver: updated });
  }),

  http.post("*/api/v2/franchise/drivers/:id/kyc/reject", async ({ params, request }) => {
    const id = String(params.id);
    const body = (await request.json()) as { reason?: string };
    const detail = getDriverDetail(id);
    const now = new Date().toISOString();
    const updated: DriverDetail = {
      ...detail,
      account_status: "suspended",
      kyc_documents: detail.kyc_documents.map((doc) =>
        doc.status === "pending"
          ? {
              ...doc,
              status: "rejected" as const,
              reviewed_at: now,
              status_note: body.reason ?? "Documents non conformes",
            }
          : doc
      ),
    };
    setDriverDetail(id, updated);
    removeFromKycQueue(Number(id));
    return HttpResponse.json({ ok: true, message: "Demande rejetée", driver: updated });
  }),

  http.post(
    "*/api/v2/franchise/drivers/:id/documents/:docId/approve",
    ({ params }) => {
      const id = String(params.id);
      const docId = String(params.docId);
      const detail = getDriverDetail(id);
      const now = new Date().toISOString();
      const docs = detail.kyc_documents.map((doc) =>
        doc.id === docId
          ? { ...doc, status: "approved" as const, reviewed_at: now, status_note: undefined }
          : doc
      );
      const allApproved = docs.every(
        (d) => d.status === "approved" || !d.uploaded_at
      );
      const updated: DriverDetail = {
        ...detail,
        kyc_documents: docs,
        account_status: allApproved ? "approved" : detail.account_status,
        approved_at: allApproved ? now : detail.approved_at,
      };
      if (allApproved) {
        removeFromKycQueue(Number(id));
      }
      setDriverDetail(id, updated);
      return HttpResponse.json({ ok: true, driver: updated });
    }
  ),

  http.post(
    "*/api/v2/franchise/drivers/:id/documents/:docId/reject",
    async ({ params, request }) => {
      const id = String(params.id);
      const docId = String(params.docId);
      const body = (await request.json()) as { reason?: string };
      const detail = getDriverDetail(id);
      const now = new Date().toISOString();
      const docs = detail.kyc_documents.map((doc) =>
        doc.id === docId
          ? {
              ...doc,
              status: "rejected" as const,
              reviewed_at: now,
              status_note: body.reason ?? "Document illisible",
            }
          : doc
      );
      const updated: DriverDetail = { ...detail, kyc_documents: docs };
      setDriverDetail(id, updated);
      return HttpResponse.json({ ok: true, driver: updated });
    }
  ),

  http.get("*/api/v2/franchise/fleet/clients", ({ request }) => {
    return HttpResponse.json(listFleetClients(request));
  }),

  http.get("*/api/v2/franchise/fleet/clients/:id", ({ params }) => {
    const id = Number(params.id);
    return HttpResponse.json(getFleetClientDetail(id));
  }),

  http.post("*/api/v2/franchise/fleet/clients/:id/suspend", ({ params }) => {
    const id = Number(params.id);
    return HttpResponse.json(suspendFleetClient(id));
  }),

  http.post("*/api/v2/franchise/fleet/clients/:id/activate", ({ params }) => {
    const id = Number(params.id);
    return HttpResponse.json(activateFleetClient(id));
  }),

  http.get("*/api/v2/franchise/finance/commissions", ({ request }) => {
    const query = parseListQuery(request);
    let list = franchisePartnerCommissionsSeed.data as FranchisePartnerCommission[];
    list = list.filter((c) =>
      matchesSearch(
        query.search,
        c.id,
        c.partner_name,
        c.partner_city,
        c.period_label
      )
    );
    if (query.status) list = list.filter((c) => c.status === query.status);
    if (query.partner_id != null) {
      list = list.filter((c) => c.partner_id === query.partner_id);
    }
    const pending = list.filter((c) => c.status === "pending");
    const paid = list.filter((c) => c.status === "paid");
    const body: FranchiseCommissionsListResponse = {
      ...paginatedList(list, query),
      filter_options: getFranchiseTripsFilterOptions(),
      summary: {
        pending_fcfa: pending.reduce((s, c) => s + c.commission_fcfa, 0),
        pending_count: pending.length,
        paid_month_fcfa: paid.reduce((s, c) => s + c.commission_fcfa, 0),
      },
    };
    return HttpResponse.json(body);
  }),

  http.get("*/api/v2/franchise/finance/reconciliation", ({ request }) => {
    const query = parseListQuery(request);
    let list = franchiseReconciliationSeed.data as FranchiseReconciliationRow[];
    list = list.filter((r) =>
      matchesSearch(
        query.search,
        r.id,
        r.source,
        r.date_label,
        r.partner_name ?? ""
      )
    );
    if (query.status) list = list.filter((r) => r.status === query.status);
    if (query.partner_id != null) {
      list = list.filter((r) => r.partner_id === query.partner_id);
    }
    const body: FranchiseReconciliationListResponse = {
      ...paginatedList(list, query),
      filter_options: getFranchiseTripsFilterOptions(),
    };
    return HttpResponse.json(body);
  }),

  http.get("*/api/v2/franchise/marketing/campaigns", ({ request }) => {
    const query = parseListQuery(request);
    let list = franchiseCampaignsState.data.filter((c) =>
      matchesSearch(query.search, c.name, c.audience, c.id)
    );
    if (query.status) list = list.filter((c) => c.status === query.status);
    return HttpResponse.json(paginatedList(list, query));
  }),

  http.post("*/api/v2/franchise/marketing/campaigns", async ({ request }) => {
    const body = (await request.json()) as Partial<FranchiseCampaign>;
    if (!body.name?.trim()) {
      return HttpResponse.json({ message: "Nom requis" }, { status: 422 });
    }
    const campaign: FranchiseCampaign = {
      id: `CMP-CI-${Date.now()}`,
      name: body.name.trim(),
      channel: body.channel ?? "push",
      audience: body.audience?.trim() ?? "Clients territoire",
      status: body.status ?? "draft",
      sent_count: 0,
      open_rate_pct: 0,
      starts_at: body.starts_at ?? new Date().toISOString(),
      ends_at: body.ends_at ?? new Date(Date.now() + 30 * 86400000).toISOString(),
    };
    franchiseCampaignsState = {
      ...franchiseCampaignsState,
      data: [campaign, ...franchiseCampaignsState.data],
      meta: {
        ...franchiseCampaignsState.meta,
        total: franchiseCampaignsState.data.length + 1,
      },
    };
    return HttpResponse.json(campaign, { status: 201 });
  }),

  http.get("*/api/v2/franchise/marketing/banners", ({ request }) => {
    const query = parseListQuery(request);
    let list = franchiseBannersState.data.filter((b) =>
      matchesSearch(query.search, b.title, b.placement)
    );
    if (query.status) list = list.filter((b) => b.status === query.status);
    return HttpResponse.json(paginatedList(list, query));
  }),

  http.post("*/api/v2/franchise/marketing/banners", async ({ request }) => {
    const body = (await request.json()) as Partial<FranchiseBanner>;
    if (!body.title?.trim()) {
      return HttpResponse.json({ message: "Titre requis" }, { status: 422 });
    }
    const ids = franchiseBannersState.data.map((b) => b.id);
    const banner: FranchiseBanner = {
      id: ids.length ? Math.max(...ids) + 1 : 1,
      title: body.title.trim(),
      placement: body.placement ?? "home_hero",
      status: body.status ?? "draft",
      impressions: 0,
      clicks: 0,
      starts_at: body.starts_at ?? new Date().toISOString(),
      ends_at: body.ends_at ?? new Date(Date.now() + 30 * 86400000).toISOString(),
    };
    franchiseBannersState = {
      ...franchiseBannersState,
      data: [banner, ...franchiseBannersState.data],
      meta: {
        ...franchiseBannersState.meta,
        total: franchiseBannersState.data.length + 1,
      },
    };
    return HttpResponse.json(banner, { status: 201 });
  }),

  http.get("*/api/v2/franchise/finance", () => {
    return HttpResponse.json({
      ...financeState,
      available_fcfa: franchiseAvailableFcfa(),
    });
  }),

  http.get("*/api/v2/franchise/finance/driver-transfers/stats", () => {
    return HttpResponse.json(franchiseRechargeStats);
  }),

  http.get("*/api/v2/franchise/finance/driver-transfers", ({ request }) => {
    const query = parseListQuery(request);
    const list = franchiseDriverTransfers.filter((t) =>
      matchesSearch(
        query.search,
        t.ref,
        t.driver_name,
        t.driver_phone,
        t.note ?? ""
      )
    );
    return HttpResponse.json(paginatedList(list, query));
  }),

  http.post("*/api/v2/franchise/finance/driver-recharge", async ({ request }) => {
    const body = (await request.json()) as {
      driver_id?: number;
      amount_fcfa?: number;
      note?: string;
    };
    const driverId = body.driver_id ?? 0;
    const amount = body.amount_fcfa ?? 0;
    const available = franchiseAvailableFcfa();

    if (amount < 1000) {
      return HttpResponse.json(
        { message: "Montant minimum : 1 000 FCFA" },
        { status: 422 }
      );
    }
    if (amount > available) {
      return HttpResponse.json(
        { message: "Solde territoire insuffisant pour ce transfert" },
        { status: 422 }
      );
    }

    const driver = FRANCHISE_DRIVERS.find((d) => d.id === driverId);
    if (!driver) {
      return HttpResponse.json({ message: "Chauffeur introuvable" }, { status: 404 });
    }
    if (driver.account_status !== "approved") {
      return HttpResponse.json(
        { message: "Le compte chauffeur doit être approuvé avant recharge" },
        { status: 422 }
      );
    }

    const now = new Date().toISOString();
    const ref = `DT-F-${Math.floor(100 + Math.random() * 899)}`;
    const transfer: PartnerDriverTransfer = {
      id: ref,
      ref,
      driver_id: driver.id,
      driver_name: `${driver.first_name} ${driver.last_name}`,
      driver_phone: driver.phone,
      amount_fcfa: amount,
      status: "completed",
      mobile_wallet_credited: true,
      note: body.note?.trim() || "Recharge app mobile · territoire",
      created_at: now,
    };

    franchiseDriverTransfers = [transfer, ...franchiseDriverTransfers];
    franchiseRechargeStats = {
      ...franchiseRechargeStats,
      total_spent_fcfa: franchiseRechargeStats.total_spent_fcfa + amount,
      transfers_count: franchiseRechargeStats.transfers_count + 1,
      month_spent_fcfa: franchiseRechargeStats.month_spent_fcfa + amount,
      month_transfers_count: franchiseRechargeStats.month_transfers_count + 1,
      last_transfer_at: now,
    };

    financeState = {
      ...financeState,
      balance_fcfa: financeState.balance_fcfa - amount,
      transactions: [
        {
          id: `ft-${Date.now()}`,
          label: `Recharge ${driver.first_name} ${driver.last_name} · ${ref}`,
          amount_fcfa: amount,
          direction: "debit" as const,
          created_at: now,
        },
        ...financeState.transactions,
      ],
    };

    return HttpResponse.json({
      ok: true,
      message: `Recharge de ${amount.toLocaleString("fr-FR")} FCFA envoyée sur l'app mobile de ${driver.first_name} ${driver.last_name}`,
      transfer,
      finance: {
        ...financeState,
        available_fcfa: franchiseAvailableFcfa(),
      },
      stats: franchiseRechargeStats,
    });
  }),

  http.get("*/api/v2/franchise/finance/partner-transfers/stats", () => {
    return HttpResponse.json(franchisePartnerRechargeStats);
  }),

  http.get("*/api/v2/franchise/finance/partner-transfers", ({ request }) => {
    const query = parseListQuery(request);
    const list = franchisePartnerTransfers.filter((t) =>
      matchesSearch(query.search, t.ref, t.partner_name, t.note ?? "")
    );
    return HttpResponse.json(paginatedList(list, query));
  }),

  http.post("*/api/v2/franchise/finance/partner-recharge", async ({ request }) => {
    const body = (await request.json()) as {
      partner_id?: number;
      amount_fcfa?: number;
      note?: string;
    };
    const partnerId = body.partner_id ?? 0;
    const amount = body.amount_fcfa ?? 0;
    const available = franchiseAvailableFcfa();

    if (amount < 5000) {
      return HttpResponse.json(
        { message: "Montant minimum : 5 000 FCFA" },
        { status: 422 }
      );
    }
    if (amount > available) {
      return HttpResponse.json(
        { message: "Solde territoire insuffisant pour ce crédit" },
        { status: 422 }
      );
    }

    const partner = FRANCHISE_PARTNERS.find((p) => p.id === partnerId);
    if (!partner) {
      return HttpResponse.json({ message: "Partenaire introuvable" }, { status: 404 });
    }
    if (partner.status !== "active") {
      return HttpResponse.json(
        { message: "Le partenaire doit être actif pour recevoir un crédit" },
        { status: 422 }
      );
    }

    const now = new Date().toISOString();
    const ref = `PT-F-${Math.floor(100 + Math.random() * 899)}`;
    const transfer: FranchisePartnerTransfer = {
      id: ref,
      ref,
      partner_id: partner.id,
      partner_name: partner.name,
      amount_fcfa: amount,
      status: "completed",
      note: body.note?.trim() || "Crédit portefeuille partenaire · territoire",
      created_at: now,
    };

    franchisePartnerTransfers = [transfer, ...franchisePartnerTransfers];
    franchisePartnerRechargeStats = {
      ...franchisePartnerRechargeStats,
      total_spent_fcfa: franchisePartnerRechargeStats.total_spent_fcfa + amount,
      transfers_count: franchisePartnerRechargeStats.transfers_count + 1,
      month_spent_fcfa: franchisePartnerRechargeStats.month_spent_fcfa + amount,
      month_transfers_count: franchisePartnerRechargeStats.month_transfers_count + 1,
      last_transfer_at: now,
    };

    financeState = {
      ...financeState,
      balance_fcfa: financeState.balance_fcfa - amount,
      transactions: [
        {
          id: `ft-p-${Date.now()}`,
          label: `Recharge partenaire ${partner.name} · ${ref}`,
          amount_fcfa: amount,
          direction: "debit" as const,
          created_at: now,
        },
        ...financeState.transactions,
      ],
    };

    return HttpResponse.json({
      ok: true,
      message: `Crédit de ${amount.toLocaleString("fr-FR")} FCFA envoyé au partenaire ${partner.name}`,
      transfer,
      finance: {
        ...financeState,
        available_fcfa: franchiseAvailableFcfa(),
      },
      stats: franchisePartnerRechargeStats,
    });
  }),

  http.get("*/api/v2/franchise/promos", ({ request }) => {
    const query = parseListQuery(request);
    let list = franchisePromosState.data.filter((p) =>
      matchesSearch(query.search, p.code, p.label)
    );
    if (query.status) list = list.filter((p) => p.status === query.status);
    return HttpResponse.json(paginatedList(list, query));
  }),

  http.get("*/api/v2/franchise/promos/:id", ({ params }) => {
    const id = Number(params.id);
    const promo = franchisePromosState.data.find((p) => p.id === id);
    if (!promo) {
      return HttpResponse.json({ message: "Code promo introuvable" }, { status: 404 });
    }
    const detail: FranchisePromoDetail = {
      ...promo,
      created_at: promoCreatedAt[id] ?? new Date().toISOString(),
      territory_name: FRANCHISE_TERRITORY_NAME,
      recent_redemptions: promoRedemptionsById[String(id)] ?? [],
    };
    return HttpResponse.json(detail);
  }),

  http.post("*/api/v2/franchise/promos", async ({ request }) => {
    const body = (await request.json()) as Partial<FranchisePromo> & {
      assigned_user_ids?: number[];
    };
    if (!body.code?.trim() || !body.label?.trim()) {
      return HttpResponse.json({ message: "Code et libellé requis" }, { status: 422 });
    }
    const userIds = Array.isArray(body.assigned_user_ids)
      ? [...new Set(body.assigned_user_ids.filter((n) => Number.isFinite(n)))]
      : [];
    const assigned_users = resolvePromoAssignedUsers(userIds);
    if (userIds.length > 0 && assigned_users.length !== userIds.length) {
      return HttpResponse.json(
        { message: "Un ou plusieurs utilisateurs sont introuvables" },
        { status: 422 }
      );
    }
    const existing = franchisePromosState.data.find(
      (p) => p.code.toUpperCase() === body.code!.trim().toUpperCase()
    );
    if (existing) {
      return HttpResponse.json({ message: "Ce code existe déjà" }, { status: 409 });
    }
    const ids = franchisePromosState.data.map((p) => p.id);
    const id = ids.length ? Math.max(...ids) + 1 : 1;
    const promo: FranchisePromo = {
      id,
      code: body.code.trim().toUpperCase(),
      label: body.label.trim(),
      discount_pct: body.discount_pct ?? 0,
      fixed_discount_fcfa: body.fixed_discount_fcfa,
      uses_count: 0,
      max_uses: body.max_uses ?? 500,
      status: body.status ?? "draft",
      expires_at: body.expires_at ?? new Date(Date.now() + 90 * 86400000).toISOString(),
      assigned_users,
    };
    promoCreatedAt[id] = new Date().toISOString();
    franchisePromosState = {
      ...franchisePromosState,
      data: [promo, ...franchisePromosState.data],
      meta: {
        ...franchisePromosState.meta,
        total: franchisePromosState.data.length + 1,
      },
    };
    return HttpResponse.json(promo, { status: 201 });
  }),

  http.get("*/api/v2/franchise/support/tickets", ({ request }) => {
    const query = parseListQuery(request);
    let list = franchiseSupportTicketsSeed.data as FranchiseSupportTicket[];
    list = list.filter((t) =>
      matchesSearch(
        query.search,
        t.id,
        t.subject,
        t.reporter_name,
        t.category
      )
    );
    if (query.status) list = list.filter((t) => t.status === query.status);
    if (query.type) list = list.filter((t) => t.reporter_type === query.type);
    return HttpResponse.json(paginatedList(list, query));
  }),

  http.get("*/api/v2/franchise/support/tickets/:id", ({ params }) => {
    const id = String(params.id);
    const ticket = (franchiseSupportTicketsSeed.data as FranchiseSupportTicket[]).find(
      (t) => t.id === id
    );
    if (!ticket) {
      return HttpResponse.json({ message: "Ticket introuvable" }, { status: 404 });
    }
    const detail = franchiseTicketDetails[id];
    if (!detail) {
      return HttpResponse.json({ message: "Ticket introuvable" }, { status: 404 });
    }
    return HttpResponse.json(detail);
  }),

  http.post(
    "*/api/v2/franchise/support/tickets/:id/messages",
    async ({ params, request }) => {
      const id = String(params.id);
      const detail = franchiseTicketDetails[id];
      if (!detail) {
        return HttpResponse.json({ message: "Ticket introuvable" }, { status: 404 });
      }
      const body = (await request.json()) as { body?: string };
      const text = body.body?.trim();
      if (!text) {
        return HttpResponse.json({ message: "Message requis" }, { status: 422 });
      }
      const msg: FranchiseSupportMessage = {
        id: `TKM-${Date.now()}`,
        author: "Support franchise",
        role: "agent",
        body: text,
        at: new Date().toISOString(),
      };
      detail.messages = [...detail.messages, msg];
      detail.updated_at = msg.at;
      if (detail.status === "open") detail.status = "in_progress";
      return HttpResponse.json(msg, { status: 201 });
    }
  ),

  http.get("*/api/v2/franchise/support/chat", ({ request }) => {
    const query = parseListQuery(request);
    let list = franchiseSupportChatsState.data;
    list = list.filter((c) =>
      matchesSearch(
        query.search,
        c.id,
        c.participant_name,
        c.last_message_preview,
        c.subject ?? ""
      )
    );
    if (query.status) list = list.filter((c) => c.status === query.status);
    if (query.type) list = list.filter((c) => c.participant_type === query.type);
    return HttpResponse.json(paginatedList(list, query));
  }),

  http.get("*/api/v2/franchise/support/chat/:id", ({ params }) => {
    const id = String(params.id);
    const detail = franchiseChatDetails[id];
    if (!detail) {
      return HttpResponse.json({ message: "Conversation introuvable" }, { status: 404 });
    }
    detail.unread_count = 0;
    const idx = franchiseSupportChatsState.data.findIndex((c) => c.id === id);
    if (idx >= 0) {
      franchiseSupportChatsState.data[idx] = {
        ...franchiseSupportChatsState.data[idx],
        unread_count: 0,
      };
    }
    return HttpResponse.json(detail);
  }),

  http.post(
    "*/api/v2/franchise/support/chat/:id/messages",
    async ({ params, request }) => {
      const id = String(params.id);
      const detail = franchiseChatDetails[id];
      if (!detail) {
        return HttpResponse.json(
          { message: "Conversation introuvable" },
          { status: 404 }
        );
      }
      const body = (await request.json()) as { body?: string };
      const text = body.body?.trim();
      if (!text) {
        return HttpResponse.json({ message: "Message requis" }, { status: 422 });
      }
      const msg: FranchiseSupportMessage = {
        id: `CHM-${Date.now()}`,
        author: "Support franchise",
        role: "agent",
        body: text,
        at: new Date().toISOString(),
      };
      detail.messages = [...detail.messages, msg];
      detail.last_message_preview = text;
      detail.updated_at = msg.at;
      const idx = franchiseSupportChatsState.data.findIndex((c) => c.id === id);
      if (idx >= 0) {
        franchiseSupportChatsState.data[idx] = {
          ...franchiseSupportChatsState.data[idx],
          last_message_preview: text,
          updated_at: msg.at,
          unread_count: 0,
        };
      }
      return HttpResponse.json(msg, { status: 201 });
    }
  ),

  http.get("*/api/v2/franchise/pricing", ({ request }) => {
    const query = parseListQuery(request);
    let list = getPricingRules().filter((p) => p.franchise_id === FRANCHISE_TERRITORY_ID);
    list = list.filter((p) =>
      matchesSearch(query.search, p.zone_name, p.service, p.franchise_name)
    );
    if (query.status) list = list.filter((p) => p.status === query.status);
    if (query.service && query.service !== "all") {
      list = list.filter((p) => p.service === query.service);
    }
    if (query.zone) {
      list = list.filter((p) =>
        p.zone_name.toLowerCase().includes(query.zone!.toLowerCase())
      );
    }
    const active = list.filter((p) => p.status === "active");
    const draft = list.filter((p) => p.status === "draft");
    return HttpResponse.json({
      ...paginatedList(list, query),
      summary: {
        franchise_name: FRANCHISE_TERRITORY_NAME,
        active_count: active.length,
        draft_count: draft.length,
      },
    });
  }),

  http.get("*/api/v2/franchise/pricing/:id", ({ params }) => {
    const id = Number(params.id);
    const rule = findPricingRule(id);
    if (!rule || rule.franchise_id !== FRANCHISE_TERRITORY_ID) {
      return HttpResponse.json({ message: "Grille introuvable" }, { status: 404 });
    }
    return HttpResponse.json(rule);
  }),

  http.post("*/api/v2/franchise/pricing", async ({ request }) => {
    const body = (await request.json()) as Partial<PricingRule>;
    if (!body.zone_name?.trim()) {
      return HttpResponse.json({ message: "Zone requise" }, { status: 422 });
    }
    const base_fare_fcfa = body.base_fare_fcfa ?? 500;
    const per_km_fcfa = body.per_km_fcfa ?? 300;
    const min_fare_fcfa = body.min_fare_fcfa ?? 1200;
    if (base_fare_fcfa <= 0 || per_km_fcfa <= 0 || min_fare_fcfa <= 0) {
      return HttpResponse.json(
        { message: "Les montants doivent être supérieurs à 0" },
        { status: 422 }
      );
    }
    const rule = addPricingRule({
      franchise_id: FRANCHISE_TERRITORY_ID,
      franchise_name: FRANCHISE_TERRITORY_NAME,
      zone_name: body.zone_name.trim(),
      service: body.service ?? "taxi",
      base_fare_fcfa,
      per_km_fcfa,
      min_fare_fcfa,
      surge_multiplier: body.surge_multiplier ?? 1,
      status: body.status ?? "draft",
    });
    return HttpResponse.json(rule, { status: 201 });
  }),

  http.put("*/api/v2/franchise/pricing/:id", async ({ params, request }) => {
    const id = Number(params.id);
    const current = findPricingRule(id);
    if (!current || current.franchise_id !== FRANCHISE_TERRITORY_ID) {
      return HttpResponse.json({ message: "Grille introuvable" }, { status: 404 });
    }
    const body = (await request.json()) as Partial<PricingRule>;
    const base_fare_fcfa = body.base_fare_fcfa ?? current.base_fare_fcfa;
    const per_km_fcfa = body.per_km_fcfa ?? current.per_km_fcfa;
    const min_fare_fcfa = body.min_fare_fcfa ?? current.min_fare_fcfa;
    if (base_fare_fcfa <= 0 || per_km_fcfa <= 0 || min_fare_fcfa <= 0) {
      return HttpResponse.json(
        { message: "Les montants doivent être supérieurs à 0" },
        { status: 422 }
      );
    }
    const updated = updatePricingRule(id, {
      service: body.service ?? current.service,
      base_fare_fcfa,
      per_km_fcfa,
      min_fare_fcfa,
      surge_multiplier: body.surge_multiplier ?? current.surge_multiplier,
      status: body.status ?? current.status,
    });
    return HttpResponse.json(updated);
  }),
];
