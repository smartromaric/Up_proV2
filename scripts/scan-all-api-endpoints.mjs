/**
 * Scan global de tous les endpoints API UpJunoo v1
 * Découverte des routes disponibles (pas seulement /partners/)
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://api.upjunoo-dev.tech";
const EMAIL = process.env.TEST_ADMIN_EMAIL ?? "dev.admin@upjunoo-dev.tech";
const PASSWORD = process.env.TEST_ADMIN_PASSWORD ?? "Upjunoo@Dev2026!";

const partnerId = process.env.TEST_PARTNER_ID ?? "71a1aad7-ad23-41ca-a6d0-b904d5953271";
const driverId = "2b82e602-244f-46b2-9d36-8161fd78af0b"; // Kouassi Yao
const vehicleId = "de5d225a-6206-458c-b7dd-5ec1e87f7ea0"; // DEV-CI-001

// Endpoints à tester - patterns variés
const ENDPOINTS_TO_TEST = [
  // Auth
  { group: "Auth", name: "Login", method: "POST", path: "/v1/auth/login" },
  { group: "Auth", name: "Refresh", method: "POST", path: "/v1/auth/refresh" },
  { group: "Auth", name: "Logout", method: "POST", path: "/v1/auth/logout" },
  
  // Admin
  { group: "Admin", name: "Dashboard", method: "GET", path: "/v1/admin/dashboard" },
  { group: "Admin", name: "Partners", method: "GET", path: "/v1/admin/partners" },
  { group: "Admin", name: "Drivers", method: "GET", path: "/v1/admin/drivers" },
  { group: "Admin", name: "Vehicles", method: "GET", path: "/v1/admin/vehicles" },
  { group: "Admin", name: "Orders", method: "GET", path: "/v1/admin/orders" },
  { group: "Admin", name: "Users", method: "GET", path: "/v1/admin/users" },
  { group: "Admin", name: "Franchises", method: "GET", path: "/v1/admin/franchises" },
  
  // Catalog / Bootstrap
  { group: "Catalog", name: "Bootstrap", method: "GET", path: "/v1/catalog/bootstrap" },
  { group: "Catalog", name: "Cities", method: "GET", path: "/v1/catalog/cities" },
  { group: "Catalog", name: "Zones", method: "GET", path: "/v1/catalog/zones" },
  { group: "Catalog", name: "Categories", method: "GET", path: "/v1/catalog/categories" },
  { group: "Catalog", name: "Brands", method: "GET", path: "/v1/catalog/brands" },
  { group: "Catalog", name: "Colors", method: "GET", path: "/v1/catalog/colors" },
  
  // Partners
  { group: "Partners", name: "Dashboard", method: "GET", path: `/v1/partners/${partnerId}/dashboard` },
  { group: "Partners", name: "Drivers List", method: "GET", path: `/v1/partners/${partnerId}/drivers` },
  { group: "Partners", name: "Driver Detail", method: "GET", path: `/v1/partners/${partnerId}/drivers/${driverId}` },
  { group: "Partners", name: "Vehicles List", method: "GET", path: `/v1/partners/${partnerId}/vehicles` },
  { group: "Partners", name: "Vehicle Detail", method: "GET", path: `/v1/partners/${partnerId}/vehicles/${vehicleId}` },
  { group: "Partners", name: "Wallet", method: "GET", path: `/v1/partners/${partnerId}/wallet` },
  { group: "Partners", name: "Ledger", method: "GET", path: `/v1/partners/${partnerId}/ledger` },
  { group: "Partners", name: "Settlements", method: "GET", path: `/v1/partners/${partnerId}/settlements` },
  { group: "Partners", name: "Revenue", method: "GET", path: `/v1/partners/${partnerId}/revenue` },
  { group: "Partners", name: "Cash Reconciliations", method: "GET", path: `/v1/partners/${partnerId}/cash-reconciliations` },
  { group: "Partners", name: "Profile (me)", method: "GET", path: `/v1/partners/me` },
  { group: "Partners", name: "Profile (by id)", method: "GET", path: `/v1/partners/${partnerId}` },
  { group: "Partners", name: "Members", method: "GET", path: `/v1/partners/${partnerId}/members` },
  { group: "Partners", name: "Vehicle Performance", method: "GET", path: `/v1/partners/${partnerId}/vehicle-performance` },
  { group: "Partners", name: "Driver Performance", method: "GET", path: `/v1/partners/${partnerId}/driver-performance` },
  { group: "Partners", name: "GPS Devices", method: "GET", path: `/v1/partners/${partnerId}/gps-devices` },
  { group: "Partners", name: "Freight Offers", method: "GET", path: `/v1/partners/${partnerId}/freight-offers` },
  
  // Alternatives possibles pour chauffeurs
  { group: "Alternatives", name: "Driver by ID (global)", method: "GET", path: `/v1/drivers/${driverId}` },
  { group: "Alternatives", name: "Driver Trips", method: "GET", path: `/v1/drivers/${driverId}/trips` },
  { group: "Alternatives", name: "Driver Wallet", method: "GET", path: `/v1/drivers/${driverId}/wallet` },
  { group: "Alternatives", name: "Driver Live", method: "GET", path: `/v1/drivers/${driverId}/live` },
  
  // Alternatives véhicules
  { group: "Alternatives", name: "Vehicle by ID (global)", method: "GET", path: `/v1/vehicles/${vehicleId}` },
  { group: "Alternatives", name: "Vehicle Driver", method: "GET", path: `/v1/vehicles/${vehicleId}/driver` },
  
  // Orders / Trips
  { group: "Orders", name: "Orders List", method: "GET", path: "/v1/orders" },
  { group: "Orders", name: "Order by ID", method: "GET", path: "/v1/orders/123" },
  { group: "Orders", name: "Trips", method: "GET", path: "/v1/trips" },
  
  // Finance / Wallet
  { group: "Finance", name: "Transactions", method: "GET", path: "/v1/transactions" },
  { group: "Finance", name: "Driver Transfers", method: "GET", path: `/v1/partners/${partnerId}/wallet/driver-transfers` },
  { group: "Finance", name: "Withdraw", method: "POST", path: `/v1/partners/${partnerId}/wallet/withdraw` },
  { group: "Finance", name: "Driver Recharge", method: "POST", path: `/v1/partners/${partnerId}/wallet/driver-recharge` },
  
  // Franchise
  { group: "Franchise", name: "Franchise by ID", method: "GET", path: "/v1/franchises/1bb2bff7-edcc-496d-a87a-4126c19be278" },
  { group: "Franchise", name: "Franchise Partners", method: "GET", path: "/v1/franchises/1bb2bff7-edcc-496d-a87a-4126c19be278/partners" },
  { group: "Franchise", name: "Franchise Drivers", method: "GET", path: "/v1/franchises/1bb2bff7-edcc-496d-a87a-4126c19be278/drivers" },
  
  // Geo
  { group: "Geo", name: "Hot Zones", method: "GET", path: "/v1/geo/hot-zones" },
  { group: "Geo", name: "Live Map", method: "GET", path: "/v1/geo/live-map" },
  
  // KYC
  { group: "KYC", name: "KYC Queue", method: "GET", path: "/v1/kyc/queue" },
  { group: "KYC", name: "KYC Documents", method: "GET", path: "/v1/kyc/documents" },
  
  // Support / Chat
  { group: "Support", name: "Support Tickets", method: "GET", path: `/v1/partners/${partnerId}/support/tickets` },
  { group: "Support", name: "Support Chat", method: "GET", path: `/v1/partners/${partnerId}/support/chat` },
  { group: "Support", name: "Chat Messages", method: "GET", path: `/v1/partners/${partnerId}/support/chat/123` },
  
  // Bookings
  { group: "Bookings", name: "Bookings List", method: "GET", path: `/v1/partners/${partnerId}/bookings` },
  { group: "Bookings", name: "Bookings Recurring", method: "GET", path: `/v1/partners/${partnerId}/bookings/recurring` },
  
  // Shifts
  { group: "Shifts", name: "Shifts", method: "GET", path: `/v1/partners/${partnerId}/shifts` },
  
  // Reports
  { group: "Reports", name: "Reports", method: "GET", path: `/v1/partners/${partnerId}/reports` },
  
  // Ops Map
  { group: "Ops", name: "Ops Map", method: "GET", path: `/v1/partners/${partnerId}/ops/map` },
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

async function testEndpoint(token, endpoint) {
  const headers = { 
    Authorization: `Bearer ${token}`, 
    Accept: "application/json",
    "Content-Type": "application/json"
  };
  const url = `${API_URL}${endpoint.path}`;
  
  try {
    const res = await fetch(url, { 
      method: endpoint.method,
      headers 
    });
    
    const text = await res.text();
    
    // Pas de body pour 204 ou certaines erreurs
    if (!text && (res.status === 204 || res.status === 404 || res.status >= 400)) {
      return { 
        status: res.status, 
        exists: res.status !== 404,
        error: res.status === 404 ? "Not Found" : undefined
      };
    }
    
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      return { status: res.status, exists: res.status < 400, preview: text.slice(0, 100) };
    }
    
    // Détecter format
    let format = "unknown";
    let itemCount = null;
    
    if (json.status === "ok") {
      format = "status:ok";
      if (json.items) itemCount = json.items.length;
      else if (json.dashboard) format = "status:ok (dashboard)";
    } else if (json.success === true) {
      format = "success:true";
      if (json.data && Array.isArray(json.data)) itemCount = json.data.length;
    } else if (Array.isArray(json)) {
      format = "array";
      itemCount = json.length;
    } else if (json.data && Array.isArray(json.data)) {
      format = "data:array";
      itemCount = json.data.length;
    } else if (json.id || json.uuid) {
      format = "object";
    }
    
    return { 
      status: res.status, 
      exists: res.status < 400 || res.status === 422,
      format,
      itemCount,
      preview: JSON.stringify(json).slice(0, 150)
    };
  } catch (e) {
    return { status: "ERROR", error: e.message, exists: false };
  }
}

async function main() {
  console.log("╔════════════════════════════════════════════════════════════════╗");
  console.log("║     SCAN GLOBAL API UPJUNOO v1                                 ║");
  console.log("║     Tous les endpoints - découverte complète                   ║");
  console.log("╚════════════════════════════════════════════════════════════════╝\n");
  
  const token = await login();
  console.log("✅ Connecté\n");
  
  const results = [];
  let currentGroup = "";
  
  for (const endpoint of ENDPOINTS_TO_TEST) {
    if (endpoint.group !== currentGroup) {
      currentGroup = endpoint.group;
      console.log(`\n📁 ${currentGroup}`);
      console.log("─".repeat(60));
    }
    
    process.stdout.write(`  ${endpoint.method} ${endpoint.name}... `);
    const result = await testEndpoint(token, endpoint);
    results.push({ ...endpoint, ...result });
    
    if (result.exists) {
      const icon = result.status === 200 ? "✅" : result.status === 201 ? "✅" : result.status === 422 ? "⚠️" : "?";
      const count = result.itemCount !== null ? `(${result.itemCount} items)` : "";
      console.log(`${icon} ${result.status} ${result.format} ${count}`);
    } else {
      console.log(`❌ ${result.status} ${result.error || ""}`);
    }
  }
  
  // Résumé
  console.log("\n\n╔════════════════════════════════════════════════════════════════╗");
  console.log("║     RÉSUMÉ                                                     ║");
  console.log("╚════════════════════════════════════════════════════════════════╝\n");
  
  const exists = results.filter(r => r.exists);
  const notFound = results.filter(r => !r.exists);
  const withItems = exists.filter(r => r.itemCount !== null);
  
  console.log(`Total testés: ${results.length}`);
  console.log(`  ✅ Existants (2xx): ${exists.length}`);
  console.log(`  ❌ Non trouvés (404): ${notFound.length}`);
  console.log(`  📦 Avec liste d'items: ${withItems.length}\n`);
  
  // Grouper par statut
  const byGroup = {};
  for (const r of results) {
    if (!byGroup[r.group]) byGroup[r.group] = { exists: 0, missing: 0 };
    if (r.exists) byGroup[r.group].exists++;
    else byGroup[r.group].missing++;
  }
  
  console.log("Par groupe:");
  for (const [group, stats] of Object.entries(byGroup)) {
    const total = stats.exists + stats.missing;
    const pct = Math.round((stats.exists / total) * 100);
    console.log(`  ${group.padEnd(15)} ${stats.exists}/${total} (${pct}%)`);
  }
  
  // Endpoints alternatifs trouvés
  console.log("\n\n🔍 ALTERNATIVES DÉCOUVERTES (qui pourraient remplacer les manquants):\n");
  
  const alternatives = results.filter(r => 
    r.group === "Alternatives" && r.exists
  );
  
  if (alternatives.length === 0) {
    console.log("  Aucune alternative trouvée 😔");
  } else {
    for (const alt of alternatives) {
      console.log(`  ✅ ${alt.method} ${alt.path}`);
      console.log(`     ${alt.name} - Format: ${alt.format}`);
      if (alt.itemCount !== null) {
        console.log(`     Items: ${alt.itemCount}`);
      }
      console.log();
    }
  }
  
  // Routes P1/P2 qui fonctionnent
  console.log("\n\n🎉 ROUTES MANQUANTES QUI FONCTIONNENT:\n");
  
  const working = results.filter(r => 
    r.exists && 
    (r.group === "Bookings" || r.group === "Shifts" || r.group === "Reports" || 
     r.group === "Support" || r.group === "Ops" || r.group === "Finance")
  );
  
  if (working.length === 0) {
    console.log("  Aucune route bonus trouvée");
  } else {
    for (const w of working) {
      console.log(`  ✅ ${w.method} ${w.path} (${w.name})`);
    }
  }
  
  console.log("\n\n📋 DÉTAIL COMPLET:\n");
  
  // Sauvegarder résultats
  const fs = await import("fs");
  const output = {
    generatedAt: new Date().toISOString(),
    apiUrl: API_URL,
    total: results.length,
    existing: exists.length,
    missing: notFound.length,
    endpoints: results
  };
  
  fs.writeFileSync(
    "c:\\Users\\upcall\\Desktop\\DEV\\Up_proV2\\scripts\\scan-results.json", 
    JSON.stringify(output, null, 2)
  );
  
  console.log("Résultats sauvegardés dans: scripts/scan-results.json\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
