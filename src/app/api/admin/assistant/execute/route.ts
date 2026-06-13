import { NextRequest, NextResponse } from "next/server";
import { LINKS } from "@/core/api/links";
import type { AssistantExecuteType } from "@/features/assistant/types";
import { assistantApiPatch, assistantApiPost } from "../assistantApiClient";

interface ExecuteBody {
  type?: AssistantExecuteType;
  driverId?: string;
  documentId?: string;
  partnerId?: string;
  amountFcfa?: number;
  rejectionReason?: string;
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ message: "Authentification requise." }, { status: 401 });
  }

  let body: ExecuteBody;
  try {
    body = (await req.json()) as ExecuteBody;
  } catch {
    return NextResponse.json({ message: "Corps JSON invalide." }, { status: 400 });
  }

  const type = body.type;
  if (!type) {
    return NextResponse.json({ message: "Type requis." }, { status: 400 });
  }

  let successMessage = "Action effectuée.";

  switch (type) {
    case "suspend_driver":
    case "activate_driver":
    case "set_driver_offline":
    case "set_driver_online": {
      const driverId = body.driverId?.trim();
      if (!driverId) {
        return NextResponse.json({ message: "driverId requis." }, { status: 400 });
      }
      const path = LINKS.admin.v1.driverById(driverId);
      let patchBody: Record<string, unknown> = {};
      switch (type) {
        case "suspend_driver":
          patchBody = { approval_status: "suspended", account_status: "suspended" };
          successMessage = "Chauffeur suspendu.";
          break;
        case "activate_driver":
          patchBody = { approval_status: "approved", account_status: "approved" };
          successMessage = "Chauffeur activé.";
          break;
        case "set_driver_offline":
          patchBody = { availability_status: "offline", availability: "offline" };
          successMessage = "Chauffeur mis hors ligne.";
          break;
        case "set_driver_online":
          patchBody = { availability_status: "online", availability: "online" };
          successMessage = "Chauffeur mis en ligne.";
          break;
      }
      const response = await assistantApiPatch(path, authHeader, patchBody);
      if (!response.ok) {
        return NextResponse.json(
          { message: response.error ?? `Erreur API ${response.status}` },
          { status: response.status }
        );
      }
      break;
    }

    case "approve_kyc_document": {
      const documentId = body.documentId?.trim();
      if (!documentId) {
        return NextResponse.json({ message: "documentId requis." }, { status: 400 });
      }
      const response = await assistantApiPost(
        LINKS.admin.v1.kycApprove(documentId),
        authHeader
      );
      if (!response.ok) {
        return NextResponse.json(
          { message: response.error ?? `Erreur API ${response.status}` },
          { status: response.status }
        );
      }
      successMessage = "Document KYC approuvé.";
      break;
    }

    case "reject_kyc_document": {
      const documentId = body.documentId?.trim();
      if (!documentId) {
        return NextResponse.json({ message: "documentId requis." }, { status: 400 });
      }
      const response = await assistantApiPost(
        LINKS.admin.v1.kycReject(documentId),
        authHeader,
        { reason: body.rejectionReason ?? "Document non conforme" }
      );
      if (!response.ok) {
        return NextResponse.json(
          { message: response.error ?? `Erreur API ${response.status}` },
          { status: response.status }
        );
      }
      successMessage = "Document KYC rejeté.";
      break;
    }

    case "approve_driver_kyc": {
      const driverId = body.driverId?.trim();
      if (!driverId) {
        return NextResponse.json({ message: "driverId requis." }, { status: 400 });
      }
      const response = await assistantApiPost(
        LINKS.admin.v1.driverApprove(driverId),
        authHeader
      );
      if (!response.ok) {
        return NextResponse.json(
          { message: response.error ?? `Erreur API ${response.status}` },
          { status: response.status }
        );
      }
      successMessage = "KYC chauffeur approuvé.";
      break;
    }

    case "recharge_driver": {
      const driverId = body.driverId?.trim();
      const partnerId = body.partnerId?.trim();
      const amount = body.amountFcfa;
      if (!driverId || !partnerId || !amount || amount <= 0) {
        return NextResponse.json(
          { message: "driverId, partnerId et amountFcfa requis." },
          { status: 400 }
        );
      }
      const response = await assistantApiPost(
        LINKS.v1.partners.driverRecharge(partnerId),
        authHeader,
        { driver_id: driverId, amount_fcfa: amount, amount_xof: amount }
      );
      if (!response.ok) {
        return NextResponse.json(
          { message: response.error ?? `Erreur API ${response.status}` },
          { status: response.status }
        );
      }
      successMessage = `Recharge de ${amount.toLocaleString("fr-FR")} FCFA effectuée.`;
      break;
    }

    default:
      return NextResponse.json({ message: "Action non supportée." }, { status: 400 });
  }

  return NextResponse.json({ ok: true, message: successMessage });
}
