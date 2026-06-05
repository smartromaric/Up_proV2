/**
 * Compare SWAGGER.md local vs OpenAPI live (/docs/json) + probe nouvelles routes admin.
 */
import fs from "fs";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://api.upjunoo-dev.tech";
const EMAIL = process.env.TEST_ADMIN_EMAIL ?? "dev.admin@upjunoo-dev.tech";
const PASSWORD = process.env.TEST_ADMIN_PASSWORD ?? "Upjunoo@Dev2026!";

const local = fs.readFileSync(new URL("../SWAGGER.md", import.meta.url), "utf8");
const localPaths = new Set([...local.matchAll(/"(\/v1\/[^"]+)"/g)].map((m) => m[1]));

const spec = await (await fetch(`${API}/docs/json`)).json();
const livePaths = new Set(Object.keys(spec.paths));

const onlyLive = [...livePaths].filter((p) => !localPaths.has(p)).sort();
const onlyLocal = [...localPaths].filter((p) => !livePaths.has(p)).sort();

console.log(`\nLive OpenAPI v${spec.info.version} — ${livePaths.size} paths`);
console.log(`Local SWAGGER.md — ${localPaths.size} paths`);
console.log(`\n=== NOUVEAU sur Swagger live (${onlyLive.length}) ===`);
for (const p of onlyLive) console.log(` + ${p}`);

console.log(`\n=== Présent local mais absent live (${onlyLocal.length}) ===`);
for (const p of onlyLocal) console.log(` - ${p}`);

const loginRes = await fetch(`${API}/v1/auth/login`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Client-Type": "back-office",
  },
  body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
});
const loginJson = await loginRes.json();
const token = loginJson.accessToken ?? loginJson.session?.access_token;
if (!token) {
  console.error("Login failed");
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${token}`,
  Accept: "application/json",
  "X-Client-Type": "back-office",
};

function probePath(p) {
  return p
    .replace(/\{serviceType\}/g, "RIDE")
    .replace(/\{countryCode\}/g, "CI")
    .replace(/\{key\}/g, "test")
    .replace(/\{resource\}/g, "cities")
    .replace(/\{[^}]+\}/g, "00000000-0000-0000-0000-000000000001");
}

const adminNew = onlyLive.filter((p) => p.includes("/admin/"));
console.log(`\n=== Probe routes admin nouvelles (${adminNew.length}) ===`);
for (const p of adminNew) {
  const res = await fetch(`${API}${probePath(p)}`, { headers });
  let hint = "";
  try {
    const j = await res.json();
    hint = j?.error?.code ?? j?.status ?? "";
  } catch {
    hint = "";
  }
  console.log(` [${res.status}] ${p}${hint ? ` (${hint})` : ""}`);
}

// Détail champs clés sur filter-options et orders
console.log("\n=== Échantillons réponses nouvelles routes ===");
for (const path of [
  "/v1/admin/filter-options",
  "/v1/admin/franchises?page=1&limit=5",
  "/v1/admin/partners?page=1&limit=5",
]) {
  const res = await fetch(`${API}${path}`, { headers });
  const j = await res.json();
  const keys = j ? Object.keys(j) : [];
  console.log(`\n${path} [${res.status}] keys=${keys.join(", ")}`);
  if (path.includes("filter-options")) {
    console.log(JSON.stringify(j, null, 2).slice(0, 1200));
  }
}
