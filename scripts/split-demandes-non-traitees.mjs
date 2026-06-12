/**
 * Extrait les demandes non traitées vers docs/DEMANDES_NON_TRAITEES_10_06_2026.md
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const srcPath = path.join(ROOT, "docs", "DEMANDES-2026-06-10.md");
const outPath = path.join(ROOT, "docs", "DEMANDES_NON_TRAITEES_10_06_2026.md");

const lines = fs.readFileSync(srcPath, "utf8").split(/\r?\n/);

const openIds = [
  "SOS-DETAIL-01",
  "BINOME-UPLOAD-01",
  "DR-PARTNER-SUGGEST-01",
  "FN-TRANS-LABELS-01",
  "PA-DOC-01",
  "PA-01 / PA-02",
  "FN-TRANS-01",
  "OR-TRACK-01",
  "MK-BAN-01",
  "FLT-VEHICLE-DETAIL-01",
  "DR-AVAIL-01",
  "SWAGGER-DOC-01",
];

function extractSection(id) {
  const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`^## ${escaped}`);
  const start = lines.findIndex((l) => re.test(l));
  if (start < 0) return "";
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^## /.test(lines[i]) && !lines[i].startsWith("###")) {
      end = i;
      break;
    }
  }
  return lines.slice(start, end).join("\n");
}

const header = `# Demandes backend non traitées — 10 juin 2026

> **Document de transmission équipe API** — sujets encore ouverts ou partiels au **10/06/2026** (réaudit Swagger live v0.4.0 + probes API).  
> Swagger : [api.upjunoo-dev.tech/docs](https://api.upjunoo-dev.tech/docs)  
> Vérification : \`node scripts/check-demandes-swagger.mjs\` · \`node scripts/audit-backend-demandes.mjs\`  
> Demandes **traitées / fermées** : voir [DEMANDES-2026-06-10.md](./DEMANDES-2026-06-10.md)

---

## Synthèse réaudit (10/06/2026 — soir)

| Statut | IDs |
|--------|-----|
| **Non traité** | PA-01/02, PA-DOC-01, BINOME-UPLOAD-01, DR-AVAIL-01, DR-PARTNER-SUGGEST-01, FN-TRANS-LABELS-01, MK-BAN-01, SOS-DETAIL-01, SWAGGER-DOC-01, IMG-01 |
| **Partiel** | OR-TRACK-01 (\`tracking\` présent, pas d'historique GPS), FN-TRANS-01 (\`filterOptions\` OK, libellés franchise UUID), FLT-VEHICLE-DETAIL-01 |
| **Traité (retiré de ce fichier)** | FLT-COMPLIANCE-01, ZN-GEO-01 → voir fichier principal |

---

## Tableau des demandes ouvertes

| ID | Priorité | Résumé | Réaudit |
|----|----------|--------|---------|
| **BINOME-UPLOAD-01** / **FLT-UPLOAD-01** | Haute | Multipart upload KYC + pièces véhicule (wizard binôme) | ✗ 0 multipart dans Swagger |
| **PA-DOC-01** | Haute | Documents société partenaire (RCCM) | ✗ |
| **PA-01 / PA-02** | Haute | \`franchiseName\` / \`cityLabel\` null sur liste partenaires | ✗ confirmé audit |
| **FN-TRANS-LABELS-01** | Haute | \`franchise.name\` = UUID sur transactions | ✗ |
| **FN-TRANS-01** | Haute | Filtres + enrichissement liste transactions | ~ \`filterOptions\` OK |
| **OR-TRACK-01** | Haute | Trajectoire GPS dynamique (pas ligne droite) | ~ \`tracking\` partiel |
| **MK-BAN-01** | Haute | Bannières : upload image + POST création | ✗ POST non retesté |
| **DR-AVAIL-01** | Haute | Routes suspend / activate / availability chauffeur admin | ✗ PATCH non doc, pas /suspend |
| **DR-PARTNER-SUGGEST-01** | Haute | \`suggestedPartner\` à la création chauffeur | ✗ absent spec |
| **SOS-DETAIL-01** | Haute | Libellés FR \`{ value, label }\` sur SOS | ? 0 incident en base |
| **FLT-VEHICLE-DETAIL-01** | Moyenne | Objet \`color\` sur détail véhicule | ~ souvent absent |
| **SWAGGER-DOC-01** | Moyenne | Documenter params, multipart, réponses admin | ✗ |
| **IMG-01** | Moyenne | Images seed Supabase HTTP 400 | ✗ audit |

---

## Détail par demande

`;

const sections = openIds.map((id) => extractSection(id)).filter(Boolean);
const img01 = `
---

## IMG-01 — Images seed Supabase inaccessibles

### Contexte

Certaines URLs \`file_url\` KYC (seed Supabase) renvoient **HTTP 400** alors que l'API les expose.

### Réaudit 10/06/2026

- Audit \`audit-backend-demandes.mjs\` : **manquant** (profile-photo.jpg inaccessible)
- Bloque l'aperçu documents en dev pour certains seeds

### Ticket backend synthétique

> **Titre** : Corriger URLs seed KYC Supabase ou régénérer fichiers publics  
> **Acceptance** : \`file_url\` accessibles en HTTPS 200 pour documents seed
`;

fs.writeFileSync(
  outPath,
  `${header}${sections.join("\n\n---\n\n")}${img01}\n\n---\n\n## Références\n\nVoir [DEMANDES-2026-06-10.md](./DEMANDES-2026-06-10.md) § Références.\n`
);

console.log(`OK ${outPath} (${sections.length} sections extraites)`);
