import type { AdminVehicleDetail, KycDocument } from "@/shared/types";
import type { ApiAdminKycDocumentItem } from "./adminKyc.api.types";
import type {
  ApiV1PartnerVehicleDetailItem,
  ApiV1PartnerVehicleDetailResponse,
  ApiV1PartnerVehicleDriverEmbed,
} from "./adminVehicleDetail.api.types";
import { mapApiVehicleToVehicleDetail } from "./adminVehicles.mapper";
import { mapApiKycItemToKycDocument } from "./kycDocument.mapper";
import type { VehicleCatalogLookups } from "./vehicleCatalog.service";

function driverEmbedLabel(
  driver?: ApiV1PartnerVehicleDriverEmbed | null
): string | null {
  if (!driver) return null;
  const profile = driver.profile;
  const name =
    profile?.displayName?.trim() ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim();
  if (name) return name;
  if (driver.driver_code?.trim()) return driver.driver_code.trim();
  return `Chauffeur ${driver.id.slice(0, 8)}`;
}

function mapVehicleDocuments(
  documents?: ApiAdminKycDocumentItem[]
): KycDocument[] {
  return (documents ?? []).map(mapApiKycItemToKycDocument);
}

function pickRegistrationDocument(
  documents: KycDocument[],
  fallbackUploadedAt?: string
): KycDocument {
  const registration =
    documents.find((doc) => doc.type === "registration") ?? documents[0];

  if (registration) return registration;

  return {
    id: "missing-registration",
    type: "registration",
    label: "Carte grise",
    status: "pending",
    uploaded_at: fallbackUploadedAt ?? "",
    reviewed_at: null,
  };
}

export function mapPartnerVehicleDetailResponse(
  response: ApiV1PartnerVehicleDetailResponse,
  lookups?: VehicleCatalogLookups
): AdminVehicleDetail {
  const item: ApiV1PartnerVehicleDetailItem = response.vehicle;
  const documents = mapVehicleDocuments(item.documents);
  const base = mapApiVehicleToVehicleDetail(item, lookups);
  const driverName = driverEmbedLabel(item.driver);

  return {
    ...base,
    driver_id: item.driver_id ?? item.driver?.id ?? null,
    driver_name: driverName,
    vin: item.vin?.trim() || null,
    updated_at: item.updated_at ?? base.created_at,
    documents,
    registration_document: pickRegistrationDocument(documents, base.created_at),
    approved_at: item.approved_at ?? null,
  };
}
