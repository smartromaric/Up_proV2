/**
 * Scan Swagger live — endpoints et schémas liés aux commissions
 * Usage: node scripts/scan-swagger-commission.mjs
 */
const API = process.env.NEXT_PUBLIC_API_URL ?? "https://api.upjunoo-dev.tech";

const spec = await fetch(`${API}/docs/json`, {
  signal: AbortSignal.timeout(30000),
}).then((r) => r.json());

const paths = Object.keys(spec.paths ?? {}).sort();
const full = JSON.stringify(spec);
const kw = /commission/i;

function showPath(path) {
  const ops = spec.paths[path];
  for (const [m, def] of Object.entries(ops)) {
    if (!["get", "post", "put", "patch", "delete"].includes(m)) continue;
    const params = (def.parameters ?? []).map((p) => {
      let s = p.name;
      if (p.schema?.enum) s += ` enum=${JSON.stringify(p.schema.enum)}`;
      if (p.schema?.type) s += `:${p.schema.type}`;
      if (p.in) s += ` (${p.in})`;
      return s;
    });
    const rb = def.requestBody?.content
      ? Object.keys(def.requestBody.content).join(", ")
      : "";
    const res = def.responses?.["200"]?.content?.["application/json"]?.schema;
    const resRef = res?.$ref ? res.$ref.split("/").pop() : "";

    console.log(`  ${m.toUpperCase().padEnd(6)} ${path}`);
    console.log(`         summary: ${def.summary ?? "-"}`);
    if (def.description?.trim()) {
      const desc = def.description.trim().replace(/\s+/g, " ").slice(0, 120);
      console.log(`         desc: ${desc}${def.description.length > 120 ? "…" : ""}`);
    }
    if (params.length) console.log(`         params: ${params.join(" | ")}`);
    if (rb) console.log(`         body: ${rb}`);
    if (resRef) console.log(`         200 schema: ${resRef}`);
  }
}

function pathMatchesCommission(path) {
  return kw.test(path);
}

function opMatchesCommission(def) {
  return kw.test(JSON.stringify(def));
}

const pathHits = paths.filter(pathMatchesCommission);
const opHits = paths.filter((p) => {
  const ops = spec.paths[p];
  return Object.values(ops).some(opMatchesCommission);
});
const allCommissionPaths = [...new Set([...pathHits, ...opHits])].sort();

console.log(`OpenAPI v${spec.info?.version ?? "?"} — ${paths.length} paths`);
console.log(`Swagger: ${API}/docs\n`);

console.log(`=== 1. Paths URL contenant "commission" (${pathHits.length}) ===`);
if (!pathHits.length) console.log("(aucun)");
for (const p of pathHits) showPath(p);

console.log(
  `\n=== 2. Paths avec "commission" dans op (summary/desc/schema) hors URL (${allCommissionPaths.length - pathHits.length}) ===`
);
const extra = allCommissionPaths.filter((p) => !pathHits.includes(p));
if (!extra.length) console.log("(aucun)");
for (const p of extra) showPath(p);

const schemas = spec.components?.schemas ?? {};
const schemaHits = Object.keys(schemas)
  .filter((n) => kw.test(n) || kw.test(JSON.stringify(schemas[n])))
  .sort();

console.log(`\n=== 3. Schémas OpenAPI liés commission (${schemaHits.length}) ===`);
for (const n of schemaHits) {
  const s = schemas[n];
  const props = Object.keys(s.properties ?? {});
  const enums = s.enum ? ` enum=${JSON.stringify(s.enum)}` : "";
  const propStr = props.length
    ? ` props=[${props.slice(0, 25).join(", ")}${props.length > 25 ? "…" : ""}]`
    : "";
  console.log(`- ${n}${enums}${propStr}`);
}

const terms = [
  "commission",
  "Commission",
  "commissionXof",
  "commission_xof",
  "commissionXof",
  "platform_amount",
  "platformAmount",
  "platform_amount_xof",
  "commission_rate",
  "commissionRate",
  "commission_breakdown",
  "commissionBreakdown",
  "commissionBreakdown",
  "gross_fcfa",
  "gross_amount",
];

console.log("\n=== 4. Occurrences texte dans le spec ===");
for (const t of terms) {
  const escaped = t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(escaped, "g");
  console.log(`${t}: ${(full.match(re) ?? []).length}`);
}

const financeKw = /\/finance\/|commission|payout|revenue|ledger|withdrawal/i;
const financePaths = paths.filter((p) => financeKw.test(p));

console.log(`\n=== 5. Tous les paths finance / ledger / withdrawal (${financePaths.length}) ===`);
for (const p of financePaths) showPath(p);

// Params documentés sur GET admin commissions si existe
const adminComm = spec.paths["/v1/admin/finance/commissions"]?.get;
if (adminComm) {
  console.log("\n=== 6. Détail GET /v1/admin/finance/commissions ===");
  console.log("tags:", (adminComm.tags ?? []).join(", "));
  console.log(
    "parameters:",
    (adminComm.parameters ?? []).length
      ? JSON.stringify(adminComm.parameters, null, 2)
      : "(aucun documenté)"
  );
  const resSchema =
    adminComm.responses?.["200"]?.content?.["application/json"]?.schema;
  if (resSchema) {
    console.log("response 200 schema:", JSON.stringify(resSchema, null, 2).slice(0, 800));
  }
} else {
  console.log("\n=== 6. GET /v1/admin/finance/commissions ===");
  console.log("ROUTE ABSENTE du Swagger");
}
