/**
 * Captures OCR / wizard inscription — nécessite `npm run dev` sur :3000
 * Usage: node scripts/capture-ocr-screenshots.mjs [YYYY-MM-DD]
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const reportDate =
  process.argv[2] ??
  process.env.REPORT_DATE ??
  new Date().toISOString().slice(0, 10);

const REPORT_DIR = path.join(ROOT, "docs", `rapport-activite-${reportDate}`);
const OUT_DIR = path.join(REPORT_DIR, "screenshots");
const BASE = process.env.SCREENSHOT_BASE_URL ?? "http://localhost:3000";
const EMAIL = process.env.DEV_ADMIN_EMAIL ?? "dev.admin@upjunoo-dev.tech";
const PASSWORD = process.env.DEV_ADMIN_PASSWORD ?? "Upjunoo@Dev2026!";
const SAMPLE_IMAGE = path.join(ROOT, "public", "assets", "logo.png");
const PADDLE_DOCS = process.env.PADDLE_OCR_BASE_URL?.replace(/\/$/, "") ?? "http://194.29.101.141:8866";

const results = [];

async function capture(page, slug, label, extra = {}) {
  const file = `screenshots/${slug}.png`;
  const out = path.join(REPORT_DIR, file);
  await page.screenshot({ path: out, fullPage: true });
  results.push({ slug, label, file, ok: true, ...extra });
  console.log(`OK  ${slug}`);
}

async function waitReady(page) {
  await page.waitForLoadState("networkidle", { timeout: 25_000 }).catch(() => {});
  await page.waitForTimeout(800);
}

async function login(page) {
  await page.goto(`${BASE}/admin/login`, { waitUntil: "domcontentloaded" });
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/admin\/(dashboard|fleet)/, { timeout: 30_000 });
  await waitReady(page);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: "fr-FR",
  });
  const page = await context.newPage();

  try {
    await login(page);

    await page.goto(`${BASE}/admin/fleet/vehicles`, { waitUntil: "domcontentloaded" });
    await waitReady(page);
    await capture(page, "07-vehicules-liste", "Liste véhicules — accès création paire");

    await page.goto(`${BASE}/admin/fleet/vehicles/new`, { waitUntil: "domcontentloaded" });
    await waitReady(page);
    await capture(page, "30-wizard-mode", "Wizard — choix mode IA ou manuel");

    await page.getByRole("button", { name: /Aide à la saisie/i }).click();
    await waitReady(page);
    await capture(page, "31-wizard-documents", "Wizard — téléversement CNI, permis, carte grise");

    const fileInputs = page.locator('input[type="file"]');
    const count = await fileInputs.count();
    for (let i = 0; i < count; i++) {
      await fileInputs.nth(i).setInputFiles(SAMPLE_IMAGE);
    }
    await page.waitForTimeout(500);
    await capture(page, "31b-wizard-documents-filled", "Wizard — pièces jointes renseignées");

    await page.getByRole("button", { name: /Lancer l'analyse/i }).click();
    await page.waitForTimeout(600);
    await capture(page, "32-wizard-extraction", "Wizard — analyse OCR en cours");

    await page.getByText("Vérification", { exact: false }).waitFor({ timeout: 120_000 }).catch(() => {});
    await page.waitForTimeout(1500);
    await capture(page, "33-wizard-review", "Wizard — vérification champs préremplis (IA)");

    await page.goto(`${PADDLE_DOCS}/docs`, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await waitReady(page);
    await capture(page, "35-paddle-ocr-swagger", "API PaddleOCR VPS — documentation Swagger", {
      url: `${PADDLE_DOCS}/docs`,
    });

    await page.goto(`${PADDLE_DOCS}/health`, { waitUntil: "domcontentloaded" });
    await waitReady(page);
    await capture(page, "36-paddle-ocr-health", "API PaddleOCR VPS — health check", {
      url: `${PADDLE_DOCS}/health`,
    });
  } catch (err) {
    console.error("ERR", err.message);
    results.push({ slug: "error", label: err.message, ok: false });
  } finally {
    await browser.close();
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE,
    paddleOcrUrl: PADDLE_DOCS,
    topic: "ocr-inscription-ia",
    results,
  };
  await writeFile(
    path.join(REPORT_DIR, "manifest-ocr.json"),
    JSON.stringify(manifest, null, 2),
    "utf8"
  );
  console.log(`Manifest: docs/rapport-activite-${reportDate}/manifest-ocr.json`);
}

main();
