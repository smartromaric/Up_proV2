import type {
  DocumentExtractionResult,
  ExtractionDocumentType,
} from "@/features/fleet/lib/documentExtraction.types";
import {
  getOpenRouterModel,
  getOpenRouterStructureModel,
  type DocumentExtractProvider,
} from "./config";
import { buildTextStructuringPrompt, EXTRACTION_PROMPTS } from "./prompts";
import { parseJsonFromContent } from "./parseJson";
import { callOpenRouterChat, fileToDataUrl } from "./openrouterClient";
import { runPaddleOcrOnFiles } from "./paddleOcrClient";

function mapParsedToResult(
  documentType: ExtractionDocumentType,
  parsed: Record<string, unknown>
): DocumentExtractionResult {
  return {
    documentType,
    driver: (parsed.driver as DocumentExtractionResult["driver"]) ?? null,
    vehicle: (parsed.vehicle as DocumentExtractionResult["vehicle"]) ?? null,
    warnings: Array.isArray(parsed.warnings)
      ? (parsed.warnings as string[])
      : [],
    error: null,
  };
}

async function structureWithOpenRouterText(
  apiKey: string,
  documentType: ExtractionDocumentType,
  ocrText: string
): Promise<DocumentExtractionResult> {
  const content = await callOpenRouterChat({
    apiKey,
    model: getOpenRouterStructureModel(),
    content: [{ type: "text", text: buildTextStructuringPrompt(documentType, ocrText) }],
  });

  const parsed = parseJsonFromContent(content);
  if (!parsed) {
    return {
      documentType,
      warnings: [
        "OCR PaddleOK — structuration JSON échouée, saisissez les champs manuellement.",
      ],
      error: "Réponse IA non interprétable",
    };
  }

  return mapParsedToResult(documentType, parsed);
}

export async function extractWithOpenRouterVision(
  apiKey: string,
  documentType: ExtractionDocumentType,
  files: File[]
): Promise<DocumentExtractionResult> {
  const imageParts = await Promise.all(
    files.map(async (file) => ({
      type: "image_url" as const,
      image_url: { url: await fileToDataUrl(file) },
    }))
  );

  const content = await callOpenRouterChat({
    apiKey,
    model: getOpenRouterModel(),
    content: [{ type: "text", text: EXTRACTION_PROMPTS[documentType] }, ...imageParts],
  });

  const parsed = parseJsonFromContent(content);
  if (!parsed) {
    return {
      documentType,
      warnings: ["Format JSON invalide — saisissez les champs manuellement."],
      error: "Réponse IA non interprétable",
    };
  }

  return mapParsedToResult(documentType, parsed);
}

export async function extractWithPaddleOcr(
  apiKey: string | undefined,
  documentType: ExtractionDocumentType,
  files: File[]
): Promise<DocumentExtractionResult> {
  const ocrText = await runPaddleOcrOnFiles(files);

  if (!apiKey?.trim()) {
    return {
      documentType,
      warnings: [
        "OCR Paddle effectué — OPENROUTER_API_KEY requis pour structurer les champs (mode texte).",
      ],
      error: "Structuration IA non configurée",
    };
  }

  return structureWithOpenRouterText(apiKey, documentType, ocrText);
}

export async function runDocumentExtraction(
  provider: DocumentExtractProvider,
  apiKey: string | undefined,
  documentType: ExtractionDocumentType,
  files: File[]
): Promise<DocumentExtractionResult> {
  if (provider === "paddle") {
    return extractWithPaddleOcr(apiKey, documentType, files);
  }
  if (!apiKey?.trim()) {
    return {
      documentType,
      warnings: [],
      error: "OPENROUTER_API_KEY manquant sur le serveur.",
    };
  }
  return extractWithOpenRouterVision(apiKey, documentType, files);
}
