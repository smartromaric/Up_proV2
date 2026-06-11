/**
 * Test rapide des endpoints courses potentiels
 */
const API_URL = "https://api.upjunoo-dev.tech";
const partnerId = "71a1aad7-ad23-41ca-a6d0-b904d5953271";

// Endpoints à tester pour les courses
const endpoints = [
  { group: "Partner Trips", method: "GET", path: `/v1/partners/${partnerId}/trips` },
  { group: "Partner Orders", method: "GET", path: `/v1/partners/${partnerId}/orders` },
  { group: "Partner Rides", method: "GET", path: `/v1/partners/${partnerId}/rides` },
  { group: "Partner Bookings", method: "GET", path: `/v1/partners/${partnerId}/bookings` },
  { group: "Global Orders (filter)", method: "GET", path: `/v1/orders?partner_id=${partnerId}` },
  { group: "Driver Trips", method: "GET", path: `/v1/drivers/2b82e602-244f-46b2-9d36-8161fd78af0b/trips` },
];

// Token d'authentification (à remplacer si expiré)
const TOKEN = process.env.TEST_TOKEN || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9";

async function testEndpoint(endpoint) {
  const url = `${API_URL}${endpoint.path}`;
  try {
    const response = await fetch(url, {
      method: endpoint.method,
      headers: {
        "Authorization": `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
        "X-Client-Type": "back-office"
      }
    });
    
    const result = {
      group: endpoint.group,
      method: endpoint.method,
      path: endpoint.path,
      status: response.status,
      exists: response.status === 200
    };
    
    if (response.status === 200) {
      try {
        const data = await response.json();
        result.format = data.status || (Array.isArray(data) ? "array" : "object");
        result.hasItems = data.items !== undefined || Array.isArray(data);
      } catch {
        result.format = "text";
      }
    }
    
    return result;
  } catch (e) {
    return {
      group: endpoint.group,
      method: endpoint.method,
      path: endpoint.path,
      status: "ERROR",
      error: e.message
    };
  }
}

console.log("🔍 Scan des endpoints courses...\n");

for (const ep of endpoints) {
  const result = await testEndpoint(ep);
  const statusIcon = result.exists ? "✅" : result.status === 404 ? "❌" : "⚠️";
  console.log(`${statusIcon} ${result.group}`);
  console.log(`   ${result.method} ${result.path}`);
  console.log(`   Status: ${result.status}${result.exists ? ` | Format: ${result.format}` : ""}`);
  console.log("");
  await new Promise(r => setTimeout(r, 300));
}

console.log("\n--- Résumé ---");
const existing = results.filter(r => r.exists);
console.log(`Endpoints trouvés: ${existing.length}/${endpoints.length}`);
