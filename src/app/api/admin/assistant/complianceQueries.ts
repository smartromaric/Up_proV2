import { LINKS } from "@/core/api/links";
import { buildV1ListQuery } from "@/core/api/v1Pagination";
import type { AssistantApiResponse } from "@/features/assistant/types";
import { assistantApiGet, record, str } from "./assistantApiClient";
import { searchEntityMatches, getItemId, getItemLabel, resolveDriverByQuery } from "./entityResolver";

export interface ComplianceCheckItem {
  label: string;
  ok: boolean;
  detail: string;
}

async function fetchDriverBundle(driverId: string, authHeader: string) {
  const paths = [
    LINKS.v1.drivers.getById(driverId),
    LINKS.admin.v1.driverById(driverId),
  ];
  for (const path of paths) {
    const data = await assistantApiGet<Record<string, unknown>>(path, authHeader);
    if (data) return data;
  }
  const list = await assistantApiGet<{ items?: Record<string, unknown>[] }>(
    `${LINKS.admin.v1.drivers}${buildV1ListQuery({ per_page: 200, page: 1 })}`,
    authHeader
  );
  return list?.items?.find((d) => String(d.id) === driverId) ?? null;
}

async function fetchDriverKycDocs(driverId: string, authHeader: string) {
  return assistantApiGet<{ items?: Record<string, unknown>[] }>(
    `${LINKS.admin.v1.kycDocuments}?subject_id=${encodeURIComponent(driverId)}&subject_type=DRIVER`,
    authHeader
  );
}

export async function buildDriverComplianceReport(
  driverId: string,
  authHeader: string,
  driverLabel?: string
): Promise<AssistantApiResponse> {
  const bundle = await fetchDriverBundle(driverId, authHeader);
  if (!bundle) {
    return { message: "Chauffeur introuvable.", action: null };
  }

  const driver = record(bundle.driver) ?? bundle;
  const profile = record(bundle.profile);
  const name =
    driverLabel ??
    ([profile?.firstName ?? profile?.first_name, profile?.lastName ?? profile?.last_name]
      .filter(Boolean)
      .join(" ") ||
      str(profile?.displayName ?? driver.driver_code));

  const account = str(
    driver.approval_status ?? driver.account_status ?? driver.accountStatus
  ).toLowerCase();
  const kyc = str(driver.kyc_status ?? driver.complianceStatus).toLowerCase();
  const availability = str(
    driver.availability_status ?? driver.availability ?? driver.availabilityStatus
  ).toLowerCase();

  const docsSummary = record(driver.documentsSummary) ?? record(bundle.documentsSummary);
  const missingTypes = (docsSummary?.missingTypes as string[] | undefined) ?? [];
  const missingCount = Number(docsSummary?.missingCount ?? missingTypes.length);

  const kycDocs = await fetchDriverKycDocs(driverId, authHeader);
  const pendingDocs = (kycDocs?.items ?? []).filter((d) => {
    const s = str(d.status).toLowerCase();
    return s === "pending" || s === "submitted" || s === "rejected";
  });

  const vehicle = record(bundle.vehicle) ?? record(bundle.summary)?.vehicle;
  const vehicleRec = vehicle as Record<string, unknown> | null;
  const hasVehicle = Boolean(
    driver.current_vehicle_id ?? vehicle ?? bundle.vehicleLabel ?? driver.vehicleLabel
  );

  const checks: ComplianceCheckItem[] = [
    {
      label: "Compte approuvé",
      ok: account === "approved",
      detail: account === "approved" ? "Compte actif" : `Statut : ${account}`,
    },
    {
      label: "KYC validé",
      ok: kyc === "approved" || kyc === "complete",
      detail: `KYC : ${kyc}`,
    },
    {
      label: "Documents complets",
      ok: missingCount === 0 && pendingDocs.length === 0,
      detail:
        missingCount > 0
          ? `${missingCount} type(s) manquant(s) : ${missingTypes.join(", ") || "voir fiche"}`
          : pendingDocs.length > 0
            ? `${pendingDocs.length} document(s) en attente de revue`
            : "Tous les documents requis sont présents",
    },
    {
      label: "Véhicule assigné",
      ok: hasVehicle,
      detail: hasVehicle
        ? str(
            bundle.vehicleLabel ??
              vehicleRec?.plate ??
              vehicleRec?.plateNumber ??
              "Oui"
          )
        : "Aucun véhicule lié",
    },
    {
      label: "Disponibilité",
      ok: availability === "online" || availability === "on_trip",
      detail: `Disponibilité : ${availability}`,
    },
  ];

  const canDrive =
    checks[0]!.ok && checks[1]!.ok && checks[2]!.ok && checks[3]!.ok;

  const lines = checks.map((c) => `${c.ok ? "✓" : "✗"} ${c.label} — ${c.detail}`);

  const blockers = checks.filter((c) => !c.ok).map((c) => c.label);

  return {
    message: [
      `Conformité chauffeur : ${name}`,
      "",
      canDrive
        ? "→ Peut rouler : OUI (sous réserve des règles métier en vigueur)."
        : `→ Peut rouler : NON${blockers.length ? ` — bloqué par : ${blockers.join(", ")}` : ""}.`,
      "",
      ...lines,
      pendingDocs.length
        ? `\nDocuments en attente :\n${pendingDocs
            .slice(0, 6)
            .map((d) => `• ${str(d.document_type_label ?? d.document_type_code)} (${str(d.status)})`)
            .join("\n")}`
        : "",
    ].join("\n"),
    action: { type: "OPEN_ENTITY", entity: "drivers", id: driverId },
  };
}

export async function resolveDriverComplianceByQuery(
  query: string,
  authHeader: string
): Promise<AssistantApiResponse> {
  const matches = await searchEntityMatches("drivers", query, authHeader);
  if (!matches.length) {
    return {
      message: `Aucun chauffeur trouvé pour « ${query} ».`,
      action: { type: "LIST_ENTITY", entity: "drivers" },
    };
  }
  const id = getItemId(matches[0]!);
  return buildDriverComplianceReport(
    id,
    authHeader,
    getItemLabel("drivers", matches[0]!)
  );
}

export async function buildVehicleComplianceReport(
  query: string,
  authHeader: string
): Promise<AssistantApiResponse> {
  const matches = await searchEntityMatches("vehicles", query, authHeader);
  if (!matches.length) {
    return {
      message: `Aucun véhicule trouvé pour « ${query} ».`,
      action: { type: "LIST_ENTITY", entity: "vehicles" },
    };
  }

  const v = matches[0]!;
  const id = getItemId(v);
  const plate = str(v.plate_number ?? v.plate);
  const status = str(v.approval_status ?? v.status).toLowerCase();
  const driver = str(v.driver_name ?? v.driver_id);

  const ok = status === "approved";
  const reasons: string[] = [];
  if (status === "pending") reasons.push("Validation carte grise / pièces en cours");
  if (status === "rejected") reasons.push("Véhicule rejeté — corriger les documents");
  if (status === "draft") reasons.push("Dossier véhicule incomplet");
  if (!v.driver_id && !v.driver_name) reasons.push("Aucun chauffeur assigné");

  return {
    message: [
      `Véhicule ${plate}`,
      ok ? "→ Validé pour rouler : OUI" : "→ Validé pour rouler : NON",
      `Statut : ${status}`,
      driver !== "—" ? `Chauffeur : ${driver}` : "Chauffeur : non assigné",
      reasons.length ? `\nRaisons / points d'attention :\n${reasons.map((r) => `• ${r}`).join("\n")}` : "",
    ].join("\n"),
    action: { type: "OPEN_ENTITY", entity: "vehicles", id },
  };
}

export async function buildDriverKycMissingReport(
  query: string,
  authHeader: string
): Promise<AssistantApiResponse> {
  const resolved = await resolveDriverByQuery(query, authHeader);
  if (!resolved) {
    return { message: `Aucun chauffeur pour « ${query} ».`, action: null };
  }
  const { id, label, item } = resolved;
  const kycDocs = await fetchDriverKycDocs(id, authHeader);
  const items = kycDocs?.items ?? [];

  const docsSummary = record(item.documentsSummary);
  const missingTypes = (docsSummary?.missingTypes as string[] | undefined) ?? [];

  const pending = items.filter((d) => {
    const s = str(d.status).toLowerCase();
    return s === "pending" || s === "submitted" || s === "rejected";
  });
  const approved = items.filter((d) => str(d.status).toLowerCase() === "approved");

  if (pending.length === 0 && missingTypes.length === 0 && approved.length > 0) {
    return {
      message: [
        `Pièces KYC — ${label}`,
        "",
        `✓ Tous les documents sont approuvés (${approved.length} pièce(s)).`,
        "",
        "Aucune action KYC requise. Vous pouvez recharger ou vérifier la conformité globale.",
      ].join("\n"),
      action: { type: "OPEN_ENTITY", entity: "drivers", id },
    };
  }

  const lines =
    pending.length > 0
      ? pending.map(
          (d) =>
            `• ${str(d.document_type_label ?? d.document_type_code)} (${str(d.document_side ?? "—")}) — ${str(d.status)}`
        )
      : missingTypes.length > 0
        ? missingTypes.map((t) => `• Manquant : ${t}`)
        : items.map(
            (d) =>
              `• ${str(d.document_type_label ?? d.document_type_code)} — ${str(d.status)}`
          );

  return {
    message: [
      `Pièces KYC — ${label}`,
      "",
      lines.length ? lines.join("\n") : "Aucune pièce enregistrée.",
      "",
      pending.length
        ? "Ouvrez la fiche pour valider ou rejeter chaque document en attente."
        : "Consultez la fiche chauffeur pour le détail.",
    ].join("\n"),
    action: { type: "OPEN_ENTITY", entity: "drivers", id },
  };
}
