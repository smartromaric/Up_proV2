import { getPaddleOcrBaseUrl } from "./config";

type PaddleOcrLine = { text?: unknown; confidence?: unknown };

function guessImageMime(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    case "bmp":
      return "image/bmp";
    case "heic":
    case "heif":
      return "image/heic";
    default:
      return "image/jpeg";
  }
}

function lineText(line: unknown): string {
  if (!line || typeof line !== "object" || !("text" in line)) return "";
  const text = (line as PaddleOcrLine).text;
  return typeof text === "string" ? text.trim() : String(text ?? "").trim();
}

/** Réponse normalisée de deploy/paddleocr-api (full_text + lines[].text). */
export function extractTextFromPaddleResponse(payload: unknown): string {
  if (payload == null) return "";

  if (typeof payload === "string") {
    return payload.trim();
  }

  if (typeof payload !== "object") return "";

  const record = payload as Record<string, unknown>;

  if (typeof record.full_text === "string" && record.full_text.trim()) {
    return record.full_text.trim();
  }

  if (Array.isArray(record.lines)) {
    const fromLines = record.lines.map(lineText).filter(Boolean);
    if (fromLines.length) return fromLines.join("\n");
  }

  const parts: string[] = [];
  collectLegacyStrings(payload, parts);
  const unique = [...new Set(parts.map((p) => p.trim()).filter(Boolean))];
  return unique.join("\n").trim();
}

function collectLegacyStrings(value: unknown, out: string[]): void {
  if (value == null) return;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed) out.push(trimmed);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectLegacyStrings(item, out);
    return;
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const key of [
      "text",
      "transcription",
      "words",
      "txt",
      "markdown_result",
      "content",
      "full_text",
    ]) {
      if (key in record) collectLegacyStrings(record[key], out);
    }
    if (Array.isArray(record.words_block_list)) {
      for (const block of record.words_block_list) {
        if (block && typeof block === "object" && "words" in block) {
          collectLegacyStrings((block as { words?: unknown }).words, out);
        }
      }
    }
    if (Array.isArray(record.details)) {
      for (const detail of record.details) {
        if (detail && typeof detail === "object" && "text" in detail) {
          collectLegacyStrings((detail as { text?: unknown }).text, out);
        }
      }
    }
    if (Array.isArray(record.rec_texts)) {
      collectLegacyStrings(record.rec_texts, out);
    }
    if (record.result && typeof record.result === "object") {
      collectLegacyStrings(record.result, out);
    }
  }
}

async function fileToUploadBlob(file: File): Promise<{ blob: Blob; filename: string }> {
  const filename = file.name || "upload.jpg";
  const mime =
    file.type?.startsWith("image/") ? file.type : guessImageMime(filename);

  if (mime === "application/pdf" || filename.toLowerCase().endsWith(".pdf")) {
    throw new Error(
      "PaddleOCR n'accepte que les images (JPEG, PNG). Exportez le PDF en photo ou utilisez DOCUMENT_EXTRACT_PROVIDER=openrouter."
    );
  }

  const buffer = await file.arrayBuffer();
  if (!buffer.byteLength) {
    throw new Error("PaddleOCR : fichier vide.");
  }

  return {
    blob: new Blob([buffer], { type: mime }),
    filename,
  };
}

export async function runPaddleOcrOnFile(file: File): Promise<string> {
  const baseUrl = getPaddleOcrBaseUrl();
  const { blob, filename } = await fileToUploadBlob(file);
  const form = new FormData();
  form.append("file", blob, filename);

  const response = await fetch(`${baseUrl}/ocr`, {
    method: "POST",
    body: form,
  });

  const rawBody = await response.text();

  if (!response.ok) {
    throw new Error(
      `PaddleOCR (${response.status}): ${rawBody.slice(0, 300) || response.statusText}`
    );
  }

  let json: unknown;
  try {
    json = JSON.parse(rawBody) as unknown;
  } catch {
    json = { full_text: rawBody };
  }

  const extracted = extractTextFromPaddleResponse(json);
  if (!extracted) {
    const lineCount =
      json && typeof json === "object" && "line_count" in json
        ? String((json as { line_count?: unknown }).line_count ?? 0)
        : "?";
    throw new Error(
      `PaddleOCR : aucun texte détecté dans l'image (${lineCount} ligne(s) OCR). Vérifiez la netteté ou passez en mode openrouter.`
    );
  }
  return extracted;
}

export async function runPaddleOcrOnFiles(files: File[]): Promise<string> {
  const chunks: string[] = [];
  for (const file of files) {
    const text = await runPaddleOcrOnFile(file);
    chunks.push(text);
  }
  return chunks.join("\n\n---\n\n").trim();
}
