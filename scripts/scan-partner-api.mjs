/**
 * Scan complet des endpoints API /v1/partners/{id}/...
 * Vérifie le format de réponse (status/items/pagination vs data/meta)
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://api.upjunoo-dev.tech";
const EMAIL = process.env.TEST_ADMIN_EMAIL ?? "dev.admin@upjunoo-dev.tech";
const PASSWORD = process.env.TEST_ADMIN_PASSWORD ?? "Upjunoo@Dev2026!";

const partnerId = process.env.TEST_PARTNER_ID ?? "71a1aad7-ad23-41ca-a6d0-b904d5953271";

const ENDPOINTS = [
  { name: "Dashboard", path: `/v1/partners/${partnerId}/dashboard` },
  { name: "Drivers", path: `/v1/partners/${partnerId}/drivers` },
  { name: "Vehicles", path: `/v1/partners/${partnerId}/vehicles` },
  { name: "Wallet", path: `/v1/partners/${partnerId}/wallet` },
  { name: "Profile (me)", path: `/v1/partners/me` },
  { name: "Profile (by id)", path: `/v1/partners/${partnerId}` },
  { name: "Members", path: `/v1/partners/${partnerId}/members` },
  { name: "Performance (vehicles)", path: `/v1/partners/${partnerId}/vehicle-performance` },
  { name: "Performance (drivers)", path: `/v1/partners/${partnerId}/driver-performance` },
  { name: "GPS Devices", path: `/v1/partners/${partnerId}/gps-devices` },
  { name: "Freight Offers", path: `/v1/partners/${partnerId}/freight-offers` },
  { name: "Ledger", path: `/v1/partners/${partnerId}/ledger` },
  { name: "Settlements", path: `/v1/partners/${partnerId}/settlements` },
  { name: "Revenue", path: `/v1/partners/${partnerId}/revenue` },
  { name: "Cash Reconciliations", path: `/v1/partners/${partnerId}/cash-reconciliations` },
];

async function login() {
  const res = await fetch(`${API_URL}/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const data = await res.json();
  const token = data.accessToken ?? data.session?.access_token;
  if (!token) {
    console.error("❌ Login failed", res.status, data);
    process.exit(1);
  }
  return token;
}

function detectFormat(json) {
  if (json.status === "ok") {
    if (json.items && Array.isArray(json.items)) {
      return { format: "NEW", type: "items[]", count: json.items.length, hasPagination: !!json.pagination, hasSummary: !!json.summary };
    }
    if (json.dashboard) {
      return { format: "NEW", type: "dashboard", keys: Object.keys(json.dashboard).join(", ") };
    }
    if (json.data && !Array.isArray(json.data)) {
      return { format: "NEW", type: "single object", keys: Object.keys(json.data).join(", ") };
    }
    return { format: "NEW", type: "unknown", keys: Object.keys(json).join(", ") };
  }
  
  if (json.success === true && json.data) {
    return { format: "OLD_SUCCESS", type: "wrapped", keys: Object.keys(json.data).join(", ") };
  }
  
  if (json.data && Array.isArray(json.data)) {
    return { format: "DIRECT", type: "data[]", count: json.data.length, hasMeta: !!json.meta };
  }
  
  return { format: "UNKNOWN", keys: Object.keys(json).join(", ") };
}

async function testEndpoint(token, endpoint) {
  const headers = { Authorization: `Bearer ${token}`, Accept: "application/json" };
  const url = `${API_URL}${endpoint.path}`;
  
  try {
    const res = await fetch(url, { headers });
    const text = await res.text();
    
    if (res.status === 404) {
      return { status: 404, error: "Not Found", exists: false };
    }
    if (res.status === 401 || res.status === 403) {
      return { status: res.status, error: "Auth required", exists: false };
    }
    
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      return { status: res.status, error: "Invalid JSON", preview: text.slice(0, 100) };
    }
    
    const format = detectFormat(json);
    
    return { 
      status: res.status, 
      exists: true, 
      format,
      preview: text.slice(0, 200)
    };
  } catch (e) {
    return { status: "ERROR", error: e.message, exists: false };
  }
}

async function main() {
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("  SCAN API /v1/partners/{id}/... — Format de réponse");
  console.log(`  Partner ID: ${partnerId}`);
  console.log("═══════════════════════════════════════════════════════════════\n");
  
  const token = await login();
  console.log("✅ Connecté\n");
  
  const results = [];
  
  for (const endpoint of ENDPOINTS) {
    process.stdout.write(`Testing ${endpoint.name}... `);
    const result = await testEndpoint(token, endpoint);
    results.push({ name: endpoint.name, path: endpoint.path, ...result });
    
    if (!result.exists) {
      console.log(`❌ ${result.status} — ${result.error}`);
    } else if (result.format.format === "NEW") {
      console.log(`✅ ${result.status} — NOUVEAU FORMAT (${result.format.type})`);
    } else if (result.format.format === "OLD_SUCCESS") {
      console.log(`⚠️  ${result.status} — ANCIEN FORMAT (success: true)`);
    } else if (result.format.format === "DIRECT") {
      console.log(`✅ ${result.status} — Format direct (déjà compatible)`);
    } else {
      console.log(`?  ${result.status} — Format inconnu`);
    }
  }
  
  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("  RÉSUMÉ");
  console.log("═══════════════════════════════════════════════════════════════\n");
  
  const newFormat = results.filter(r => r.exists && r.format?.format === "NEW");
  const oldFormat = results.filter(r => r.exists && r.format?.format === "OLD_SUCCESS");
  const directFormat = results.filter(r => r.exists && r.format?.format === "DIRECT");
  const notFound = results.filter(r => !r.exists);
  const unknown = results.filter(r => r.exists && r.format?.format === "UNKNOWN");
  
  console.log(`✅ Nouveau format (status: "ok", items[]): ${newFormat.length}`);
  console.log(`⚠️  Ancien format (success: true, data): ${oldFormat.length}`);
  console.log(`✅ Format direct (data[], meta): ${directFormat.length}`);
  console.log(`❌ Non trouvés (404): ${notFound.length}`);
  console.log(`?  Format inconnu: ${unknown.length}`);
  
  console.log("\n📋 Détail par endpoint:\n");
  
  for (const r of results) {
    const icon = !r.exists ? "❌" : r.format?.format === "NEW" ? "✅" : r.format?.format === "OLD_SUCCESS" ? "⚠️" : r.format?.format === "DIRECT" ? "✅" : "?";
    console.log(`${icon} ${r.name}`);
    console.log(`   ${r.path}`);
    if (r.exists && r.format) {
      console.log(`   Format: ${r.format.format} | Type: ${r.format.type}`);
      if (r.format.count !== undefined) {
        console.log(`   Items: ${r.format.count}`);
      }
    } else {
      console.log(`   Erreur: ${r.error}`);
    }
    console.log();
  }
  
  // Vérification spécifique dashboard
  const dashboard = results.find(r => r.name === "Dashboard");
  if (dashboard?.exists && dashboard.format?.type === "dashboard") {
    console.log("📊 Détail Dashboard:\n");
    const headers = { Authorization: `Bearer ${token}`, Accept: "application/json" };
    const res = await fetch(`${API_URL}/v1/partners/${partnerId}/dashboard`, { headers });
    const json = await res.json();
    console.log(JSON.stringify(json, null, 2));
    console.log();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
