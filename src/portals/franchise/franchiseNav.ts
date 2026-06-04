import type { NavGroup } from "@/portals/shared/navTypes";

export const FRANCHISE_NAV: NavGroup[] = [
  {
    group: "TERRITOIRE",
    items: [
      {
        label: "Tableau de bord",
        path: "/franchise/dashboard",
        icon: "dashboard",
        permission: "ops.dashboard.view",
      },
      {
        label: "Carte live",
        path: "/franchise/map",
        icon: "map",
        permission: "ops.map.view",
      },
      {
        label: "Courses",
        path: "/franchise/trips",
        icon: "trips",
        permission: "ops.trips.view",
      },
      {
        label: "Console dispatch",
        path: "/franchise/dispatch",
        icon: "dispatch",
        permission: "ops.dispatch.view",
      },
      {
        label: "Carte territoire",
        path: "/franchise/territory",
        icon: "territory",
        permission: "ops.dashboard.view",
      },
      {
        label: "Extension territoire",
        path: "/franchise/territory/extension",
        icon: "territory",
        permission: "ops.dashboard.view",
      },
      {
        label: "Tarification",
        path: "/franchise/pricing",
        icon: "finance",
        permission: "ops.dashboard.view",
      },
    ],
  },
  {
    group: "FLOTTE",
    items: [
      {
        label: "Partenaires",
        path: "/franchise/partners",
        icon: "partners",
        permission: "network.partners.view",
      },
      {
        label: "Chauffeurs",
        path: "/franchise/drivers",
        icon: "drivers",
        permission: "fleet.drivers.view",
      },
      {
        label: "Modération KYC",
        path: "/franchise/drivers/moderation",
        icon: "drivers-pending",
        permission: "fleet.kyc.approve",
      },
      {
        label: "Clients",
        path: "/franchise/clients",
        icon: "clients",
        permission: "fleet.drivers.view",
      },
    ],
  },
  {
    group: "FINANCE",
    items: [
      {
        label: "Finance locale",
        path: "/franchise/finance",
        icon: "finance",
        permission: "finance.wallets.view",
      },
      {
        label: "Commissions",
        path: "/franchise/finance/commissions",
        icon: "commissions",
        permission: "finance.wallets.view",
      },
      {
        label: "Réconciliation",
        path: "/franchise/finance/reconciliation",
        icon: "reconciliation",
        permission: "finance.wallets.view",
      },
      {
        label: "Recharges partenaires",
        path: "/franchise/finance/partner-transfers",
        icon: "wallet",
        permission: "finance.wallets.view",
      },
      {
        label: "Recharges chauffeurs",
        path: "/franchise/finance/driver-transfers",
        icon: "wallet-transfer",
        permission: "finance.wallets.view",
      },
    ],
  },
  {
    group: "MARKETING",
    items: [
      {
        label: "Codes promo",
        path: "/franchise/promos",
        icon: "promo",
        permission: "ops.dashboard.view",
      },
      {
        label: "Campagnes",
        path: "/franchise/marketing/campaigns",
        icon: "campaigns",
        permission: "ops.dashboard.view",
      },
      {
        label: "Bannières",
        path: "/franchise/marketing/banners",
        icon: "banners",
        permission: "ops.dashboard.view",
      },
    ],
  },
  {
    group: "SUPPORT",
    items: [
      {
        label: "Tickets",
        path: "/franchise/support",
        icon: "support",
        permission: "network.partners.view",
      },
      {
        label: "Chat",
        path: "/franchise/support/chat",
        icon: "chat",
        permission: "network.partners.view",
      },
    ],
  },
];
