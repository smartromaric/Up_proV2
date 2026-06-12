/**
 * Test endpoints performance et GPS
 */
const API_URL = "https://api.upjunoo-dev.tech";
const partnerId = "71a1aad7-ad23-41ca-a6d0-b904d5953271";

const endpoints = [
  { name: "Vehicle Performance", path: `/v1/partners/${partnerId}/vehicle-performance` },
  { name: "Driver Performance", path: `/v1/partners/${partnerId}/driver-performance` },
  { name: "GPS Devices", path: `/v1/partners/${partnerId}/gps-devices` },
];

async function test(name, path) {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      headers: { 
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
        "X-Client-Type": "back-office"
      }
    });
    const status = res.status;
    let result;
    if (status === 200) {
      try {
        const data = await res.json();
        result = `✅ EXISTE (format: ${data.status || "array"})`;
      } catch {
        result = "✅ EXISTE (text)";
      }
    } else if (status === 404) {
      result = "❌ N'existe PAS";
    } else if (status === 401) {
      result = "⚠️ 401 (auth)";
    } else {
      const text = await res.text();
      result = `⚠️ ${status}: ${text.slice(0, 50)}`;
    }
    console.log(`${name}: ${result}`);
  } catch(e) {
    console.log(`${name}: ❌ ERROR ${e.message}`);
  }
}

console.log("🔍 Scan Performance & GPS...\n");
for (const ep of endpoints) {
  await test(ep.name, ep.path);
  await new Promise(r => setTimeout(r, 300));
}
