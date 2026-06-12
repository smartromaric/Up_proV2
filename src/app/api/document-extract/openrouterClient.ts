const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

type OpenRouterContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export async function callOpenRouterChat(options: {
  apiKey: string;
  model: string;
  content: OpenRouterContentPart[];
  temperature?: number;
}): Promise<string> {
  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      "X-Title": "UpJunoo Pro",
    },
    body: JSON.stringify({
      model: options.model,
      temperature: options.temperature ?? 0.1,
      messages: [{ role: "user", content: options.content }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenRouter: ${response.status} — ${errText.slice(0, 300)}`);
  }

  const completion = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return completion.choices?.[0]?.message?.content ?? "";
}

export async function fileToDataUrl(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const mime = file.type || "image/jpeg";
  return `data:${mime};base64,${buffer.toString("base64")}`;
}
