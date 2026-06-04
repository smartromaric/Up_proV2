import adminDashboardSeed from "../data/dashboard-admin.json";
import franchisesList from "../data/franchises-list.json";
import type { DashboardAdminKpi, Trip } from "@/shared/types";

type FranchiseRow = (typeof franchisesList.data)[number];

const GLOBAL = adminDashboardSeed as DashboardAdminKpi;
const FRANCHISES = franchisesList.data as FranchiseRow[];

const FRANCHISE_SLICES: Record<
  number,
  Omit<
    DashboardAdminKpi,
    "franchise_activity" | "active_zone" | "franchise_options" | "selected_franchise_id"
  > & {
    active_zone: DashboardAdminKpi["active_zone"];
  }
> = {
  1: {
    net_profit_today_fcfa: 436_000,
    net_profit_trend_pct: 8.2,
    trips_today: 318,
    trips_today_trend_pct: 7.1,
    trips_completed_today: 296,
    trips_in_progress_today: 8,
    trips_cancelled_today: 14,
    drivers_approved: 3580,
    drivers_total: 4120,
    drivers_pending_kyc: 5,
    users_registered: 5200,
    clients_ordered_today: 412,
    chart_flux: GLOBAL.chart_flux.map((d) => ({
      day: d.day,
      revenue: Math.round(d.revenue * 0.35),
      commission: Math.round(d.commission * 0.35),
    })),
    recent_trips: GLOBAL.recent_trips.filter((t) =>
      /Abidjan|Cocody|Marcory|Plateau|Yopougon/i.test(
        `${t.from_label} ${t.to_label}`
      )
    ) as Trip[],
    active_zone: {
      franchise_id: 1,
      franchise_name: "Côte d'Ivoire",
      partner_id: 12,
      partner_name: "Cocody Express",
      zone_id: 1,
      zone_name: "Abidjan — Cocody / Plateau",
      city: "Abidjan",
      trips_24h: 127,
      drivers_online: 342,
    },
  },
  2: {
    net_profit_today_fcfa: 318_000,
    net_profit_trend_pct: 11.1,
    trips_today: 211,
    trips_today_trend_pct: 10.2,
    trips_completed_today: 198,
    trips_in_progress_today: 4,
    trips_cancelled_today: 9,
    drivers_approved: 2650,
    drivers_total: 2890,
    drivers_pending_kyc: 2,
    users_registered: 3100,
    clients_ordered_today: 156,
    chart_flux: GLOBAL.chart_flux.map((d) => ({
      day: d.day,
      revenue: Math.round(d.revenue * 0.26),
      commission: Math.round(d.commission * 0.26),
    })),
    recent_trips: [
      {
        id: "ca-1",
        ref: "TR-CA-4412",
        service: "taxi",
        from_label: "Montréal, Centre-ville",
        to_label: "Montréal, Plateau",
        client_name: "Jean Tremblay",
        driver_name: "Marie Lavoie",
        amount_fcfa: 8200,
        status: "completed",
        payment_method: "card",
        created_at: "2026-06-02T15:10:00Z",
      },
    ] as Trip[],
    active_zone: {
      franchise_id: 2,
      franchise_name: "Canada",
      partner_id: 22,
      partner_name: "Montréal North Mobility",
      zone_id: 2,
      zone_name: "Montréal — Centre-ville",
      city: "Montréal",
      trips_24h: 198,
      drivers_online: 654,
    },
  },
  3: {
    net_profit_today_fcfa: 445_000,
    net_profit_trend_pct: 14.6,
    trips_today: 401,
    trips_today_trend_pct: 12.5,
    trips_completed_today: 386,
    trips_in_progress_today: 4,
    trips_cancelled_today: 11,
    drivers_approved: 4780,
    drivers_total: 5200,
    drivers_pending_kyc: 1,
    users_registered: 4800,
    clients_ordered_today: 298,
    chart_flux: GLOBAL.chart_flux.map((d) => ({
      day: d.day,
      revenue: Math.round(d.revenue * 0.36),
      commission: Math.round(d.commission * 0.36),
    })),
    recent_trips: [
      {
        id: "eu-1",
        ref: "TR-EU-8821",
        service: "taxi",
        from_label: "Paris, Champs-Élysées",
        to_label: "Paris, Marais",
        client_name: "Emma Dubois",
        driver_name: "Lucas Bernard",
        amount_fcfa: 12500,
        status: "in_progress",
        payment_method: "card",
        created_at: "2026-06-02T14:55:00Z",
      },
    ] as Trip[],
    active_zone: {
      franchise_id: 3,
      franchise_name: "Espace euro",
      partner_id: 31,
      partner_name: "Île-de-France VTC",
      zone_id: 4,
      zone_name: "Paris — Champs-Élysées",
      city: "Paris",
      trips_24h: 386,
      drivers_online: 1248,
    },
  },
  4: {
    net_profit_today_fcfa: 18_500,
    net_profit_trend_pct: 3.2,
    trips_today: 28,
    trips_today_trend_pct: 4.1,
    trips_completed_today: 24,
    trips_in_progress_today: 2,
    trips_cancelled_today: 2,
    drivers_approved: 98,
    drivers_total: 120,
    drivers_pending_kyc: 4,
    users_registered: 420,
    clients_ordered_today: 38,
    chart_flux: GLOBAL.chart_flux.map((d) => ({
      day: d.day,
      revenue: Math.round(d.revenue * 0.015),
      commission: Math.round(d.commission * 0.015),
    })),
    recent_trips: [
      {
        id: "sn-1",
        ref: "TR-SN-1201",
        service: "taxi",
        from_label: "Dakar, Plateau",
        to_label: "Dakar, Almadies",
        client_name: "Mamadou Fall",
        driver_name: "Aïssatou Diop",
        amount_fcfa: 3500,
        status: "completed",
        payment_method: "wallet",
        created_at: "2026-06-02T13:20:00Z",
      },
    ] as Trip[],
    active_zone: {
      franchise_id: 4,
      franchise_name: "Sénégal",
      partner_id: 38,
      partner_name: "Dakar Rides",
      zone_id: 5,
      zone_name: "Dakar — Plateau",
      city: "Dakar",
      trips_24h: 24,
      drivers_online: 78,
    },
  },
};

function franchiseOptions() {
  return FRANCHISES.map((f) => ({
    id: f.id,
    name: f.name,
    city: f.city,
  }));
}

function activityForFranchise(id: number) {
  const row = GLOBAL.franchise_activity.find((a) => a.franchise_id === id);
  if (!row) return [];
  return [row];
}

export function buildAdminDashboard(
  franchiseId: number | null
): DashboardAdminKpi {
  const options = franchiseOptions();

  if (!franchiseId) {
    return {
      ...structuredClone(GLOBAL),
      selected_franchise_id: null,
      franchise_options: options,
    };
  }

  const slice = FRANCHISE_SLICES[franchiseId];
  if (!slice) {
    return {
      ...structuredClone(GLOBAL),
      selected_franchise_id: null,
      franchise_options: options,
    };
  }

  const activity = activityForFranchise(franchiseId);

  return {
    ...slice,
    franchise_activity: activity,
    selected_franchise_id: franchiseId,
    franchise_options: options,
  };
}
