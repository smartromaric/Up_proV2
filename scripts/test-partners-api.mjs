/**
 * Test ciblé GET /v1/admin/partners — ville, franchise, id
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://api.upjunoo-dev.tech";
const EMAIL = process.env.TEST_ADMIN_EMAIL ?? "dev.admin@upjunoo-dev.tech";
const PASSWORD = process.env.TEST_ADMIN_PASSWORD ?? "Upjunoo@Dev2026!";

async function main() {
  const loginRes = await fetch(`${API_URL}/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const login = await loginRes.json();
  const token = login.accessToken ?? login.session?.access_token;
  if (!token) {
    console.error("Login failed", loginRes.status, login);
    process.exit(1);
  }

  const headers = { Authorization: `Bearer ${token}`, Accept: "application/json" };
  const res = await fetch(`${API_URL}/v1/admin/partners`, { headers });
  const data = await res.json();
  const items = data.items ?? [];

  console.log(`\nGET /v1/admin/partners → HTTP ${res.status}, ${items.length} partenaires\n`);

  const withId = items.filter((p) => p.id).length;
  const withCityLabel = items.filter((p) => p.cityLabel).length;
  const withCityId = items.filter((p) => p.city_id).length;
  const withFranchiseName = items.filter((p) => p.franchiseName || p.franchise_name).length;
  const withDrivers = items.filter((p) => (p.driversCount ?? 0) > 0).length;

  console.log("Statistiques:");
  console.log(`  - avec id (UUID)     : ${withId}/${items.length}`);
  console.log(`  - avec cityLabel     : ${withCityLabel}/${items.length}`);
  console.log(`  - avec city_id       : ${withCityId}/${items.length}`);
  console.log(`  - avec franchiseName : ${withFranchiseName}/${items.length}`);
  console.log(`  - driversCount > 0   : ${withDrivers}/${items.length}`);

  const cityIds = [...new Set(items.map((p) => p.city_id).filter(Boolean))];
  console.log(`  - city_id distincts  : ${cityIds.length} → ${cityIds.slice(0, 2).join(", ")}`);

  console.log("\nÉchantillon (3 premiers):");
  for (const p of items.slice(0, 3)) {
    console.log(JSON.stringify({
      id: p.id,
      name: p.name,
      franchise_id: p.franchise_id,
      franchiseName: p.franchiseName,
      city_id: p.city_id,
      cityLabel: p.cityLabel,
      driversCount: p.driversCount,
    }, null, 2));
  }

  // Bootstrap cities lookup
  const bootRes = await fetch(`${API_URL}/v1/catalog/bootstrap`, { headers });
  const boot = await bootRes.json();
  const bootStr = JSON.stringify(boot);
  for (const cid of cityIds.slice(0, 1)) {
    const found = bootStr.includes(cid);
    console.log(`\nBootstrap contient city_id ${cid.slice(0, 8)}… ? ${found}`);
    if (found) {
      const idx = bootStr.indexOf(cid);
      console.log("Contexte:", bootStr.slice(Math.max(0, idx - 80), idx + 120));
    }
  }

  // Detail endpoint?
  if (items[0]?.id) {
    const pid = items[0].id;
    for (const path of [`/v1/admin/partners/${pid}`, `/v1/partners/${pid}`]) {
      const dr = await fetch(`${API_URL}${path}`, { headers });
      const txt = (await dr.text()).slice(0, 150);
      console.log(`\n${path} → HTTP ${dr.status}: ${txt}`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
