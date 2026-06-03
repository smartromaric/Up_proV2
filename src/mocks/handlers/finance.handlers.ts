import { http, HttpResponse } from "msw";
import withdrawals from "../data/withdrawals.json";
import financeWallets from "../data/finance-wallets.json";
import financeCommissions from "../data/finance-commissions.json";
import financeReconciliation from "../data/finance-reconciliation.json";
import {
  TRANSACTIONS_CATALOG,
  filterTransactions,
} from "../lib/transactionsCatalog";
import { paginatedList, parseListQuery, matchesSearch } from "../lib/listQuery";
import type {
  PlatformDriverRechargeStats,
  PlatformDriverTransfer,
  Withdrawal,
} from "@/shared/types";
import driverTransfersPlatformSeed from "../data/driver-wallet-transfers-platform.json";

const withdrawalsData = withdrawals.data as Withdrawal[];

const platformTransfersSeed = driverTransfersPlatformSeed as {
  stats: PlatformDriverRechargeStats;
  data: PlatformDriverTransfer[];
};

let platformDriverTransfers: PlatformDriverTransfer[] = [
  ...platformTransfersSeed.data,
];
let platformRechargeStats: PlatformDriverRechargeStats = {
  ...platformTransfersSeed.stats,
};

function filterWithdrawals(rows: Withdrawal[], query: ReturnType<typeof parseListQuery>) {
  let list = rows.filter((w) =>
    matchesSearch(query.search, w.id, w.owner_name, w.franchise_name, w.account_label)
  );
  if (query.status) {
    list = list.filter((w) => w.status === query.status);
  }
  return list;
}

function filterWallets(rows: typeof financeWallets.data, query: ReturnType<typeof parseListQuery>) {
  let list = rows.filter((w) =>
    matchesSearch(query.search, w.owner_name, w.owner_type, w.id, w.franchise_name)
  );
  if (query.type) {
    list = list.filter((w) => w.owner_type === query.type);
  }
  return list;
}

export const financeHandlers = [
  http.get("*/api/v2/admin/finance/transactions", ({ request }) => {
    const query = parseListQuery(request);
    const filtered = filterTransactions(TRANSACTIONS_CATALOG, query);
    return HttpResponse.json(paginatedList(filtered, query));
  }),

  http.get("*/api/v2/admin/finance/wallets", ({ request }) => {
    const query = parseListQuery(request);
    const filtered = filterWallets(financeWallets.data, query);
    return HttpResponse.json(paginatedList(filtered, query));
  }),

  http.get("*/api/v2/admin/finance/commissions", ({ request }) => {
    const query = parseListQuery(request);
    let filtered = financeCommissions.data.filter((c) =>
      matchesSearch(query.search, c.franchise_name, c.period_label)
    );
    if (query.status) {
      filtered = filtered.filter((c) => c.status === query.status);
    }
    return HttpResponse.json(paginatedList(filtered, query));
  }),

  http.get("*/api/v2/admin/finance/reconciliation", ({ request }) => {
    const query = parseListQuery(request);
    const filtered = financeReconciliation.data.filter((r) =>
      matchesSearch(query.search, r.date_label, r.source, r.id)
    );
    if (query.status) {
      return HttpResponse.json(
        paginatedList(
          filtered.filter((r) => r.status === query.status),
          query
        )
      );
    }
    return HttpResponse.json(paginatedList(filtered, query));
  }),

  http.get("*/api/v2/admin/finance/withdrawals", ({ request }) => {
    const query = parseListQuery(request);
    const filtered = filterWithdrawals(withdrawalsData, query);
    const page = paginatedList(filtered, query);
    return HttpResponse.json({ ...page, summary: withdrawals.summary });
  }),

  http.post("*/api/v2/admin/finance/withdrawals/:id/approve", () => {
    return HttpResponse.json({ ok: true });
  }),

  http.post("*/api/v2/admin/finance/withdrawals/:id/reject", () => {
    return HttpResponse.json({ ok: true });
  }),

  http.get("*/api/v2/admin/finance/driver-transfers/stats", () => {
    return HttpResponse.json(platformRechargeStats);
  }),

  http.get("*/api/v2/admin/finance/driver-transfers", ({ request }) => {
    const query = parseListQuery(request);
    let list = platformDriverTransfers.filter((t) =>
      matchesSearch(
        query.search,
        t.ref,
        t.driver_name,
        t.driver_phone,
        t.owner_name,
        t.note ?? ""
      )
    );
    if (query.type && query.type !== "all") {
      list = list.filter((t) => t.source === query.type);
    }
    return HttpResponse.json(paginatedList(list, query));
  }),
];
