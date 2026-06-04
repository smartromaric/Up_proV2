import fleetClientsList from "../data/fleet-clients-list.json";
import fleetClientDetail from "../data/fleet-client-detail.json";
import type { FleetClient } from "@/features/fleet/api/clients.service";
import { paginatedList, parseListQuery, matchesSearch } from "./listQuery";

export const clientStatusOverrides: Record<number, "active" | "suspended"> = {};

export function listFleetClients(request: Request) {
  const query = parseListQuery(request);
  let list = (fleetClientsList.data as FleetClient[]).filter((c) =>
    matchesSearch(query.search, c.full_name, c.email, c.phone, c.type)
  );
  if (query.status) list = list.filter((c) => c.status === query.status);
  if (query.type) list = list.filter((c) => c.type === query.type);
  return paginatedList(list, query);
}

export function getFleetClientDetail(id: number) {
  const fromList = (fleetClientsList.data as FleetClient[]).find((c) => c.id === id);
  const status =
    clientStatusOverrides[id] ?? fromList?.status ?? fleetClientDetail.status;
  return {
    ...fleetClientDetail,
    ...fromList,
    id: id || fleetClientDetail.id,
    status,
  };
}

export function suspendFleetClient(id: number) {
  clientStatusOverrides[id] = "suspended";
  const fromList = (fleetClientsList.data as FleetClient[]).find((c) => c.id === id);
  return {
    ok: true,
    message: "Client suspendu",
    client: {
      ...fleetClientDetail,
      ...fromList,
      id,
      status: "suspended" as const,
    },
  };
}

export function activateFleetClient(id: number) {
  clientStatusOverrides[id] = "active";
  const fromList = (fleetClientsList.data as FleetClient[]).find((c) => c.id === id);
  return {
    ok: true,
    message: "Client réactivé",
    client: {
      ...fleetClientDetail,
      ...fromList,
      id,
      status: "active" as const,
    },
  };
}
