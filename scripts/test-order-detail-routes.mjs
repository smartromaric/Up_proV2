const API = "https://api.upjunoo-dev.tech";
const EMAIL = "dev.admin@upjunoo-dev.tech";
const PASSWORD = "Upjunoo@Dev2026!";

async function login() {
  const res = await fetch(`${API}/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const j = await res.json();
  return j.accessToken ?? j.session?.access_token;
}

async function tryRoute(token, method, path) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  let body = null;
  try {
    body = await res.json();
  } catch {
    body = {};
  }
  const preview = JSON.stringify(body).slice(0, 120);
  console.log(`${method} ${path} → ${res.status} ${preview}`);
  return { status: res.status, body };
}

const token = await login();
const orders = await tryRoute(token, "GET", "/v1/admin/orders");
const id = orders.body?.rides?.[0]?.id;
if (!id) {
  console.log("Pas de course dans admin/orders");
  process.exit(1);
}
console.log(`\nOrder id test: ${id}\n`);

const routes = [
  ["GET", `/v1/admin/orders/${id}`],
  ["GET", `/v1/rides/${id}`],
  ["GET", `/v1/orders/RIDE/${id}`],
  ["GET", `/v1/orders/RIDE/${id}/events`],
  ["GET", `/v1/orders/RIDE/${id}/tracking`],
  ["GET", `/v1/dispatch/RIDE/${id}/status`],
  ["GET", `/v1/dispatch/RIDE/${id}/logs`],
  ["GET", `/v1/commissions/orders/RIDE/${id}`],
];

for (const [method, path] of routes) {
  await tryRoute(token, method, path);
}
