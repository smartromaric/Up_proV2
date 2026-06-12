/**
 * Réaudit rapide des demandes du 10/06 vs Swagger + API live
 */
const API = process.env.NEXT_PUBLIC_API_URL ?? "https://api.upjunoo-dev.tech";
const EMAIL = process.env.TEST_ADMIN_EMAIL ?? process.env.DEV_ADMIN_EMAIL ?? "dev.admin@upjunoo-dev.tech";
const PASSWORD = process.env.TEST_ADMIN_PASSWORD ?? process.env.DEV_ADMIN_PASSWORD ?? "Upjunoo@Dev2026!";

const spec = await fetch(`${API}/docs/json`).then((r) => r.json());
const full = JSON.stringify(spec);

const login = await fetch(`${API}/v1/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json", "X-Client-Type": "back-office" },
  body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
}).then((r) => r.json());

const token = login.accessToken ?? login.session?.access_token;
if (!token) {
  console.error("Login échoué");
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${token}`,
  Accept: "application/json",
  "X-Client-Type": "back-office",
};
const get = async (path) =>
  fetch(`${API}${path}`, { headers }).then((r) => r.json());

console.log(`OpenAPI v${spec.info?.version} — ${Object.keys(spec.paths).length} paths\n`);

const results = [];

function row(id, statut, detail) {
  results.push({ id, statut, detail });
  const icon = statut === "OK" ? "✓" : statut === "PARTIEL" ? "~" : "✗";
  console.log(`${icon} [${id}] ${detail}`);
}

// DR-AVAIL-01
const driverSuspend = Object.keys(spec.paths).some(
  (p) => p.includes("/drivers/") && p.includes("suspend")
);
const patchDriver = spec.paths["/v1/admin/drivers/{id}"]?.patch;
row(
  "DR-AVAIL-01",
  driverSuspend ? "OK" : "NON",
  driverSuspend
    ? "routes /suspend chauffeur présentes"
    : `pas de /suspend chauffeur · PATCH body doc: ${patchDriver?.requestBody ? "oui" : "non"}`
);

// BINOME-UPLOAD-01
const multipart = (full.match(/multipart\/form-data/g) ?? []).length;
row(
  "BINOME-UPLOAD-01",
  multipart > 0 ? "OK" : "NON",
  `multipart/form-data dans spec: ${multipart} occurrence(s)`
);

// DR-PARTNER-SUGGEST-01
row(
  "DR-PARTNER-SUGGEST-01",
  full.includes("suggestedPartner") ? "OK" : "NON",
  `suggestedPartner dans spec: ${full.includes("suggestedPartner")}`
);

// PA-01 / PA-02
const pa = await get("/v1/admin/partners?page=1&limit=3");
const p0 = pa.items?.[0];
row(
  "PA-01/02",
  p0?.franchiseName && p0?.cityLabel ? "OK" : "NON",
  `franchiseName=${p0?.franchiseName ?? "null"} cityLabel=${p0?.cityLabel ?? "null"}`
);

// FN-TRANS-LABELS-01
const tx = await get("/v1/admin/finance/transactions?page=1&limit=2");
const t0 = tx.items?.[0];
const frName = t0?.franchise?.name ?? "";
const frOk = frName && !/^[0-9a-f-]{36}$/i.test(frName);
row(
  "FN-TRANS-LABELS-01",
  frOk ? "OK" : "NON",
  `franchise.name="${frName}" partner.tradeName="${t0?.partner?.tradeName ?? "?"}"`
);

// FN-TRANS-01
const fo = tx.filterOptions ?? {};
row(
  "FN-TRANS-01",
  Object.keys(fo).length ? "PARTIEL" : "NON",
  `filterOptions: ${Object.keys(fo).join(", ") || "absent"}`
);

// FLT-COMPLIANCE-01
const dr = await get("/v1/admin/drivers?page=1&limit=1");
const d0 = dr.items?.[0];
row(
  "FLT-COMPLIANCE-01",
  d0?.documentsSummary ? "OK" : "NON",
  `documentsSummary=${!!d0?.documentsSummary} complianceStatus=${d0?.complianceStatus ?? "?"}`
);

// ZN-GEO-01
const zones = await get("/v1/admin/zones?page=1&limit=1");
const zone = (zones.items ?? zones.zones ?? [])[0];
row(
  "ZN-GEO-01",
  zone?.geometry?.type ? "OK" : "NON",
  `geometry type=${zone?.geometry?.type ?? "absent"}`
);

// OR-TRACK-01
const ord = await get("/v1/admin/orders?page=1&limit=5");
const oid =
  ord.items?.find((o) => /in_progress/i.test(o.status))?.id ?? ord.items?.[0]?.id;
if (oid) {
  const detail = await get(`/v1/admin/orders/${oid}`);
  const order = detail.order ?? detail;
  const tr = order.tracking ?? {};
  const hasHistory = Boolean(
    tr.gpsHistory ?? tr.gps_history ?? tr.path ?? tr.polyline ?? tr.segments
  );
  row(
    "OR-TRACK-01",
    hasHistory ? "OK" : "PARTIEL",
    `tracking keys=[${Object.keys(tr).join(",")}] historique GPS=${hasHistory}`
  );
}

// FLT-VEHICLE-DETAIL-01
const pid = pa.items?.[0]?.id;
if (pid) {
  const vehicles = await get(`/v1/partners/${pid}/vehicles?page=1&limit=1`);
  const vid = vehicles.items?.[0]?.id;
  if (vid) {
    const vd = await get(`/v1/partners/${pid}/vehicles/${vid}`);
    const veh = vd.vehicle ?? vd;
    row(
      "FLT-VEHICLE-DETAIL-01",
      veh?.color?.label || veh?.color?.code ? "OK" : "NON",
      veh?.color ? `color=${JSON.stringify(veh.color)}` : `color_id=${veh?.color_id ?? "absent"}`
    );
  }
}

// SWAGGER-DOC-01
const driversParams = spec.paths["/v1/admin/drivers"]?.get?.parameters ?? [];
row(
  "SWAGGER-DOC-01",
  driversParams.some((p) => p.name === "account_status") ? "PARTIEL" : "NON",
  `params GET /admin/drivers documentés: ${driversParams.length}`
);

// SOS-DETAIL-01
const sos = await get("/v1/admin/safety/sos?page=1&limit=1");
const sosId = sos.items?.[0]?.id;
if (!sosId) {
  row("SOS-DETAIL-01", "PARTIEL", "0 incident en base — statusLabel spec: " + (full.match(/statusLabel/g) ?? []).length);
} else {
  const sd = await get(`/v1/admin/safety/sos/${sosId}`);
  const inc = sd.incident ?? sd;
  row(
    "SOS-DETAIL-01",
    inc?.statusLabel || inc?.status_label ? "OK" : "NON",
    `statusLabel=${inc?.statusLabel ?? inc?.status_label ?? "absent"}`
  );
}

console.log("\n--- Bilan ---");
const ok = results.filter((r) => r.statut === "OK").length;
const partiel = results.filter((r) => r.statut === "PARTIEL").length;
const non = results.filter((r) => r.statut === "NON").length;
console.log(`OK: ${ok} · Partiel: ${partiel} · Non traité: ${non}`);
