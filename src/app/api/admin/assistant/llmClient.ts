import type { AssistantChatMessage, AssistantPageContext } from "@/features/assistant/types";
import { buildAssistantSystemPrompt } from "./prompt";

function llmBaseUrl(): string {
  const raw =
    process.env.LLM_BASE_URL ?? "https://uat.upjunoo.com/llm-api";
  return raw.replace(/\/$/, "");
}

function llmModel(): string {
  return process.env.LLM_MODEL ?? "qwen2.5:7b-instruct-q4_K_M";
}

export async function chatWithLlm(
  messages: AssistantChatMessage[],
  context?: AssistantPageContext
): Promise<string> {
  const url = `${llmBaseUrl()}/api/chat`;
  const body = {
    model: llmModel(),
    messages: [
      { role: "system", content: buildAssistantSystemPrompt(context) },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ],
    stream: false,
    format: "json",
    options: {
      temperature: 0.2,
      num_predict: 512,
    },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `LLM indisponible (${response.status})${text ? `: ${text.slice(0, 200)}` : ""}`
    );
  }

  const data = (await response.json()) as {
    message?: { content?: string };
  };
  const content = data.message?.content?.trim();
  if (!content) {
    throw new Error("Réponse LLM vide");
  }
  return content;
}
