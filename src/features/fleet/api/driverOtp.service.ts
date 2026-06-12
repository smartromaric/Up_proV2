import { apiClient } from "@/core/http/apiClient";
import { LINKS } from "@/core/api/links";
import {
  buildInternationalPhone,
  extractLocalPhonePart,
} from "@/core/api/catalogLookup.service";

export interface DriverOtpPhoneParts {
  international: string;
  countryCode: string;
  localPhone: string;
}

export function parseDriverOtpPhone(
  internationalPhone: string,
  dialCode = "+225",
  countryCode = "CI"
): DriverOtpPhoneParts | null {
  const international = internationalPhone.replace(/\s/g, "").trim();
  const localRaw = extractLocalPhonePart(international, dialCode).replace(/\D/g, "");
  if (!international || localRaw.length < 8) return null;

  const localPhone = localRaw.startsWith("0") ? localRaw : `0${localRaw}`;
  return {
    international: buildInternationalPhone(dialCode, localPhone),
    countryCode: countryCode.toUpperCase(),
    localPhone,
  };
}

interface OtpSendResponse {
  status?: string;
  sent?: boolean;
  message?: string;
  error?: { message?: string; code?: string };
}

interface OtpVerifyResponse {
  status?: string;
  session?: { access_token?: string };
  accessToken?: string;
  message?: string;
  error?: { message?: string; code?: string };
}

interface DevOtpLastResponse {
  code?: string | null;
  devOtpCode?: string;
  hint?: string;
}

/** Envoie un OTP SMS pour valider le numéro (ne crée pas de fiche chauffeur). */
export async function sendDriverPhoneOtp(
  parts: DriverOtpPhoneParts
): Promise<void> {
  const response = await apiClient.post<OtpSendResponse>(LINKS.auth.v1.otpSend, {
    phone: parts.international,
    channel: "sms",
  });

  if (response.sent === false) {
    throw new Error("Impossible d'envoyer le code OTP.");
  }
}

/** Vérifie le code OTP — preuve de possession du numéro. */
export async function verifyDriverPhoneOtp(
  parts: DriverOtpPhoneParts,
  code: string
): Promise<void> {
  const token = code.replace(/\D/g, "").trim();
  if (token.length < 4) {
    throw new Error("Code OTP invalide.");
  }

  await apiClient.post<OtpVerifyResponse>(LINKS.auth.v1.otpVerify, {
    phone: parts.international,
    channel: "sms",
    token,
  });
}

/** Sandbox dev — dernier code émis (support interne). */
export async function fetchDevOtpLastCode(
  internationalPhone: string
): Promise<string | null> {
  const response = await apiClient.get<DevOtpLastResponse>(
    `${LINKS.auth.v1.devOtpLast}?phone=${encodeURIComponent(internationalPhone)}`
  );
  return response.code ?? response.devOtpCode ?? null;
}
