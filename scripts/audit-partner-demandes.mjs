/**
 * Audit des demandes backend du RAPPORT-API-MANQUANTE-PARTENAIRE.md
 * Vérifie si les endpoints partenaire retournent les champs attendus.
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
  try { json = text ? JSON.parse(text) : null; } catch { json = { raw: text.slice(0, 300) }; }
  return { status: res.status, ok: res.ok, json };
}

const checks = [];
function add(id, label, status, detail, sample) {
  checks.push({ id, label, status, detail, sample });
  const icon = status === "ok" ? "✓" : status === "partial" ? "~" : "✗";
  console.log(`${icon} [${id}] ${label}`);
  console.log(`    ${detail}`);
  if (sample) console.log(`    → ${JSON.stringify(sample).slice(0, 200)}`);
}

function pick(obj, keys) {
  const out = {};
  for (const k of keys) out[k] = obj?.[k] ?? null;
  return out;
}

async function main() {
  console.log(`\n=== Audit demandes backend PARTENAIRE — ${API_URL} ===\n`);

  const login = await request("/v1/auth/login", {
    method: "POST",
    body: { email: EMAIL, password: PASSWORD },
  });
  const token = login.json?.accessToken ?? login.json?.session?.access_token ?? null;
  if (!token) {
    console.error("Login failed", login.status);
    process.exit(1);
  }

  // Trouver un partenaire
  const partners = await request("/v1/admin/partners?page=1&limit=5", { token });
  const partnerItems = partners.json?.items ?? partners.json?.partners ?? [];
  const partner = partnerItems[0];
  if (!partner?.id) {
    console.error("Aucun partenaire trouvé");
    process.exit(1);
  }
  const pid = partner.id;
  console.log(`Partenaire test: ${pid} (${partner.tradeName ?? partner.name ?? "?"})\n`);

  // ─── P1-01: GET /v1/partners/{id}/drivers ───
  const drv = await request(`/v1/partners/${pid}/drivers?page=1&limit=5`, { token });
  const drvItems = drv.json?.items ?? drv.json?.drivers ?? [];
  const d0 = drvItems[0];
  const hasUser = d0 && (d0.user?.first_name || d0.user?.last_name || d0.user?.phone);
  const hasVehicle = d0 && (d0.vehicle?.label || d0.vehicle?.plate);
  add(
    "PA-DRV-01",
    "GET /v1/partners/{id}/drivers — user { first_name, last_name, phone }",
    hasUser ? "ok" : "missing",
    hasUser
      ? `user.first_name="${d0.user?.first_name ?? ""}", phone="${d0.user?.phone ?? ""}"`
      : "Champ user absent — mapping front en dur",
    d0 ? pick(d0, ["id", "user", "vehicle", "availability_status"]) : null
  );
  add(
    "PA-DRV-02",
    "GET /v1/partners/{id}/drivers — vehicle { label, plate }",
    hasVehicle ? "ok" : "missing",
    hasVehicle
      ? `vehicle.label="${d0.vehicle?.label ?? ""}", plate="${d0.vehicle?.plate ?? ""}"`
      : "Champ vehicle absent — mapping front en dur",
    null
  );

  // ─── P1-02: GET /v1/partners/{id}/vehicles ───
  const veh = await request(`/v1/partners/${pid}/vehicles?page=1&limit=5`, { token });
  const vehItems = veh.json?.items ?? veh.json?.vehicles ?? [];
  const v0 = vehItems[0];
  const hasDriverObj = v0 && (v0.driver?.first_name || v0.driver?.last_name);
  add(
    "PA-VEH-01",
    "GET /v1/partners/{id}/vehicles — driver { first_name, last_name }",
    hasDriverObj ? "ok" : "missing",
    hasDriverObj
      ? `driver.first_name="${v0.driver?.first_name ?? ""}"`
      : "Objet driver absent — seul driver_id présent",
    v0 ? pick(v0, ["id", "driver_id", "driver", "plate_number"]) : null
  );

  // ─── P1-03: GET /v1/partners/{id}/vehicle-performance ───
  const vperf = await request(`/v1/partners/${pid}/vehicle-performance?page=1&limit=5`, { token });
  const vperfItems = vperf.json?.items ?? [];
  const vp0 = vperfItems[0];
  const hasMetrics = vp0 && (vp0.total_km != null || vp0.trips_count != null || vp0.revenue_fcfa != null);
  add(
    "PA-VPERF-01",
    "GET /v1/partners/{id}/vehicle-performance — métriques (total_km, trips_count, revenue_fcfa)",
    hasMetrics ? "ok" : vperf.ok ? "missing" : "missing",
    hasMetrics
      ? `total_km=${vp0.total_km}, trips_count=${vp0.trips_count}, revenue_fcfa=${vp0.revenue_fcfa}`
      : vperf.ok
        ? `HTTP 200 mais shape brute — keys=${Object.keys(vp0 ?? {}).slice(0, 8).join(",")}`
        : `HTTP ${vperf.status}`,
    vp0 ? pick(vp0, ["id", "total_km", "trips_count", "revenue_fcfa"]) : null
  );

  // ─── P1-04: GET /v1/partners/{id}/driver-performance ───
  const dperf = await request(`/v1/partners/${pid}/driver-performance?page=1&limit=5`, { token });
  const dperfItems = dperf.json?.items ?? [];
  const dp0 = dperfItems[0];
  const hasDrvMetrics = dp0 && (dp0.trips_completed != null || dp0.revenue_fcfa != null || dp0.avg_rating != null);
  add(
    "PA-DPERF-01",
    "GET /v1/partners/{id}/driver-performance — métriques (trips_completed, revenue_fcfa, avg_rating)",
    hasDrvMetrics ? "ok" : dperf.ok ? "missing" : "missing",
    hasDrvMetrics
      ? `trips_completed=${dp0.trips_completed}, revenue_fcfa=${dp0.revenue_fcfa}, avg_rating=${dp0.avg_rating}`
      : dperf.ok
        ? `HTTP 200 mais shape brute — keys=${Object.keys(dp0 ?? {}).slice(0, 8).join(",")}`
        : `HTTP ${dperf.status}`,
    dp0 ? pick(dp0, ["id", "trips_completed", "revenue_fcfa", "avg_rating"]) : null
  );

  // ─── P1-05: GET /v1/partners/{id}/ops/map ───
  const map = await request(`/v1/partners/${pid}/ops/map`, { token });
  const mapJson = map.json ?? {};
  const hasStats = mapJson.stats && typeof mapJson.stats.drivers_online === "number";
  const hasDriverLoc = Array.isArray(mapJson.drivers) && mapJson.drivers.some((d) => d.location?.lat != null);
  const hasDriverName = Array.isArray(mapJson.drivers) && mapJson.drivers.some((d) => d.name || d.profile?.displayName);
  const hasRealtime = mapJson.realtime && mapJson.realtime.url && mapJson.realtime.event;
  add(
    "PA-MAP-01",
    "GET /v1/partners/{id}/ops/map — stats { drivers_online, drivers_on_trip, active_trips }",
    hasStats ? "ok" : map.ok ? "missing" : "missing",
    hasStats
      ? `drivers_online=${mapJson.stats.drivers_online}, drivers_on_trip=${mapJson.stats.drivers_on_trip}`
      : map.ok
        ? "Objet stats absent — crash frontend sur .toLocaleString()"
        : `HTTP ${map.status}`,
    mapJson.stats ? pick(mapJson.stats, ["drivers_online", "drivers_on_trip", "active_trips"]) : null
  );
  add(
    "PA-MAP-02",
    "GET /v1/partners/{id}/ops/map — drivers[].location { lat, lng }",
    hasDriverLoc ? "ok" : map.ok ? "missing" : "missing",
    hasDriverLoc
      ? `${mapJson.drivers.filter((d) => d.location?.lat != null).length}/${mapJson.drivers.length} drivers avec location`
      : map.ok
        ? "Aucune location GPS sur les drivers — tous superposés au centre de la carte"
        : `HTTP ${map.status}`,
    mapJson.drivers?.[0] ? pick(mapJson.drivers[0], ["id", "name", "location"]) : null
  );
  add(
    "PA-MAP-03",
    "GET /v1/partners/{id}/ops/map — drivers[].name ou profile.displayName",
    hasDriverName ? "ok" : map.ok ? "missing" : "missing",
    hasDriverName
      ? "Au moins un driver a un nom"
      : map.ok
        ? "Pas de champ name sur les drivers — affichage générique"
        : `HTTP ${map.status}`,
    null
  );
  add(
    "PA-MAP-04",
    "GET /v1/partners/{id}/ops/map — realtime config socket.io",
    hasRealtime ? "ok" : map.ok ? "missing" : "missing",
    hasRealtime
      ? `room=${mapJson.realtime.room}, event=${mapJson.realtime.event}`
      : map.ok
        ? "Pas de config realtime — pas de temps réel sur la carte partenaire"
        : `HTTP ${map.status}`,
    mapJson.realtime ? pick(mapJson.realtime, ["transport", "url", "room", "event"]) : null
  );

  // ─── P2-01: GET /v1/partners/{id}/trips ───
  const trips = await request(`/v1/partners/${pid}/trips?page=1&limit=5`, { token });
  add(
    "PA-TRIPS-01",
    "GET /v1/partners/{id}/trips — endpoint existe",
    trips.ok ? "ok" : "missing",
    trips.ok
      ? `${trips.json?.items?.length ?? trips.json?.trips?.length ?? "?"} course(s)`
      : `HTTP ${trips.status} — endpoint absent du Swagger`,
    trips.ok ? pick(trips.json?.items?.[0] ?? {}, ["id", "ref", "status"]) : null
  );

  // ─── P2-02: POST /v1/partners/{id}/shifts ───
  const shiftsGet = await request(`/v1/partners/${pid}/shifts?page=1&limit=5`, { token });
  const shiftsPost = await request(`/v1/partners/${pid}/shifts`, {
    method: "POST",
    token,
    body: { driver_id: "00000000-0000-0000-0000-000000000001", date: "2026-06-12", start_time: "08:00", end_time: "16:00" },
  });
  add(
    "PA-SHIFTS-01",
    "POST /v1/partners/{id}/shifts — création shift",
    shiftsPost.status === 201 || shiftsPost.status === 200 || shiftsPost.status === 422
      ? "ok"
      : "missing",
    shiftsPost.ok || shiftsPost.status === 422
      ? `HTTP ${shiftsPost.status} — route accessible (422 = validation si driver_id invalide)`
      : `HTTP ${shiftsPost.status} — route probablement absente`,
    shiftsPost.json ? pick(shiftsPost.json, ["status", "id"]) : null
  );

  // ─── P2-03: Socket temps réel partenaire ───
  // On vérifie via le Swagger live si une room partner existe
  const specRes = await fetch(`${API_URL}/docs/json`);
  let hasPartnerSocket = false;
  let socketRooms = [];
  if (specRes.ok) {
    const spec = await specRes.json();
    const paths = Object.keys(spec.paths ?? {});
    const websockets = spec.paths ?? {};
    // On regarde aussi les tags/description pour des refs socket.io
    const allText = JSON.stringify(spec).toLowerCase();
    hasPartnerSocket = allText.includes("partner:live-map") || allText.includes("partner:live:locations");
    socketRooms = hasPartnerSocket ? ["partner:live-map:{id}", "partner:live:locations"] : [];
  }
  add(
    "PA-SOCKET-01",
    "Socket temps réel partenaire — room partner:live-map:{id}",
    hasPartnerSocket ? "ok" : "missing",
    hasPartnerSocket
      ? `Rooms trouvées: ${socketRooms.join(", ")}`
      : "Aucune référence à partner:live-map dans le Swagger — socket non implémenté",
    null
  );

  // ─── Bilan ───
  const ok = checks.filter((c) => c.status === "ok").length;
  const partial = checks.filter((c) => c.status === "partial").length;
  const missing = checks.filter((c) => c.status === "missing").length;
  console.log(`\n=== Bilan partenaire: ${ok} OK · ${partial} partiel · ${missing} manquant ===\n`);

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
