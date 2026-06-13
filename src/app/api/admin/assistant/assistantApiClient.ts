const API_ORIGIN = (
  process.env.NEXT_PUBLIC_API_URL ?? "https://api.upjunoo-dev.tech"
).replace(/\/$/, "");

export function assistantApiOrigin(): string {
  return API_ORIGIN;
}

export async function assistantApiGet<T>(
  path: string,
  authHeader: string
): Promise<T | null> {
  const response = await fetch(`${API_ORIGIN}${path}`, {
    headers: {
      Accept: "application/json",
      Authorization: authHeader,
      "X-Client-Type": "back-office",
    },
  });
  if (!response.ok) return null;
  return response.json() as Promise<T>;
}

export async function assistantApiPost<T>(
  path: string,
  authHeader: string,
  body?: Record<string, unknown>
): Promise<{ ok: boolean; data?: T; error?: string; status: number }> {
  const response = await fetch(`${API_ORIGIN}${path}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: authHeader,
      "X-Client-Type": "back-office",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text().catch(() => "");
  let data: T | undefined;
  try {
    data = text ? (JSON.parse(text) as T) : undefined;
  } catch {
    data = undefined;
  }
  return {
    ok: response.ok,
    data,
    error: text.slice(0, 300) || response.statusText,
    status: response.status,
  };
}

export async function assistantApiPatch(
  path: string,
  authHeader: string,
  body: Record<string, unknown>
): Promise<{ ok: boolean; error?: string; status: number }> {
  const response = await fetch(`${API_ORIGIN}${path}`, {
    method: "PATCH",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: authHeader,
      "X-Client-Type": "back-office",
    },
    body: JSON.stringify(body),
  });
  const text = await response.text().catch(() => "");
  return {
    ok: response.ok,
    error: text.slice(0, 300) || response.statusText,
    status: response.status,
  };
}

export function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

export function str(v: unknown): string {
  if (v == null) return "—";
  if (typeof v === "string" || typeof v === "number") return String(v);
  return "—";
}
