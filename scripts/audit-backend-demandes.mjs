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

  // FR-CREATE-01 / FR-DELETE-01 — CRUD franchise admin
  const specRes = await fetch(`${API_URL}/docs/json`);
  let hasPostAdminFranchises = false;
  let hasDeleteFranchise = false;
  if (specRes.ok) {
    const spec = await specRes.json();
    const paths = spec.paths ?? {};
    hasPostAdminFranchises = Boolean(paths["/v1/admin/franchises"]?.post);
    hasDeleteFranchise = Boolean(
      paths["/v1/admin/franchises/{id}"]?.delete ||
        paths["/v1/franchises/{id}"]?.delete
    );
  }
  add(
    "FR-CREATE-01",
    "Création franchise sans franchiseId (POST admin ou register)",
    hasPostAdminFranchises ? "ok" : "missing",
    hasPostAdminFranchises
      ? "POST /v1/admin/franchises exposé"
      : "register exige franchiseId (AUTH_FRANCHISE_ID_REQUIRED) — création sans UUID attendue"
  );
  add(
    "FR-DELETE-01",
    "DELETE franchise (admin ou module 99)",
    hasDeleteFranchise ? "ok" : "missing",
    hasDeleteFranchise
      ? "route exposée"
      : "absent du Swagger live"
  );

  // IMG-01 — seed Supabase profile-photo
  const seedImg =
    "https://wfajmgpahlpcmoxopwze.supabase.co/storage/v1/object/public/upjunoo-kyc/seed/profile-photo.jpg";
  const seedProbe = await probeFileUrl(seedImg, token);
  add(
    "IMG-01",
    "images seed Supabase accessibles (profile-photo.jpg)",
    seedProbe.accessible ? "ok" : "missing",
    seedProbe.accessible
      ? `HTTP ${seedProbe.status}`
      : `URL renvoyée par l'API mais fichier inaccessible (HTTP ${seedProbe.status ?? "?"})`
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

  // FR-PARTNERS-01 — driversCount sur partenaires d'une franchise
  const frList = await request("/v1/admin/franchises?page=1&limit=5", { token });
  const frItems = frList.json?.items ?? [];
  const frSample = frItems[0];
  if (frSample?.id) {
    const frPartners = await request(
      `/v1/franchises/${frSample.id}/partners?page=1&limit=20`,
      { token }
    );
    const frPartnerItems = frPartners.json?.items ?? [];
    const fp0 = frPartnerItems[0];
    const withCount = frPartnerItems.filter(
      (p) => (p.driversCount ?? p.drivers_count) != null
    ).length;
    const withPositive = frPartnerItems.filter(
      (p) => (p.driversCount ?? p.drivers_count) > 0
    ).length;
    add(
      "FR-PARTNERS-01",
      "driversCount sur GET /v1/franchises/{id}/partners",
      withPositive > 0 ? "ok" : withCount > 0 ? "partial" : "missing",
      frPartnerItems.length
        ? `${withCount}/${frPartnerItems.length} avec champ, ${withPositive} > 0` +
            (fp0
              ? ` — sample driversCount=${fp0.driversCount ?? fp0.drivers_count ?? "null"}`
              : "")
        : `HTTP ${frPartners.status}, 0 partenaire`
    );
  }

  // PA-WALLET-01 — wallet embarqué + routes wallet/ledger partenaire
  const partnerList = await request("/v1/admin/partners?page=1&limit=5", { token });
  const partnerItemsForWallet =
    partnerList.json?.items ?? partnerList.json?.partners ?? [];
  const pwSample = partnerItemsForWallet.find((p) => p.wallet_id || p.id);
  if (pwSample?.id) {
    const partnerDetail = await request(`/v1/partners/${pwSample.id}`, { token });
    const p = partnerDetail.json?.partner ?? partnerDetail.json;
    const partnerWallet = await request(`/v1/partners/${pwSample.id}/wallet`, {
      token,
    });
    const partnerLedger = await request(
      `/v1/partners/${pwSample.id}/ledger?limit=5`,
      { token }
    );
    const hasEmbeddedWallet =
      p?.wallet != null && typeof p.wallet === "object" && p.wallet.id;
    add(
      "PA-WALLET-01",
      "wallet objet sur GET /v1/partners/{id}",
      hasEmbeddedWallet ? "ok" : "partial",
      hasEmbeddedWallet
        ? `wallet embarqué id=${p.wallet.id}`
        : `wallet_id seul="${p?.wallet_id ?? "null"}" — routes /wallet=${partnerWallet.status} /ledger=${partnerLedger.status}`
    );
    if (partnerWallet.ok) {
      add(
        "PA-WALLET-01b",
        "GET /v1/partners/{id}/wallet",
        "ok",
        `balance_cached_xof=${partnerWallet.json?.wallet?.balance_cached_xof ?? "null"}`
      );
    }
    if (partnerLedger.ok) {
      const ledgerItems = partnerLedger.json?.items ?? [];
      add(
        "PA-WALLET-01c",
        "GET /v1/partners/{id}/ledger (transactions récentes)",
        ledgerItems.length > 0 ? "ok" : "partial",
        `${ledgerItems.length} mouvement(s) — sample="${ledgerItems[0]?.description ?? "—"}"`
      );
    }
  }

  // FR-WALLET-01 — wallet + ledger franchise
  if (frSample?.id) {
    const frWallet = await request(`/v1/franchises/${frSample.id}/wallet`, {
      token,
    });
    const frLedger = await request(
      `/v1/franchises/${frSample.id}/ledger?limit=5`,
      { token }
    );
    add(
      "FR-WALLET-01",
      "GET /v1/franchises/{id}/wallet + /ledger",
      frWallet.ok && frLedger.ok ? "ok" : "missing",
      `wallet HTTP ${frWallet.status}, ledger HTTP ${frLedger.status}`
    );
  }

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
    const recent = userDetail.json?.recentOrders ?? [];
    const r0 = recent[0];
    if (r0) {
      const hasRoute =
        (r0.pickupAddress || r0.pickup_address) &&
        (r0.dropoffAddress || r0.dropoff_address);
      const hasPrice =
        (r0.amountXof ?? r0.final_price_xof ?? r0.estimated_price_xof) > 0;
      add(
        "CL-02",
        "trajets + prix sur recentOrders (GET /v1/admin/users/{id})",
        hasRoute ? "ok" : hasPrice ? "partial" : "missing",
        hasRoute
          ? `pickup="${r0.pickupAddress ?? r0.pickup_address}"`
          : `amountXof=${r0.amountXof ?? r0.final_price_xof ?? "null"} — pas de pickup/dropoff`
      );
    }
  }

  // FN-DASH-01 — Finance générale
  const finDash = await request("/v1/admin/finance/dashboard", { token });
  const finReport = await request("/v1/admin/reports/finance", { token });
  add(
    "FN-DASH-01",
    "GET /v1/admin/finance/dashboard",
    finDash.ok ? "ok" : "missing",
    finDash.ok
      ? "dashboard finance natif OK"
      : `HTTP ${finDash.status} — partiel via reports/finance=${finReport.status}`
  );
  if (finReport.ok) {
    const f = finReport.json?.data?.finance ?? finReport.json?.finance ?? {};
    const hasChart = Array.isArray(f.chart_weekly ?? f.chartWeekly);
    add(
      "FN-DASH-01b",
      "GET /v1/admin/reports/finance (partiel)",
      hasChart ? "partial" : "partial",
      `revenueTodayXof=${f.revenueTodayXof ?? "null"}, commissionsTodayXof=${f.commissionsTodayXof ?? "null"}, withdrawalsPending=${f.withdrawalsPending ?? "null"}, chart_weekly=${hasChart ? "oui" : "non"}`
    );
  }

  // FN-TX-01 — Transactions
  const finTx = await request("/v1/admin/finance/transactions?page=1&limit=5", {
    token,
  });
  const partnerLedger = await request(
    "/v1/partners/39b37776-dcbb-4786-83d9-86ee9ac854c1/ledger?limit=3",
    { token }
  );
  add(
    "FN-TX-01",
    "GET /v1/admin/finance/transactions",
    finTx.ok ? "ok" : "missing",
    finTx.ok ? "liste transactions OK" : `HTTP ${finTx.status}`
  );
  if (!finTx.ok && partnerLedger.ok) {
    const ledgerItems = partnerLedger.json?.items ?? [];
    add(
      "FN-TX-01b",
      "GET /v1/partners/{id}/ledger (partiel)",
      ledgerItems.length ? "partial" : "partial",
      `ledger partenaire OK — ${ledgerItems.length} mouvement(s), pas de vue plateforme`
    );
  }

  // WD-01 — Retraits (v1 branché front)
  const wd = await request("/v1/admin/withdrawals?page=1&limit=5", { token });
  const wdItems = wd.json?.items ?? wd.json?.withdrawals ?? [];
  const wdSummary = wd.json?.summary ?? {};
  add(
    "WD-01",
    "GET /v1/admin/withdrawals",
    wd.ok ? "ok" : "missing",
    wd.ok
      ? `${wdItems.length} retrait(s), summary.pendingCount=${wdSummary.pendingCount ?? wdSummary.pending_count ?? "null"}`
      : `HTTP ${wd.status}`
  );
  if (wd.ok) {
    const withFranchise = wdItems.filter(
      (w) => w.franchiseName || w.franchise_name
    ).length;
    add(
      "WD-01b",
      "franchiseName sur retraits",
      withFranchise ? "partial" : "missing",
      `${withFranchise}/${wdItems.length} avec franchiseName`
    );
  }

  // FN-WLT-01 — Portefeuilles
  const finWlt = await request("/v1/admin/finance/wallets?page=1&limit=5", {
    token,
  });
  const partnerWallet = await request(
    "/v1/partners/39b37776-dcbb-4786-83d9-86ee9ac854c1/wallet",
    { token }
  );
  add(
    "FN-WLT-01",
    "GET /v1/admin/finance/wallets",
    finWlt.ok ? "ok" : "missing",
    finWlt.ok ? "liste wallets OK" : `HTTP ${finWlt.status}`
  );
  if (!finWlt.ok && partnerWallet.ok) {
    const w = partnerWallet.json?.wallet ?? {};
    add(
      "FN-WLT-01b",
      "GET /v1/partners/{id}/wallet (partiel)",
      "partial",
      `wallet unitaire OK — balance_cached_xof=${w.balance_cached_xof ?? "null"}, pas de liste admin`
    );
  }

  // FN-COM-01 — Commissions
  const finCom = await request("/v1/admin/finance/commissions?page=1&limit=5", {
    token,
  });
  const comRules = await request("/v1/admin/commission-rules", { token });
  add(
    "FN-COM-01",
    "GET /v1/admin/finance/commissions",
    finCom.ok ? "ok" : "missing",
    finCom.ok ? "commissions perçues OK" : `HTTP ${finCom.status}`
  );
  if (!finCom.ok && comRules.ok) {
    const rules = comRules.json?.items ?? [];
    const sample = rules[0];
    add(
      "FN-COM-01b",
      "GET /v1/admin/commission-rules (partiel)",
      "partial",
      `${rules.length} règle(s) — ex. platform_rate=${sample?.platform_rate ?? "null"} (taux, pas périodes perçues)`
    );
  }

  // FN-REC-01 — Réconciliation
  const finRec = await request(
    "/v1/admin/finance/reconciliation?page=1&limit=5",
    { token }
  );
  const cashRec = await request("/v1/admin/cash-reconciliations?page=1&limit=5", {
    token,
  });
  add(
    "FN-REC-01",
    "GET /v1/admin/finance/reconciliation",
    finRec.ok ? "ok" : "missing",
    finRec.ok ? "réconciliation plateforme OK" : `HTTP ${finRec.status}`
  );
  if (!finRec.ok && cashRec.ok) {
    const items = cashRec.json?.items ?? [];
    const r0 = items[0];
    add(
      "FN-REC-01b",
      "GET /v1/admin/cash-reconciliations (partiel)",
      items.length ? "partial" : "partial",
      items.length
        ? `${items.length} ligne(s) — expected_amount_xof=${r0?.expected_amount_xof ?? "null"}, status=${r0?.status ?? "null"}`
        : "route OK, 0 ligne — shape cash chauffeur ≠ UI réconciliation"
    );
  }

  // FN-DTR-01 — Recharges chauffeurs
  const dtrStats = await request("/v1/admin/finance/driver-transfers/stats", {
    token,
  });
  const dtrList = await request(
    "/v1/admin/finance/driver-transfers?page=1&limit=5",
    { token }
  );
  const rechargeBatches = await request(
    "/v1/wallets/recharge-batches?page=1&limit=5",
    { token }
  );
  add(
    "FN-DTR-01",
    "GET /v1/admin/finance/driver-transfers/stats",
    dtrStats.ok ? "ok" : "missing",
    dtrStats.ok ? "stats recharges OK" : `HTTP ${dtrStats.status}`
  );
  add(
    "FN-DTR-01c",
    "GET /v1/admin/finance/driver-transfers",
    dtrList.ok ? "ok" : "missing",
    dtrList.ok ? "historique recharges OK" : `HTTP ${dtrList.status}`
  );
  if (!dtrStats.ok && rechargeBatches.ok) {
    const batches = rechargeBatches.json?.batches ?? [];
    add(
      "FN-DTR-01b",
      "GET /v1/wallets/recharge-batches (partiel)",
      "partial",
      `${batches.length} batch(es) — shape différente de driver-transfers UI`
    );
  }

  // MK-PROMO-01 — Codes promo marketing
  const mkPromoMock = await request(
    "/v1/admin/marketing/promos?page=1&limit=5",
    { token }
  );
  const mkPromo = await request("/v1/admin/promotions?page=1&limit=5", { token });
  const promoItems = mkPromo.json?.items ?? [];
  add(
    "MK-PROMO-01",
    "GET /v1/admin/promotions (codes promo)",
    mkPromo.ok ? (promoItems.length ? "partial" : "partial") : "missing",
    mkPromo.ok
      ? `HTTP 200 — ${promoItems.length} promo(s), mock route=${mkPromoMock.status}`
      : `HTTP ${mkPromo.status}`
  );
  if (promoItems[0]) {
    const p = promoItems[0];
    add(
      "MK-PROMO-01b",
      "shape promotion vs UI MarketingPromo",
      p.code && (p.discount_type || p.discount_value != null) ? "partial" : "missing",
      `code=${p.code}, discount_type=${p.discount_type}, uses_count=${p.uses_count ?? "absent"}`
    );
  }

  // MK-CAMP-01 — Campagnes
  const mkCampMock = await request(
    "/v1/admin/marketing/campaigns?page=1&limit=5",
    { token }
  );
  const mkCamp = await request("/v1/campaigns?page=1&limit=5", { token });
  const campaigns = mkCamp.json?.campaigns ?? mkCamp.json?.items ?? [];
  add(
    "MK-CAMP-01",
    "GET /v1/campaigns (campagnes)",
    mkCamp.ok ? "partial" : "missing",
    mkCamp.ok
      ? `HTTP 200 — ${campaigns.length} campagne(s), admin mock=${mkCampMock.status}`
      : `HTTP ${mkCamp.status}`
  );

  // MK-BAN-01 — Bannières
  const mkBanMock = await request(
    "/v1/admin/marketing/banners?page=1&limit=5",
    { token }
  );
  const mkBan = await request("/v1/app-banners?page=1&limit=5", { token });
  const banners = mkBan.json?.banners ?? mkBan.json?.items ?? [];
  add(
    "MK-BAN-01",
    "GET /v1/app-banners (bannières)",
    mkBan.ok ? "partial" : "missing",
    mkBan.ok
      ? `HTTP 200 — ${banners.length} bannière(s), admin mock=${mkBanMock.status}`
      : `HTTP ${mkBan.status}`
  );

  // SP-TIX-01 — Support tickets
  const spMock = await request("/v1/admin/support/tickets?page=1&limit=5", {
    token,
  });
  const spTickets = await request("/v1/support/tickets?page=1&limit=5", { token });
  const ticketItems = spTickets.json?.items ?? [];
  add(
    "SP-TIX-01",
    "GET /v1/support/tickets",
    spTickets.ok ? "partial" : "missing",
    spTickets.ok
      ? `HTTP 200 — ${ticketItems.length} ticket(s), admin mock=${spMock.status}`
      : `HTTP ${spTickets.status}`
  );

  // ST-DISP-01 — Dispatchers
  const stDisp = await request("/v1/admin/dispatchers?page=1&limit=5", { token });
  add(
    "ST-DISP-01",
    "GET /v1/admin/dispatchers",
    stDisp.ok ? "ok" : "missing",
    stDisp.ok ? "dispatchers OK" : `HTTP ${stDisp.status}`
  );

  // ST-DRULE-01 — Règles dispatch
  const stDruleMock = await request("/v1/admin/settings/dispatch-rules", { token });
  const stDconfig = await request("/v1/admin/dispatch-config", { token });
  add(
    "ST-DRULE-01",
    "GET /v1/admin/settings/dispatch-rules",
    stDruleMock.ok ? "ok" : "missing",
    stDruleMock.ok ? "mock OK" : `HTTP ${stDruleMock.status} — partiel dispatch-config=${stDconfig.status}`
  );
  if (!stDruleMock.ok && stDconfig.ok) {
    const doc = stDconfig.json?.document ?? {};
    add(
      "ST-DRULE-01b",
      "GET /v1/admin/dispatch-config (partiel)",
      "partial",
      `schemaVersion=${doc.schemaVersion ?? "null"}, global keys=${Object.keys(doc.global ?? {}).join(",") || "none"}`
    );
  }

  // ST-ROLE-01 — Rôles
  const stRoleMock = await request("/v1/admin/settings/roles?page=1&limit=5", {
    token,
  });
  const stRoles = await request("/v1/admin/roles?page=1&limit=5", { token });
  const roleItems = stRoles.json?.items ?? [];
  add(
    "ST-ROLE-01",
    "GET /v1/admin/roles",
    stRoles.ok ? "partial" : "missing",
    stRoles.ok
      ? `HTTP 200 — ${roleItems.length} rôle(s), mock route=${stRoleMock.status}`
      : `HTTP ${stRoles.status}`
  );

  // ST-PRIC-01 — Tarification
  const stPric = await request("/v1/admin/pricing-rules?page=1&limit=5", { token });
  const pricItems = stPric.json?.items ?? [];
  add(
    "ST-PRIC-01",
    "GET /v1/admin/pricing-rules",
    stPric.ok ? "ok" : "missing",
    stPric.ok ? `${pricItems.length} règle(s) pricing` : `HTTP ${stPric.status}`
  );

  // ST-INT-01 — Intégrations
  const stIntMock = await request("/v1/admin/settings/integrations", { token });
  const stPaydunya = await request("/v1/admin/paydunya-config", { token });
  add(
    "ST-INT-01",
    "GET /v1/admin/settings/integrations",
    stIntMock.ok ? "ok" : "missing",
    stIntMock.ok
      ? "liste intégrations OK"
      : `HTTP ${stIntMock.status} — partiel paydunya-config=${stPaydunya.status}`
  );

  // ST-WTH-01 — Météo
  const stWeather = await request("/v1/admin/weather-config", { token });
  add(
    "ST-WTH-01",
    "GET /v1/admin/weather-config",
    stWeather.ok ? "ok" : "missing",
    stWeather.ok
      ? `enabled=${stWeather.json?.document?.enabled ?? "null"}`
      : `HTTP ${stWeather.status}`
  );

  // ST-AUD-01 — Audit
  const stAudMock = await request("/v1/admin/settings/audit?page=1&limit=5", {
    token,
  });
  const stAudit = await request("/v1/admin/audit-log?page=1&limit=5", { token });
  const auditItems = stAudit.json?.items ?? [];
  add(
    "ST-AUD-01",
    "GET /v1/admin/audit-log",
    stAudit.ok ? "partial" : "missing",
    stAudit.ok
      ? `HTTP 200 — ${auditItems.length} entrée(s), mock route=${stAudMock.status}`
      : `HTTP ${stAudit.status}`
  );

  // ST-GEN-01 — Général
  const stGen = await request("/v1/admin/settings/general", { token });
  add(
    "ST-GEN-01",
    "GET /v1/admin/settings/general",
    stGen.ok ? "ok" : "missing",
    stGen.ok ? "paramètres généraux OK" : `HTTP ${stGen.status}`
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
