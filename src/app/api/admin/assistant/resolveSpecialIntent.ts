import type { AssistantApiResponse } from "@/features/assistant/types";
import {
  buildDriverComplianceReport,
  buildDriverKycMissingReport,
  buildVehicleComplianceReport,
  resolveDriverComplianceByQuery,
} from "./complianceQueries";
import { buildDriverLocationReport, buildLiveOnlineReport } from "./liveMapQueries";
import {
  buildDisputeSummaryReport,
  buildSupportTicketSummaryReport,
} from "./supportQueries";
import { buildDriverWalletReport, buildPartnerRevenueReport, buildPartnerWalletReport } from "./walletQueries";
import { buildDriverWorkflowReport } from "./workflowQueries";
import type { SpecialIntent } from "./specialIntent";

export async function resolveSpecialIntent(
  intent: SpecialIntent,
  authHeader: string
): Promise<AssistantApiResponse> {
  switch (intent.kind) {
    case "COMPLIANCE_DRIVER":
      if (intent.driverId) {
        return buildDriverComplianceReport(
          intent.driverId,
          authHeader,
          intent.query
        );
      }
      return resolveDriverComplianceByQuery(intent.query, authHeader);
    case "COMPLIANCE_VEHICLE":
      return buildVehicleComplianceReport(intent.query, authHeader);
    case "KYC_MISSING":
      return buildDriverKycMissingReport(intent.query, authHeader);
    case "WALLET_DRIVER":
      return buildDriverWalletReport(intent.query, authHeader, intent.driverId);
    case "WALLET_PARTNER":
      return buildPartnerWalletReport(intent.query, authHeader);
    case "PARTNER_REVENUE":
      return buildPartnerRevenueReport(intent.query, authHeader);
    case "DISPUTE_SUMMARY":
      return buildDisputeSummaryReport(intent.query, authHeader);
    case "TICKET_SUMMARY":
      return buildSupportTicketSummaryReport(intent.query, authHeader);
    case "LIVE_LOCATION":
      return buildDriverLocationReport(intent.query, authHeader);
    case "LIVE_ONLINE":
      return buildLiveOnlineReport(authHeader);
    case "WORKFLOW_DRIVER":
      return buildDriverWorkflowReport(intent.query, authHeader);
    default:
      return { message: "Commande non reconnue.", action: null };
  }
}
