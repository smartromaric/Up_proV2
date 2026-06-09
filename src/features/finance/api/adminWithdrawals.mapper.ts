import type { ApiV1Pagination } from "@/core/api/v1Pagination";
import { mapV1PaginationToMeta } from "@/core/api/v1Pagination";
import type { Paginated, Withdrawal, WithdrawalsResponse } from "@/shared/types";
import type { ListParams } from "@/shared/types/listParams";
import { paginateClientList } from "@/shared/lib/clientList";
import type {
  ApiAdminWithdrawalDetailItem,
  ApiAdminWithdrawalItem,
  ApiAdminWithdrawalsResponse,
} from "./adminWithdrawals.api.types";

export interface WithdrawalDetail extends Withdrawal {
  rejection_reason?: string;
  beneficiary_type?: string;
  wallet_id?: string;
  approved_by_name?: string;
  timeline: Array<{ type: string; at: string | null; label: string }>;
}

function mapWithdrawalMethod(
  destinationType?: string | null
): Withdrawal["method"] {
  const key = String(destinationType ?? "").toUpperCase();
  if (key.includes("BANK")) return "bank_transfer";
  if (key.includes("WALLET")) return "wallet";
  return "orange_money";
}

function mapWithdrawalStatus(status?: string | null): Withdrawal["status"] {
  const key = String(status ?? "pending").toLowerCase();
  if (key === "approved" || key === "paid") return "approved";
  if (key === "rejected" || key === "failed") return "rejected";
  return "pending";
}

export function mapAdminWithdrawalItemToWithdrawal(
  item: ApiAdminWithdrawalItem,
  franchiseNames?: Map<string, string>
): Withdrawal {
  const beneficiary =
    item.beneficiaryName ??
    item.ownerName ??
    (item.requested_by
      ? `Utilisateur ${String(item.requested_by).slice(0, 8)}`
      : "Bénéficiaire");

  const franchiseId =
    item.franchiseId ?? item.franchise_id ?? null;
  const franchiseFromApi = item.franchiseName?.trim();
  const franchiseFromLookup =
    franchiseId && franchiseNames?.get(String(franchiseId));

  return {
    id: item.id,
    owner_name: beneficiary,
    owner_id: item.ownerId ?? item.requested_by ?? null,
    amount_fcfa: item.amount_xof ?? item.amountXof ?? 0,
    method: mapWithdrawalMethod(item.destination_type ?? item.method),
    account_label: item.destination_identifier ?? "—",
    status: mapWithdrawalStatus(item.status),
    requested_at: item.created_at ?? new Date().toISOString(),
    processed_at: item.approved_at ?? item.paid_at ?? undefined,
    franchise_name: franchiseFromApi || franchiseFromLookup || "—",
    wallet_balance_fcfa: item.walletBalanceXof ?? 0,
  };
}

function withdrawalMatchesFilters(
  withdrawal: Withdrawal,
  params?: ListParams
): boolean {
  if (params?.status && withdrawal.status !== params.status) return false;
  return true;
}

export function mapAdminWithdrawalDetail(
  item: ApiAdminWithdrawalDetailItem,
  franchiseNames?: Map<string, string>
): WithdrawalDetail {
  const base = mapAdminWithdrawalItemToWithdrawal(item, franchiseNames);
  const franchiseName =
    item.franchise?.name?.trim() ||
    base.franchise_name ||
    "—";
  const beneficiary =
    item.beneficiary?.displayName?.trim() || base.owner_name;

  return {
    ...base,
    owner_name: beneficiary,
    owner_id: item.beneficiary?.id ?? base.owner_id,
    franchise_name: franchiseName,
    wallet_balance_fcfa:
      item.wallet?.balanceCachedXof ??
      item.wallet?.balance_cached_xof ??
      base.wallet_balance_fcfa,
    rejection_reason: item.rejectionReason ?? undefined,
    beneficiary_type: item.beneficiary?.type ?? undefined,
    wallet_id: item.wallet_id ?? item.wallet?.id,
    approved_by_name: item.approvedBy?.displayName ?? undefined,
    timeline: (item.timeline ?? []).map((step) => ({
      type: step.type ?? "event",
      at: step.at ?? null,
      label: step.label ?? step.type ?? "Événement",
    })),
  };
}

export function mapAdminWithdrawalsToResponse(
  response: ApiAdminWithdrawalsResponse,
  params?: ListParams,
  serverPagination?: ApiV1Pagination,
  franchiseNames?: Map<string, string>
): WithdrawalsResponse {
  const items = response.items ?? [];
  const mapped = items
    .map((item) => mapAdminWithdrawalItemToWithdrawal(item, franchiseNames))
    .filter((w) => withdrawalMatchesFilters(w, params));
  const pending = mapped.filter((w) => w.status === "pending");

  const apiSummary = response.summary;
  const summary = {
    pending_count: apiSummary?.pendingCount ?? pending.length,
    pending_amount_fcfa:
      apiSummary?.pendingAmountXof ??
      pending.reduce((s, w) => s + w.amount_fcfa, 0),
  };

  if (serverPagination) {
    return {
      data: mapped,
      meta: mapV1PaginationToMeta(serverPagination, params),
      summary,
    };
  }

  const page = paginateClientList(mapped, params, (w) =>
    withdrawalMatchesFilters(w, params)
  );

  return {
    ...page,
    summary,
  };
}
