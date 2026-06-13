import type { AssistantApiResponse } from "@/features/assistant/types";
import {
  buildDriverComplianceReport,
  buildDriverKycMissingReport,
} from "./complianceQueries";
import { buildDriverWalletReport } from "./walletQueries";
import { searchEntityMatches, getItemId, getItemLabel } from "./entityResolver";
import { str } from "./assistantApiClient";

export async function buildDriverWorkflowReport(
  query: string,
  authHeader: string
): Promise<AssistantApiResponse> {
  const matches = await searchEntityMatches("drivers", query, authHeader);
  if (!matches.length) {
    return {
      message: `Aucun chauffeur pour « ${query} ».`,
      action: { type: "LIST_ENTITY", entity: "drivers" },
    };
  }

  const id = getItemId(matches[0]!);
  const label = getItemLabel("drivers", matches[0]!);
  const d = matches[0]!;

  const [compliance, kyc, wallet] = await Promise.all([
    buildDriverComplianceReport(id, authHeader, label),
    buildDriverKycMissingReport(query, authHeader),
    buildDriverWalletReport(query, authHeader),
  ]);

  const account = str(d.approval_status ?? d.account_status).toLowerCase();
  const kycStatus = str(d.kyc_status).toLowerCase();

  const steps: string[] = [
    "1. Résumé dossier",
    `   ${label} — compte ${account}, KYC ${kycStatus}`,
    "",
    "2. Conformité",
    ...compliance.message.split("\n").slice(2, 8).map((l) => `   ${l}`),
    "",
    "3. Pièces KYC",
    ...kyc.message
      .split("\n")
      .slice(2, 7)
      .map((l) => `   ${l}`),
    "",
    "4. Wallet",
    ...wallet.message
      .split("\n")
      .slice(1, 3)
      .map((l) => `   ${l}`),
    "",
    "Actions suggérées :",
    account !== "approved" ? "• Approuver le compte si dossier complet" : null,
    kycStatus !== "approved" ? "• Valider les documents KYC en attente" : null,
    "• Ouvrir la fiche pour suspendre / activer / recharger",
  ].filter(Boolean) as string[];

  return {
    message: [`Workflow dossier chauffeur — ${label}`, "", ...steps].join("\n"),
    action: { type: "OPEN_ENTITY", entity: "drivers", id },
  };
}
