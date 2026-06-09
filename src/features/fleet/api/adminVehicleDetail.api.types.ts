import type { ApiAdminKycDocumentItem } from "./adminKyc.api.types";
import type { ApiV1VehicleItem } from "./adminVehicles.api.types";

export interface ApiV1PartnerVehicleDriverEmbed {
  id: string;
  driver_code?: string | null;
  kyc_status?: string | null;
  approval_status?: string | null;
  availability_status?: string | null;
  ride_category_code?: string | null;
  profile?: {
    displayName?: string | null;
    first_name?: string | null;
    last_name?: string | null;
  } | null;
}

export interface ApiV1PartnerVehicleDetailItem extends ApiV1VehicleItem {
  driver?: ApiV1PartnerVehicleDriverEmbed | null;
  documents?: ApiAdminKycDocumentItem[];
}

export interface ApiV1PartnerVehicleDetailResponse {
  status?: string;
  generatedAt?: string;
  vehicle: ApiV1PartnerVehicleDetailItem;
}
