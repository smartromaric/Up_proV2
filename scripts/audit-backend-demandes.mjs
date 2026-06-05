/**
 * Vérifie sur l'API live si les demandes BACKEND-DEMANDES-V1.md sont satisfaites.
 * Usage: node scripts/audit-backend-demandes.mjs
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://api.upjunoo-dev.tech";
const EMAIL = process.env.TEST_ADMIN_EMAIL ?? "dev.admin@upjunoo-dev.tech";
const PASSWORD = process.env.TEST_ADMIN_PASSWORD ?? "Upjunoo@Dev2026!";

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
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text.slice(0, 300) };
  }
  return { status: res.status, ok: res.ok, json };
}

function isHttpsUrl(v) {
  return typeof v === "string" && /^https?:\/\//i.test(v.trim());
}

function pick(obj, keys) {
  const out = {};
  for (const k of keys) out[k] = obj?.[k] ?? null;
  return out;
}

const checks = [];

function add(id, label, status, detail, sample) {
  checks.push({ id, label, status, detail, sample });
  const icon = status === "ok" ? "✓" : status === "partial" ? "~" : "✗";
  console.log(`${icon} [${id}] ${label}`);
  console.log(`    ${detail}`);
  if (sample) console.log(`    → ${JSON.stringify(sample).slice(0, 200)}`);
}

async function probeFileUrl(url, token) {
  if (!isHttpsUrl(url)) return { accessible: false, reason: "not_https" };
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      method: "HEAD",
    });
    if (res.ok) return { accessible: true, status: res.status };
    const getRes = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return { accessible: getRes.ok, status: getRes.status };
  } catch (e) {
    return { accessible: false, reason: String(e.message) };
  }
}

async function main() {
  console.log(`\n=== Audit demandes backend — ${API_URL} ===\n`);

  const login = await request("/v1/auth/login", {
    method: "POST",
    body: { email: EMAIL, password: PASSWORD },
  });
  const token =
    login.json?.accessToken ?? login.json?.session?.access_token ?? null;
  if (!token) {
    console.error("Login failed", login.status);
    process.exit(1);
  }

  // AU-01
  const me = await request("/v1/auth/me", { token });
  const perms = me.json?.permissions ?? me.json?.profile?.permissions ?? [];
  add(
    "AU-01",
    "permissions[] dans auth/me",
    Array.isArray(perms) && perms.length > 0 ? "ok" : "missing",
    Array.isArray(perms) && perms.length > 0
      ? `${perms.length} permission(s)`
      : "permissions absentes ou vide — front en dur"
  );

  // KYC-01 / KYC-02
  const kyc = await request("/v1/admin/kyc/documents", { token });
  const kycItems = kyc.json?.items ?? kyc.json?.documents ?? [];
  const firstKyc = kycItems[0];
  if (firstKyc) {
    const fileUrl = firstKyc.file_url ?? firstKyc.fileUrl;
    const fileProbe = isHttpsUrl(fileUrl)
      ? await probeFileUrl(fileUrl, token)
      : await request(`/${String(fileUrl).replace(/^\//, "")}`, { token });
    const fileOk =
      isHttpsUrl(fileUrl) && fileProbe.accessible
        ? true
        : !isHttpsUrl(fileUrl)
          ? false
          : fileProbe.accessible;
    add(
      "KYC-01",
      "file_url accessible (HTTPS)",
      fileOk ? "ok" : isHttpsUrl(fileUrl) ? "partial" : "missing",
      fileOk
        ? `URL signée OK (${fileUrl?.slice(0, 60)}…)`
        : isHttpsUrl(fileUrl)
          ? `URL HTTPS mais inaccessible (HTTP ${fileProbe.status})`
          : `Chemin relatif : ${fileUrl ?? "null"} → 404 probable`,
      pick(firstKyc, ["id", "document_type_code", "file_url", "fileUrl"])
    );
    const label = firstKyc.document_type_label ?? firstKyc.documentTypeLabel;
    add(
      "KYC-02",
      "document_type_label FR",
      label && !/^[A-Z_]+$/.test(label) ? "ok" : "missing",
      label
        ? `label="${label}"`
        : "document_type_label absent — mapping front en dur"
    );
  } else {
    add("KYC-01", "file_url accessible", "missing", "Aucun document KYC en base");
    add("KYC-02", "document_type_label FR", "missing", "Aucun document KYC");
  }

  // KYC-03 — driver detail
  const drivers = await request("/v1/admin/drivers?page=1&limit=5", { token });
  const driverItems = drivers.json?.items ?? drivers.json?.drivers ?? [];
  const sampleDriver = driverItems.find((d) => d.id) ?? driverItems[0];
  let driverDetail = null;
  if (sampleDriver?.id) {
    driverDetail = await request(`/v1/drivers/${sampleDriver.id}`, { token });
    const docs =
      driverDetail.json?.kyc_documents ??
      driverDetail.json?.kycDocuments ??
      driverDetail.json?.driver?.kyc_documents;
    const hasKycArray = Array.isArray(docs);
    add(
      "KYC-03",
      "kyc_documents[] dans GET /v1/drivers/{id}",
      hasKycArray ? (docs.length > 0 ? "ok" : "partial") : "missing",
      hasKycArray
        ? `${docs.length} doc(s) embarqué(s) sur chauffeur ${sampleDriver.id}`
        : "kyc_documents absent — 2e appel /admin/kyc/documents requis",
      docs?.[0]
        ? pick(docs[0], ["id", "document_type_code", "file_url", "status"])
        : null
    );

    // DR-01 partner object
    const partner =
      driverDetail.json?.partner ??
      driverDetail.json?.driver?.partner;
    add(
      "DR-01",
      "objet partner dans fiche chauffeur",
      partner?.tradeName || partner?.trade_name || partner?.name
        ? "ok"
        : "missing",
      partner?.tradeName || partner?.trade_name || partner?.name
        ? `tradeName=${partner.tradeName ?? partner.trade_name ?? partner.name}`
        : "partner absent ou sans tradeName"
    );

    add(
      "DR-02",
      "zoneName (quartier)",
      sampleDriver.zoneName || driverDetail.json?.zoneName
        ? "partial"
        : "missing",
      `zoneName liste="${sampleDriver.zoneName ?? "null"}" — souvent ville pas quartier`
    );

    add(
      "DR-03",
      "vehicleLabel (plaque+modèle)",
      sampleDriver.vehicleLabel?.includes("·") ||
        sampleDriver.vehicleLabel?.length > 15
        ? "ok"
        : "partial",
      `vehicleLabel="${sampleDriver.vehicleLabel ?? "null"}"`
    );
  }

  // OR-01 à OR-05 — orders list
  const orders = await request(
    "/v1/admin/orders?page=1&limit=10&dateFrom=2026-06-01&dateTo=2026-06-30",
    { token }
  );
  const rides = orders.json?.rides ?? [];
  const withDriver = rides.filter((r) => r.driver_id);
  const driverEnriched = withDriver.filter(
    (r) => r.driver?.displayName?.trim()
  );
  const withPartner = rides.filter(
    (r) => r.partner_id || r.partner?.id || r.partnerName
  );
  const franchiseEnriched = rides.filter(
    (r) => r.franchiseName?.trim() || r.franchise?.name
  );
  const hasPartnerId = rides.some((r) => r.partner_id);

  add(
    "OR-01",
    "driver.displayName peuplé sur orders",
    withDriver.length === 0
      ? "partial"
      : driverEnriched.length / withDriver.length >= 0.8
        ? "ok"
        : driverEnriched.length > 0
          ? "partial"
          : "missing",
    `${driverEnriched.length}/${withDriver.length} courses avec chauffeur ont displayName`
  );
  add(
    "OR-02",
    "partner embarqué + partner_id",
    hasPartnerId || withPartner.length > 0 ? "partial" : "missing",
    `partner_id présent: ${hasPartnerId}; partnerName/objet: ${withPartner.length}/${rides.length}`
  );
  add(
    "OR-03",
    "franchiseName / objet franchise",
    franchiseEnriched.length > 0 ? "partial" : "missing",
    `${franchiseEnriched.length}/${rides.length} avec franchiseName ou franchise.name`
  );
  add(
    "OR-05",
    "filtre dateFrom/dateTo",
    orders.ok && rides.length >= 0 ? "partial" : "missing",
    orders.ok
      ? `HTTP 200 avec dateFrom/dateTo (${rides.length} rides) — vérifier si filtre réel ou ignoré`
      : `HTTP ${orders.status}`
  );

  // FR-01
  const adminFranchises = await request("/v1/admin/franchises?page=1&limit=10", {
    token,
  });
  add(
    "FR-01",
    "GET /v1/admin/franchises",
    adminFranchises.ok ? "ok" : "missing",
    adminFranchises.ok
      ? `${adminFranchises.json?.items?.length ?? adminFranchises.json?.franchises?.length ?? "?"} item(s)`
      : `HTTP ${adminFranchises.status} — contournement dashboard`
  );

  // FR-DASH-01
  const frLogin = await request("/v1/auth/login", {
    method: "POST",
    body: {
      email: process.env.TEST_FRANCHISE_EMAIL ?? "dev.franchise@upjunoo-dev.tech",
      password: PASSWORD,
    },
  });
  const frToken =
    frLogin.json?.accessToken ?? frLogin.json?.session?.access_token ?? null;
  const frDash = frToken
    ? await request("/v1/franchise/dashboard", { token: frToken })
    : { ok: false, json: null };
  add(
    "FR-DASH-01",
    "GET /v1/franchise/dashboard (JWT franchise)",
    frDash.ok ? "ok" : "missing",
    frDash.ok
      ? "dashboard natif OK"
      : `${frDash.json?.error?.code ?? frDash.json?.code ?? "ERR"} — ${frDash.json?.error?.message ?? frDash.json?.message ?? ""}`
  );

  // PA-01 à PA-03
  const partners = await request("/v1/admin/partners?page=1&limit=10", { token });
  const partnerItems = partners.json?.items ?? partners.json?.partners ?? [];
  const p0 = partnerItems[0];
  if (p0) {
    add(
      "PA-01",
      "franchiseName sur partenaire",
      p0.franchiseName || p0.franchise_name ? "partial" : "missing",
      `franchiseName="${p0.franchiseName ?? p0.franchise_name ?? "null"}" (${partnerItems.filter((p) => p.franchiseName || p.franchise_name).length}/${partnerItems.length})`
    );
    add(
      "PA-02",
      "cityLabel sur partenaire",
      p0.cityLabel || p0.city_label ? "partial" : "missing",
      `cityLabel="${p0.cityLabel ?? p0.city_label ?? "null"}"`
    );
    add(
      "PA-03",
      "driversCount réel",
      partnerItems.some((p) => (p.driversCount ?? p.drivers_count) > 0)
        ? "partial"
        : "missing",
      `driversCount sample=${p0.driversCount ?? p0.drivers_count ?? 0}`
    );
  }

  // CL-01
  const users = await request("/v1/admin/users?page=1&limit=5", { token });
  const userItems = users.json?.users ?? users.json?.items ?? [];
  const sampleUser = userItems[0];
  if (sampleUser?.id) {
    const userDetail = await request(`/v1/admin/users/${sampleUser.id}`, {
      token,
    });
    add(
      "CL-01",
      "GET /v1/admin/users/{id}",
      userDetail.ok ? "ok" : "missing",
      userDetail.ok ? "fiche client exposée" : `HTTP ${userDetail.status}`
    );
  }

  // WD-01
  const wd = await request("/v1/admin/withdrawals?page=1&limit=5", { token });
  const wdItems = wd.json?.items ?? wd.json?.withdrawals ?? [];
  add(
    "WD-01",
    "franchiseName sur retraits",
    wdItems.some((w) => w.franchiseName || w.franchise_name) ? "partial" : "missing",
    `${wdItems.filter((w) => w.franchiseName || w.franchise_name).length}/${wdItems.length} avec franchiseName`
  );

  // Bug drivers search
  const searchDrv = await request(
    "/v1/admin/drivers?search=GN&page=1&limit=5",
    { token }
  );
  add(
    "BUG-DR-SEARCH",
    "GET /v1/admin/drivers?search=…",
    searchDrv.ok ? "ok" : "missing",
    searchDrv.ok ? "recherche OK" : `HTTP ${searchDrv.status} — bug 500`
  );

  // DB-01
  const dash = await request("/v1/admin/dashboard", { token });
  const frOpts =
    dash.json?.dashboard?.filters?.options?.franchises ??
    dash.json?.filters?.options?.franchises ??
    [];
  add(
    "DB-01",
    "dashboard franchises[].city peuplé",
    frOpts.some((f) => f.city || f.cityLabel) ? "ok" : "partial",
    `${frOpts.filter((f) => f.city || f.cityLabel).length}/${frOpts.length} avec city/cityLabel`
  );

  // KYC-06 filters
  if (sampleDriver?.id) {
    const kycFilter = await request(
      `/v1/admin/kyc/documents?subject_id=${sampleDriver.id}&status=pending`,
      { token }
    );
    const filtered = kycFilter.json?.items ?? kycFilter.json?.documents ?? [];
    add(
      "KYC-06",
      "filtres ?subject_id= sur kyc/documents",
      kycFilter.ok && (filtered.length >= 0) ? "partial" : "missing",
      kycFilter.ok
        ? `HTTP 200, ${filtered.length} doc(s) pour subject_id — vérifier pertinence filtre`
        : `HTTP ${kycFilter.status}`
    );
  }

  // Summary
  const ok = checks.filter((c) => c.status === "ok").length;
  const partial = checks.filter((c) => c.status === "partial").length;
  const missing = checks.filter((c) => c.status === "missing").length;
  console.log(`\n=== Bilan: ${ok} OK · ${partial} partiel · ${missing} manquant ===\n`);

  const stillMissing = checks.filter((c) => c.status === "missing");
  if (stillMissing.length) {
    console.log("Encore à livrer (manquant):");
    for (const c of stillMissing) console.log(`  - ${c.id}: ${c.label}`);
  }
  const improved = checks.filter((c) => c.status === "ok");
  if (improved.length) {
    console.log("\nLivré / OK:");
    for (const c of improved) console.log(`  - ${c.id}: ${c.label}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
