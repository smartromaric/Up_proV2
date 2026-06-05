/**
 * Compare SWAGGER.md paths (admin/partner/franchise/dispatch) vs live API probe.
 */
import fs from "fs";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://api.upjunoo-dev.tech";
const EMAIL = process.env.TEST_ADMIN_EMAIL ?? "dev.admin@upjunoo-dev.tech";
const PASSWORD = process.env.TEST_ADMIN_PASSWORD ?? "Upjunoo@Dev2026!";

const swaggerText = fs.readFileSync(new URL("../SWAGGER.md", import.meta.url), "utf8");
const pathRe = /"(\/v1\/(?:admin|franchise|franchises|partner|partners|dispatch)[^"]*)"/g;
const swaggerPaths = new Set();
let m;
while ((m = pathRe.exec(swaggerText))) swaggerPaths.add(m[1]);

const IMPLEMENTED = new Set([
  // Auth
  "/v1/auth/login", "/v1/auth/me", "/v1/auth/logout",
  // Admin v1
  "/v1/admin/dashboard",
  "/v1/admin/live-map",
  "/v1/admin/orders",
  "/v1/admin/orders/{orderId}",
  "/v1/admin/drivers",
  "/v1/admin/kyc/documents",
  "/v1/admin/kyc/documents/{id}/approve",
  "/v1/admin/kyc/documents/{id}/reject",
  "/v1/admin/franchises",
  "/v1/admin/kyc/queue",
  "/v1/admin/partners",
  "/v1/admin/users/{id}",
  "/v1/admin/withdrawals",
  "/v1/admin/withdrawals/{id}/approve",
  "/v1/admin/withdrawals/{id}/reject",
  "/v1/admin/users",
  "/v1/drivers/{id}",
  // Franchise portal (composed)
  "/v1/franchises/me",
  "/v1/franchises/{id}",
  "/v1/franchises/{id}/partners",
  "/v1/franchises/{id}/drivers",
  "/v1/franchises/{id}/orders",
  "/v1/franchises/{id}/revenue",
  "/v1/partners/{id}",
  // Dispatch detail
  "/v1/dispatch/{serviceType}/{orderId}/status",
  "/v1/dispatch/{serviceType}/{orderId}/logs",
  // Catalog bootstrap (villes)
  "/v1/catalog/bootstrap",
]);

async function request(path, { method = "GET", token, body } = {}) {
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Client-Type": "back-office",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = { raw: text.slice(0, 80) }; }
  return { status: res.status, ok: res.ok, json };
}

function normalizeForProbe(p) {
  return p
    .replace(/\{orderId\}/g, "00000000-0000-0000-0000-000000000001")
    .replace(/\{id\}/g, "00000000-0000-0000-0000-000000000001")
    .replace(/\{orderId\}/g, "00000000-0000-0000-0000-000000000001")
    .replace(/\{serviceType\}/g, "RIDE")
    .replace(/\{rideId\}/g, "00000000-0000-0000-0000-000000000001")
    .replace(/\{deliveryId\}/g, "00000000-0000-0000-0000-000000000001")
    .replace(/\{offerId\}/g, "00000000-0000-0000-0000-000000000001")
    .replace(/\{memberId\}/g, "00000000-0000-0000-0000-000000000001")
    .replace(/\{deviceId\}/g, "00000000-0000-0000-0000-000000000001")
    .replace(/\{offerId\}/g, "00000000-0000-0000-0000-000000000001")
    .replace(/\{countryCode\}/g, "CI")
    .replace(/\{key\}/g, "test")
    .replace(/\{resource\}/g, "cities")
    .replace(/\{roleId\}/g, "00000000-0000-0000-0000-000000000001");
}

async function main() {
  const login = await request("/v1/auth/login", {
    method: "POST",
    body: { email: EMAIL, password: PASSWORD },
  });
  const token = login.json?.accessToken ?? login.json?.session?.access_token;
  if (!token) {
    console.error("Login failed", login.status);
    process.exit(1);
  }

  const sorted = [...swaggerPaths].sort();
  const notImplemented = sorted.filter((p) => !IMPLEMENTED.has(p));

  console.log(`\nSwagger paths (admin/partner/franchise/dispatch): ${sorted.length}`);
  console.log(`Référencés implémentés front: ${IMPLEMENTED.size}`);
  console.log(`Non implémentés (swagger): ${notImplemented.length}\n`);

  const groups = {
    admin: [],
    franchise: [],
    partner: [],
    dispatch: [],
  };
  for (const p of notImplemented) {
    if (p.startsWith("/v1/admin")) groups.admin.push(p);
    else if (p.startsWith("/v1/franchise")) groups.franchise.push(p);
    else if (p.startsWith("/v1/partners") || p.startsWith("/v1/partner")) groups.partner.push(p);
    else if (p.startsWith("/v1/dispatch")) groups.dispatch.push(p);
  }

  for (const [label, items] of Object.entries(groups)) {
    console.log(`\n=== ${label.toUpperCase()} (${items.length} non implémentés) ===`);
    for (const p of items) {
      const probe = normalizeForProbe(p);
      const res = await request(probe, { token });
      const code = res.json?.error?.code ?? res.json?.code ?? "";
      const err = res.json?.error?.message ?? res.json?.message ?? "";
      const tag = res.status === 404 ? "404" : res.status === 501 ? "501" : res.ok ? "200" : String(res.status);
      console.log(`  [${tag}] ${p}${code ? ` (${code})` : ""}`);
    }
  }
}

main().catch(console.error);
