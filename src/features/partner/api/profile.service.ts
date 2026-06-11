import { apiClient } from "@/core/http/apiClient";
import { LINKS } from "@/core/api/links";
import type { PartnerProfile } from "@/shared/types";

// Format /v1/partners/me (auth)
interface PartnerMeApiResponse {
  status: string;
  generatedAt: string;
  profile: {
    id: string;
    first_name?: string;
    last_name?: string;
    display_name?: string;
    email?: string;
    phone?: string;
    avatar_url?: string | null;
    locale?: string;
    account_type?: string;
    created_at?: string;
    updated_at?: string;
    country_id?: string;
    city_id?: string;
  };
  partner: {
    id: string;
    trade_name?: string;
    status?: "active" | "pending" | "suspended";
    created_at?: string;
  } | null;
  franchiseMember: {
    franchise?: { name?: string };
  } | null;
}

// Format /v1/partners/{id} (enrichi)
interface PartnerDetailApiResponse {
  status: string;
  generatedAt: string;
  partner: {
    id: string;
    name?: string;
    trade_name?: string;
    legal_name?: string;
    partner_type?: string;
    status?: "active" | "pending" | "suspended";
    contact_email?: string;
    contact_phone?: string;
    address?: string;
    city_id?: string;
    cityLabel?: string;
    franchiseName?: string;
    registration_number?: string | null;
    created_at?: string;
  } | null;
  profile?: PartnerMeApiResponse["profile"];
}

type PartnerApiResponse = PartnerMeApiResponse | PartnerDetailApiResponse;

function mapProfileResponse(raw: PartnerApiResponse): PartnerProfile {
  // Format /v1/partners/{id} : tout est dans raw.partner
  if ("partner" in raw && raw.partner && ("contact_email" in raw.partner || "address" in raw.partner)) {
    const p = raw.partner;
    const profile: PartnerMeApiResponse["profile"] = ("profile" in raw ? raw.profile : undefined) ?? {
      id: "",
      first_name: "",
      last_name: "",
      display_name: "",
      email: "",
      phone: "",
      avatar_url: null,
      locale: "",
      account_type: "",
      created_at: "",
      updated_at: "",
      country_id: "",
      city_id: "",
    };

    return {
      id: p.id ?? "",
      company_name: p.trade_name ?? p.name ?? "",
      legal_name: p.legal_name ?? p.name ?? p.trade_name ?? "",
      contact_email: p.contact_email ?? "",
      contact_phone: p.contact_phone ?? "",
      notification_email: p.contact_email ?? "",
      address: p.address ?? "",
      city: p.cityLabel ?? "",
      franchise_name: p.franchiseName ?? "",
      rccm: p.registration_number ?? "",
      status: p.status ?? "active",
      created_at: p.created_at ?? "",
      display_name: p.legal_name ?? p.name,
      avatar_url: profile.avatar_url ?? null,
      locale: profile.locale,
      account_type: profile.account_type ?? p.partner_type,
      country_id: profile.country_id,
      city_id: p.city_id ?? profile.city_id,
    };
  }

  // Format /v1/partners/me
  const me = raw as PartnerMeApiResponse;
  const profile: PartnerMeApiResponse["profile"] = me.profile ?? {
    id: "",
    first_name: "",
    last_name: "",
    display_name: "",
    email: "",
    phone: "",
    avatar_url: null,
    locale: "",
    account_type: "",
    created_at: "",
    updated_at: "",
    country_id: "",
    city_id: "",
  };
  const partner: NonNullable<PartnerMeApiResponse["partner"]> = me.partner ?? {
    id: "",
    trade_name: "",
    status: "active",
    created_at: "",
  };
  const franchise = me.franchiseMember?.franchise;

  return {
    id: partner.id ?? profile.id ?? "",
    company_name: partner.trade_name ?? "",
    legal_name: profile.display_name ?? (profile.first_name && profile.last_name
      ? `${profile.first_name} ${profile.last_name}`
      : partner.trade_name ?? ""),
    contact_email: profile.email ?? "",
    contact_phone: profile.phone ?? "",
    notification_email: profile.email ?? "",
    address: "",
    city: "",
    franchise_name: franchise?.name ?? "",
    rccm: "",
    status: partner.status ?? "active",
    created_at: partner.created_at ?? profile.created_at ?? "",
    display_name: profile.display_name,
    avatar_url: profile.avatar_url,
    locale: profile.locale,
    account_type: profile.account_type,
    country_id: profile.country_id,
    city_id: profile.city_id,
  };
}

export interface PartnerDocument {
  id: string;
  type: string;
  label?: string;
  filename?: string;
  url?: string;
  status: "pending" | "approved" | "rejected";
  created_at?: string;
}

export interface PartnerDocumentsSummary {
  requiredCount: number;
  uploadedCount: number;
  approvedCount: number;
  pendingCount: number;
  rejectedCount: number;
  missingCount: number;
  missingTypes: string[];
  isComplete: boolean;
  hasAnyDocument: boolean;
}

interface PartnerDocumentsApiResponse {
  status?: string;
  documents?: PartnerDocument[];
  documentsSummary?: PartnerDocumentsSummary;
}

export interface CreatePartnerDocumentPayload {
  type: string;
  filename: string;
}

export const partnerProfileService = {
  me: async () => {
    const raw = await apiClient.get<PartnerMeApiResponse>(LINKS.partner.profile.me);
    return mapProfileResponse(raw);
  },
  get: async (partnerId: string | number) => {
    const raw = await apiClient.get<PartnerDetailApiResponse>(LINKS.partner.profile.get(partnerId));
    return mapProfileResponse(raw);
  },
  update: async (partnerId: string | number, data: Partial<PartnerProfile>) => {
    const raw = await apiClient.patch<PartnerDetailApiResponse>(LINKS.partner.profile.update(partnerId), data);
    return mapProfileResponse(raw);
  },
  listDocuments: async (partnerId: string | number): Promise<PartnerDocument[]> => {
    const raw = await apiClient.get<PartnerDocumentsApiResponse>(
      LINKS.partner.profile.documents.list(partnerId)
    );
    return raw.documents ?? [];
  },
  getDocumentsSummary: async (partnerId: string | number): Promise<PartnerDocumentsSummary | null> => {
    const raw = await apiClient.get<PartnerDocumentsApiResponse>(
      LINKS.partner.profile.documents.list(partnerId)
    );
    return raw.documentsSummary ?? null;
  },
  uploadDocument: (partnerId: string | number, data: CreatePartnerDocumentPayload) =>
    apiClient.post<PartnerDocument>(
      LINKS.partner.profile.documents.create(partnerId),
      data
    ),
};
