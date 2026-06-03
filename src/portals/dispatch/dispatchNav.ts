import type { NavGroup } from "@/portals/shared/navTypes";

export const DISPATCH_NAV: NavGroup[] = [
  {
    group: "DISPATCH",
    items: [
      {
        label: "Console",
        path: "/dispatch/console",
        icon: "dispatch",
        permission: "ops.dispatch.view",
      },
      {
        label: "Réserver course",
        path: "/dispatch/book",
        icon: "book",
        permission: "ops.dispatch.assign",
      },
      {
        label: "Carte live",
        path: "/dispatch/map",
        icon: "map",
        permission: "ops.map.view",
      },
    ],
  },
];
