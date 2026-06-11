import type { ExtractionDocumentType } from "@/features/fleet/lib/documentExtraction.types";

export const EXTRACTION_PROMPTS: Record<ExtractionDocumentType, string> = {
  cni: `Tu analyses une carte nationale d'identité (Côte d'Ivoire ou Afrique de l'Ouest). Les images peuvent être recto, verso, ou les deux.
Extrais UNIQUEMENT un objet JSON valide (sans markdown) avec cette structure :
{
  "driver": {
    "first_name": "string ou null",
    "last_name": "string ou null",
    "document_number": "string ou null",
    "confidence": 0.0 à 1.0
  },
  "warnings": ["string en français"]
}
Si un champ est illisible, mets null et ajoute un avertissement en français.`,

  license: `Tu analyses un permis de conduire (recto et/ou verso).
Extrais UNIQUEMENT un objet JSON valide :
{
  "driver": {
    "first_name": "string ou null",
    "last_name": "string ou null",
    "document_number": "string ou null",
    "confidence": 0.0 à 1.0
  },
  "warnings": ["string en français"]
}`,

  registration: `Tu analyses une carte grise / certificat d'immatriculation véhicule.
Extrais UNIQUEMENT un objet JSON valide :
{
  "vehicle": {
    "plate": "string ou null",
    "brand": "string ou null",
    "model": "string ou null",
    "year": number ou null,
    "color": "string ou null",
    "confidence": 0.0 à 1.0
  },
  "warnings": ["string en français"]
}
Pour "year", extrais l'année de la date de 1ère mise en circulation (première immatriculation), pas l'année de fabrication.
N'ajoute un avertissement que si un champ est illisible ou ambigu — pas pour expliquer la règle sur l'année.
Tous les avertissements doivent être courts et en français.`,
};

export function buildTextStructuringPrompt(
  documentType: ExtractionDocumentType,
  ocrText: string
): string {
  return `${EXTRACTION_PROMPTS[documentType]}

Le texte suivant a été extrait par OCR (PaddleOCR). Interprète-le et produis le JSON demandé.

--- TEXTE OCR ---
${ocrText}
--- FIN TEXTE OCR ---`;
}
