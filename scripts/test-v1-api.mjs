/**
 * Smoke test des routes v1 documentées dans ECARTS-API-V1-BACKOFFICE.md
 * Usage: node scripts/test-v1-api.mjs
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://api.upjunoo-dev.tech";
const EMAIL = process.env.TEST_ADMIN_EMAIL ?? "dev.admin@upjunoo-dev.tech";
const PASSWORD = process.env.TEST_ADMIN_PASSWORD ?? "Upjunoo@Dev2026!";

const results = [];

async function request(path, { method = "GET", token, body } = {}) {
  const url = `${API_URL}${path}`;
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Client-Type": "back-office",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let json = null;
  const text = await res.text();
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text.slice(0, 200) };
  }

  return { status: res.status, ok: res.ok, json };
}

function record(name, ok, detail) {
  results.push({ name, ok, detail });
  const icon = ok ? "✓" : "✗";
  console.log(`${icon} ${name}${detail ? ` — ${detail}` : ""}`);
}

async function main() {
  console.log(`\nAPI: ${API_URL}\n`);

  // 1. Auth login
  const login = await request("/v1/auth/login", {
    method: "POST",
    body: { email: EMAIL, password: PASSWORD },
  });
  const token =
    login.json?.accessToken ??
    login.json?.session?.access_token ??
    null;
  record(
    "POST /v1/auth/login",
    login.ok && Boolean(token),
    login.ok ? `role=${login.json?.userType ?? login.json?.role}` : `HTTP ${login.status}`
  );

  if (!token) {
    console.log("\nArrêt : impossible de s'authentifier.");
    process.exit(1);
  }

  // 2. Auth me
  const me = await request("/v1/auth/me", { token });
  record(
    "GET /v1/auth/me",
    me.ok,
    me.ok ? `email=${me.json?.profile?.email ?? me.json?.email ?? "?"}` : `HTTP ${me.status}`
  );

  let sampleOrderId = null;

  const endpoints = [
    ["GET /v1/admin/dashboard", "/v1/admin/dashboard"],
    ["GET /v1/admin/live-map", "/v1/admin/live-map?includeWithoutLocation=true"],
    ["GET /v1/admin/orders", "/v1/admin/orders"],
    ["GET /v1/admin/drivers", "/v1/admin/drivers"],
    ["GET /v1/admin/kyc/documents", "/v1/admin/kyc/documents"],
    ["GET /v1/admin/partners", "/v1/admin/partners"],
    ["GET /v1/admin/withdrawals", "/v1/admin/withdrawals"],
    ["GET /v1/admin/users", "/v1/admin/users"],
    ["GET /v1/admin/vehicles", "/v1/admin/vehicles"],
  ];

  for (const [label, path] of endpoints) {
    const res = await request(path, { token });
    const detail = describeResponse(label, res);
    record(label, res.ok, detail);
    if (label.includes("orders") && !label.includes("orderId") && res.ok) {
      sampleOrderId = res.json?.rides?.[0]?.id ?? null;
    }
  }

  if (sampleOrderId) {
    const detailRes = await request(
      `/v1/admin/orders/${sampleOrderId}`,
      { token }
    );
    const hasClient = detailRes.json?.order?.clientName ? "clientName OK" : "";
    record(
      "GET /v1/admin/orders/{orderId}",
      detailRes.ok,
      detailRes.ok
        ? `${hasClient} events=${detailRes.json?.order?.events?.length ?? 0}`
        : `HTTP ${detailRes.status}`
    );
  }

  // Forgot password URL check
  const forgotOld = await request("/v1/auth/forgot-password", {
    method: "POST",
    body: { email: EMAIL },
  });
  const forgotNew = await request("/v1/auth/password/forgot", {
    method: "POST",
    body: { email: EMAIL },
  });
  record(
    "POST /v1/auth/forgot-password",
    forgotOld.ok || [200, 202].includes(forgotOld.status),
    `HTTP ${forgotOld.status}`
  );
  record(
    "POST /v1/auth/password/forgot (alias)",
    forgotNew.ok || [200, 202, 400].includes(forgotNew.status),
    `HTTP ${forgotNew.status}`
  );

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} OK`);
  if (failed.length) {
    console.log("\nÉchecs :");
    for (const f of failed) console.log(`  - ${f.name}: ${f.detail}`);
    process.exit(1);
  }
}

function describeResponse(label, res) {
  if (!res.ok) return `HTTP ${res.status} — ${res.json?.error?.message ?? res.json?.message ?? "erreur"}`;
  const j = res.json;

  if (label.includes("dashboard")) {
    return `trips_today=${j?.trips_today ?? j?.tripsToday ?? "?"}`;
  }
  if (label.includes("live-map")) {
    const drivers = j?.drivers?.length ?? 0;
    const rides = j?.rides?.length ?? 0;
    return `${drivers} drivers, ${rides} rides`;
  }
  if (label.includes("orders")) {
    const rides = j?.rides?.length ?? 0;
    const deliveries = j?.deliveries?.length ?? 0;
    return `${rides} rides, ${deliveries} deliveries`;
  }
  if (label.includes("drivers")) {
    return `${j?.items?.length ?? 0} items`;
  }
  if (label.includes("kyc")) {
    return `${j?.items?.length ?? j?.documents?.length ?? 0} docs`;
  }
  if (label.includes("partners")) {
    return `${j?.items?.length ?? 0} items`;
  }
  if (label.includes("withdrawals")) {
    return `${j?.items?.length ?? 0} items`;
  }
  if (label.includes("users")) {
    return `HTTP ${res.status}`;
  }
  if (label.includes("vehicles")) {
    return `${j?.items?.length ?? 0} items`;
  }
  return "OK";
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
