import type { ApiV1Pagination } from "@/core/api/v1Pagination";
import { mapV1PaginationToMeta } from "@/core/api/v1Pagination";
import type { Paginated } from "@/shared/types";
import type { ListParams } from "@/shared/types/listParams";
import { paginateClientList } from "@/shared/lib/clientList";
import { mapApiOrderStatus, orderRef } from "@/features/admin/api/adminOrder.shared";
import type { FleetClient, FleetClientDetail } from "./clients.service";
import type {
  ApiAdminUserDetailResponse,
  ApiAdminUserItem,
} from "./adminUsers.api.types";

function mapUserStatus(status?: string | null): FleetClient["status"] {
  const key = String(status ?? "active").toLowerCase();
  return key === "suspended" ? "suspended" : "active";
}

export function mapAdminUserItemToFleetClient(
  item: ApiAdminUserItem
): FleetClient {
  return {
    id: item.id,
    full_name: item.fullName?.trim() || item.email || `Client ${item.id.slice(0, 8)}`,
    phone: item.phone ?? "—",
    email: item.email ?? null,
    type: "b2c",
    status: mapUserStatus(item.status),
    trips_count: item.tripsCount ?? 0,
    wallet_balance_fcfa: item.walletBalanceXof ?? 0,
    registered_at: item.createdAt ?? new Date().toISOString(),
    last_trip_at: null,
  };
}

function clientMatchesFilters(client: FleetClient, params?: ListParams): boolean {
  if (params?.status && params.status !== "all" && client.status !== params.status) {
    return false;
  }
  if (params?.type && params.type !== "all" && client.type !== params.type) {
    return false;
  }
  if (params?.search?.trim()) {
    const q = params.search.trim().toLowerCase();
    const haystack = [client.full_name, client.phone, client.email ?? ""]
      .join(" ")
      .toLowerCase();
    if (!haystack.includes(q)) return false;
  }
  return true;
}

export function mapAdminUsersToPaginated(
  users: ApiAdminUserItem[],
  params?: ListParams,
  serverPagination?: ApiV1Pagination
): Paginated<FleetClient> {
  const clients = users
    .filter((u) => String(u.userType ?? "CLIENT").toUpperCase() === "CLIENT")
    .map(mapAdminUserItemToFleetClient)
    .filter((c) => clientMatchesFilters(c, params));

  if (serverPagination) {
    return {
      data: clients,
      meta: mapV1PaginationToMeta(serverPagination, params),
    };
  }

  return paginateClientList(clients, params, (c) =>
    clientMatchesFilters(c, params)
  );
}

export function mapAdminUserDetailToFleetClientDetail(
  response: ApiAdminUserDetailResponse
): FleetClientDetail {
  const user = response.user;
  if (!user?.id) {
    throw new Error("USER_NOT_FOUND");
  }

  const base = mapAdminUserItemToFleetClient(user);
  const completed = response.profile?.orders_completed_count ?? base.trips_count;
  const wallet = base.wallet_balance_fcfa;

  return {
    ...base,
    stats: {
      trips_total: completed,
      trips_cancelled: 0,
      wallet_balance_fcfa: wallet,
      total_spent_fcfa: 0,
      avg_fare_fcfa: 0,
    },
    recent_trips: (response.recentOrders ?? []).map((order) => ({
      id: order.id ?? "",
      ref: order.order_reference ?? (order.id ? orderRef(order as { id: string; order_reference?: string | null }) : "—"),
      from_label: order.pickup_address ?? "—",
      to_label: order.dropoff_address ?? "—",
      status: mapApiOrderStatus(order.status),
      amount_fcfa: order.final_price_xof ?? order.estimated_price_xof ?? 0,
      created_at: order.created_at ?? new Date().toISOString(),
    })),
  };
}
