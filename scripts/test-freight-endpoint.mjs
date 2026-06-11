/**
 * Test endpoint freight-offers
 */
const API_URL = "https://api.upjunoo-dev.tech";
const partnerId = "71a1aad7-ad23-41ca-a6d0-b904d5953271";

const endpoints = [
  { name: "Freight Offers List", path: `/v1/partners/${partnerId}/freight-offers` },
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
        const hasItems = data.items !== undefined;
        const hasStatus = data.status !== undefined;
        console.log(`${name}: ✅ EXISTE`);
        console.log(`   Format: ${hasStatus ? `status: "${data.status}"` : "no status"}, items: ${hasItems ? data.items?.length : "no items"}`);
        if (hasItems && data.items.length > 0) {
          console.log(`   First item keys: ${Object.keys(data.items[0]).slice(0, 8).join(", ")}...`);
        }
        return;
      } catch {
        result = "✅ EXISTE (text)";
      }
    } else if (status === 404) {
      result = "❌ N'existe PAS (404)";
    } else if (status === 401) {
      result = "⚠️ 401 (auth requise)";
    } else {
      const text = await res.text();
      result = `⚠️ ${status}: ${text.slice(0, 100)}`;
    }
    console.log(`${name}: ${result}`);
  } catch(e) {
    console.log(`${name}: ❌ ERROR ${e.message}`);
  }
}

console.log("🔍 Scan Freight Offers...\n");
for (const ep of endpoints) {
  await test(ep.name, ep.path);
}
