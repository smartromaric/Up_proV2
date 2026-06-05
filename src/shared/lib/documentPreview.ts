import type { KycDocument } from "@/shared/types";
import type { VehicleDocumentType } from "@/shared/types/vehicleDocuments";
import type { DriverKycDocumentType } from "@/shared/types/driverDocuments";

const KYC_PREVIEW: Record<KycDocument["type"], string> = {
  cni: "/document-previews/cni.svg",
  license: "/document-previews/license.svg",
  registration: "/document-previews/registration.svg",
  selfie: "/document-previews/selfie.svg",
};

const VEHICLE_PREVIEW: Record<VehicleDocumentType, string> = {
  registration: "/document-previews/registration.svg",
  insurance: "/document-previews/insurance.svg",
  technical_inspection: "/document-previews/technical-inspection.svg",
};

const DRIVER_PREVIEW: Record<DriverKycDocumentType, string> = {
  cni: "/document-previews/cni.svg",
  license: "/document-previews/license.svg",
  selfie: "/document-previews/selfie.svg",
};

export function resolveKycPreviewUrl(
  doc: Pick<KycDocument, "type" | "preview_url">
): string {
  return doc.preview_url ?? KYC_PREVIEW[doc.type];
}

/** Détecte un PDF depuis l’URL (y compris URLs signées Supabase). */
export function isPdfPreviewUrl(url: string): boolean {
  if (!url) return false;
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    return pathname.endsWith(".pdf");
  } catch {
    return url.toLowerCase().includes(".pdf");
  }
}

export function isRemoteKycPreviewUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

export function resolveVehicleDocumentPreview(type: VehicleDocumentType): string {
  return VEHICLE_PREVIEW[type];
}

export function resolveDriverDocumentPreview(type: DriverKycDocumentType): string {
  return DRIVER_PREVIEW[type];
}

export function isPdfFile(file: File): boolean {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

export function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}
