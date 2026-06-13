import { LINKS } from "@/core/api/links";
import type { AdminEntityKey } from "@/features/assistant/catalog/adminEntities";
import type { AssistantPageContext } from "@/features/assistant/lib/assistantPageContext";
import { ENTITY_DETAIL_API } from "@/features/assistant/catalog/adminEntities";

const API_ORIGIN = (
  process.env.NEXT_PUBLIC_API_URL ?? "https://api.upjunoo-dev.tech"
).replace(/\/$/, "");

async function apiGet<T>(
  path: string,
  authHeader: string | null
): Promise<T | null> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "X-Client-Type": "back-office",
  };
  if (authHeader) headers.Authorization = authHeader;

  const response = await fetch(`${API_ORIGIN}${path}`, { headers });
  if (!response.ok) return null;
  return response.json() as Promise<T>;
}

function str(v: unknown): string {
  if (v == null) return "—";
  if (typeof v === "string" || typeof v === "number") return String(v);
  return "—";
}

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function summarizeDriver(data: Record<string, unknown>): string {
  const profile = record(data.profile);
  const driver = record(data.driver) ?? data;
  const summary = record(data.summary);
  const partner = record(data.partner);
  const vehicle = record(data.vehicle) ?? record(summary?.vehicle);

  const firstName =
    profile?.first_name ??
    profile?.firstName ??
    driver.first_name ??
    driver.firstName ??
    data.firstName;
  const lastName =
    profile?.last_name ??
    profile?.lastName ??
    driver.last_name ??
    driver.lastName ??
    data.lastName;
  const name =
    [firstName, lastName].filter(Boolean).join(" ") ||
    str(summary?.displayName ?? summary?.name ?? profile?.displayName ?? data.driver_code ?? "Chauffeur");

  const lines = [
    name,
    `Compte : ${str(driver.approval_status ?? driver.account_status ?? data.accountStatus ?? data.approval_status)}`,
    `Disponibilité : ${str(driver.availability_status ?? driver.availability ?? data.availability ?? data.availability_status)}`,
    `KYC : ${str(driver.kyc_status ?? driver.compliance_status ?? data.kyc_status ?? data.complianceStatus)}`,
    `Téléphone : ${str(profile?.phone ?? summary?.phone ?? data.phone)}`,
    `Zone : ${str(data.zoneName ?? record(data.city)?.name ?? driver.zone ?? data.zone_name)}`,
  ];

  const partnerName =
    partner?.trade_name ??
    partner?.tradeName ??
    data.partnerName ??
    data.partner_name;
  if (partnerName) lines.push(`Partenaire : ${str(partnerName)}`);

  const summaryVehicle = record(summary?.vehicle);
  const plate =
    vehicle?.plateNumber ??
    vehicle?.plate ??
    vehicle?.license_plate ??
    summaryVehicle?.plate ??
    data.vehicleLabel ??
    data.vehicle_label;
  if (plate) lines.push(`Véhicule : ${str(plate)}`);

  const orders = driver.total_completed_orders ?? data.total_completed_orders;
  if (orders != null) lines.push(`Courses terminées : ${Number(orders)}`);
  const rating = driver.rating_avg ?? data.rating_avg;
  if (rating != null) lines.push(`Note moyenne : ${Number(rating).toFixed(1)}`);

  return lines.join("\n");
}

function summarizeVehicle(data: Record<string, unknown>): string {
  const v = record(data.vehicle) ?? data;
  const plate = str(v.plate_number ?? v.plateNumber ?? v.plate);
  const lines = [
    `Véhicule ${plate}`,
    `Marque / modèle : ${str(v.brand)} ${str(v.model)}`,
    `Validation : ${str(v.approval_status ?? v.status)}`,
    `Partenaire : ${str(v.partner_name ?? v.partnerName ?? v.partner_id)}`,
    `Chauffeur : ${str(v.driver_name ?? v.driverName ?? v.driver_id)}`,
  ];
  return lines.join("\n");
}

function summarizeTrip(data: Record<string, unknown>): string {
  const o = record(data.order) ?? data;
  const lines = [
    `Course ${str(o.ref ?? o.id).slice(0, 16)}`,
    `Statut : ${str(o.status)}`,
    `Client : ${str(o.client_name ?? o.user_name ?? o.clientName)}`,
    `Chauffeur : ${str(o.driver_name ?? o.driverName)}`,
    `Montant : ${o.amount_xof != null ? `${Number(o.amount_xof).toLocaleString("fr-FR")} FCFA` : "—"}`,
    `Trajet : ${str(o.pickup_address ?? o.pickupAddress)} → ${str(o.dropoff_address ?? o.dropoffAddress)}`,
  ];
  return lines.join("\n");
}

function summarizePartner(data: Record<string, unknown>): string {
  const p = record(data.partner) ?? data;
  const lines = [
    str(p.name ?? p.trade_name ?? p.tradeName),
    `Ville : ${str(p.city)}`,
    `Statut : ${str(p.status ?? p.approval_status)}`,
    `Chauffeurs : ${str(p.drivers_count ?? p.driver_count ?? p.driversCount)}`,
    `Véhicules : ${str(p.vehicles_count ?? p.vehicle_count ?? p.vehiclesCount)}`,
  ];
  return lines.join("\n");
}

function summarizeGeneric(entity: AdminEntityKey, data: Record<string, unknown>): string {
  const label = str(
    data.name ?? data.title ?? data.label ?? data.ref ?? data.id
  ).slice(0, 80);
  return `${entity} — ${label || "Fiche ouverte"}`;
}

async function fetchDriverDetail(
  driverId: string,
  authHeader: string | null
): Promise<Record<string, unknown> | null> {
  const paths = [
    LINKS.v1.drivers.getById(driverId),
    LINKS.admin.v1.driverById(driverId),
  ];

  for (const path of paths) {
    const data = await apiGet<Record<string, unknown>>(path, authHeader);
    if (data) return data;
  }

  const list = await apiGet<{ items?: Record<string, unknown>[] }>(
    `${LINKS.admin.v1.drivers}?per_page=200&page=1`,
    authHeader
  );
  const item = list?.items?.find((d) => String(d.id) === driverId);
  return item ?? null;
}

async function fetchEntityDetail(
  entity: AdminEntityKey,
  entityId: string,
  authHeader: string | null
): Promise<Record<string, unknown> | null> {
  if (entity === "drivers") {
    return fetchDriverDetail(entityId, authHeader);
  }

  const detailApi = ENTITY_DETAIL_API[entity];
  if (!detailApi) return null;
  return apiGet<Record<string, unknown>>(detailApi(entityId), authHeader);
}

export async function fetchPageSummaryText(
  context: AssistantPageContext,
  authHeader: string | null
): Promise<string | null> {
  if (!context.entity || !context.entityId) return null;

  const data = await fetchEntityDetail(context.entity, context.entityId, authHeader);
  if (!data) return null;

  switch (context.entity) {
    case "drivers":
      return summarizeDriver(data);
    case "vehicles":
      return summarizeVehicle(data);
    case "trips":
      return summarizeTrip(data);
    case "partners":
      return summarizePartner(data);
    default:
      return summarizeGeneric(context.entity, data);
  }
}

export async function fetchDriverComplianceHints(
  driverId: string,
  authHeader: string | null
): Promise<string[]> {
  const hints: string[] = [];
  const driver = await fetchDriverDetail(driverId, authHeader);
  if (!driver) return hints;

  const d = record(driver.driver) ?? driver;
  const profile = record(driver.profile);

  const account = str(d.approval_status ?? d.account_status);
  const kyc = str(d.kyc_status ?? d.compliance_status);

  if (account === "pending") hints.push("Compte chauffeur en attente de validation.");
  if (account === "suspended") hints.push("Compte suspendu — activation requise avant opérations.");
  if (kyc.includes("pending") || kyc.includes("review")) {
    hints.push("KYC incomplet ou en revue.");
  }
  if (!profile?.phone && !d.phone) hints.push("Numéro de téléphone manquant.");

  const kycDocs = await apiGet<{ items?: Array<{ status?: string }> }>(
    `${LINKS.admin.v1.kycDocuments}?subject_id=${encodeURIComponent(driverId)}&subject_type=driver`,
    authHeader
  ).catch(() => null);

  const pendingDocs = (kycDocs?.items ?? []).filter(
    (i) => i.status === "pending" || i.status === "submitted"
  ).length;
  if (pendingDocs > 0) {
    hints.push(`${pendingDocs} document(s) KYC en attente de traitement.`);
  }

  return hints;
}

export async function summarizeEntityById(
  entity: AdminEntityKey,
  entityId: string,
  authHeader: string | null
): Promise<string | null> {
  return fetchPageSummaryText(
    { pathname: "", entity, entityId },
    authHeader
  );
}
