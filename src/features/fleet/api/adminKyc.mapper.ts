import type { ApiV1Pagination } from "@/core/api/v1Pagination";
import { mapV1PaginationToMeta } from "@/core/api/v1Pagination";
import type { KycQueueItem, Paginated } from "@/shared/types";
import type { ListParams } from "@/shared/types/listParams";
import { paginateClientList } from "@/shared/lib/clientList";
import type { ApiAdminDriverItem } from "./adminDrivers.api.types";
import type {
  ApiAdminKycDocumentItem,
  ApiAdminKycQueueItem,
} from "./adminKyc.api.types";

function hoursSince(iso?: string): number {
  if (!iso) return 0;
  const ms = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.round(ms / 3_600_000));
}

export function groupKycDocumentsByDriver(
  docs: ApiAdminKycDocumentItem[],
  driversById: Map<string, ApiAdminDriverItem>
): KycQueueItem[] {
  const byDriver = new Map<string, ApiAdminKycDocumentItem[]>();

  for (const doc of docs) {
    if (String(doc.subject_type ?? "").toUpperCase() !== "DRIVER") continue;
    const driverId = doc.subject_id;
    if (!driverId) continue;
    const bucket = byDriver.get(driverId) ?? [];
    bucket.push(doc);
    byDriver.set(driverId, bucket);
  }

  const rows: KycQueueItem[] = [];

  for (const [driverId, driverDocs] of byDriver) {
    const pending = driverDocs.filter(
      (d) => String(d.status ?? "").toLowerCase() === "pending"
    ).length;
    const rejected = driverDocs.filter(
      (d) => String(d.status ?? "").toLowerCase() === "rejected"
    ).length;
    if (pending === 0 && rejected === 0) continue;

    const driver = driversById.get(driverId);
    const label =
      driver?.profile?.displayName?.trim() ??
      driver?.driver_code?.trim() ??
      `Chauffeur ${driverId.slice(0, 8)}`;
    const submittedAt =
      driverDocs
        .map((d) => d.submitted_at ?? d.created_at)
        .filter(Boolean)
        .sort()[0] ?? new Date().toISOString();

    rows.push({
      driver_id: driverId,
      first_name: label,
      last_name: "",
      phone: "—",
      zone:
        driver?.zoneName ??
        (driver?.city_id ? String(driver.city_id).slice(0, 8) : "—"),
      owner_name:
        driver?.partnerName ??
        (driver?.partner_id
          ? `Partenaire ${String(driver.partner_id).slice(0, 8)}`
          : "—"),
      documents_pending: pending,
      documents_rejected: rejected,
      submitted_at: submittedAt,
      waiting_hours: hoursSince(submittedAt),
    });
  }

  return rows.sort(
    (a, b) => b.waiting_hours - a.waiting_hours
  );
}

export function mapAdminKycToPaginated(
  docs: ApiAdminKycDocumentItem[],
  driversById: Map<string, ApiAdminDriverItem>,
  params?: ListParams
): Paginated<KycQueueItem> {
  const rows = groupKycDocumentsByDriver(docs, driversById);
  return paginateClientList(rows, params);
}

function parseSubmittedAt(value?: string | null): string {
  if (!value) return new Date().toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

export function mapNativeKycQueueItem(item: ApiAdminKycQueueItem): KycQueueItem {
  const display = item.displayName?.trim();
  const first = item.firstName?.trim();
  const last = item.lastName?.trim();
  const submittedAt = parseSubmittedAt(item.submittedAt);

  return {
    driver_id: item.driverId,
    first_name: first || display || `Chauffeur ${item.driverId.slice(0, 8)}`,
    last_name: last || (first || display ? "" : ""),
    phone: item.phone?.trim() || "—",
    zone: item.zoneName?.trim() || "—",
    owner_name: item.partnerName?.trim() || "—",
    documents_pending: item.documentsPending ?? 0,
    documents_rejected: item.documentsRejected ?? 0,
    submitted_at: submittedAt,
    waiting_hours: item.waitingHours ?? hoursSince(submittedAt),
  };
}

export function mapNativeKycQueueToPaginated(
  items: ApiAdminKycQueueItem[],
  params?: ListParams,
  serverPagination?: ApiV1Pagination
): Paginated<KycQueueItem> {
  const rows = items.map(mapNativeKycQueueItem);
  if (serverPagination) {
    return {
      data: rows,
      meta: mapV1PaginationToMeta(serverPagination, params),
    };
  }
  return paginateClientList(rows, params);
}
