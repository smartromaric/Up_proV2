# Générer des PDF — documentation UpJunoo Pro

## Rapport d'activité (écrans + captures)

- HTML : `docs/RAPPORT-ACTIVITE-UPJUNOO-PRO.html`
- Captures : `docs/rapport-activite/captures/` (01 à 08)
- PDF : `docs/RAPPORT-ACTIVITE-UPJUNOO-PRO.pdf`

```bash
node docs/generate-rapport-pdf.mjs
```

(Chrome ou Edge headless sous Windows ; sinon Puppeteer via `npx -p puppeteer`.)

---

## Document d'intégration API

Fichier source : `docs/API-INTEGRATION-BACKOFFICE.md`

## Option 1 — VS Code / Cursor (recommandé)

1. Ouvrir `docs/API-INTEGRATION-BACKOFFICE.md`
2. Extension **Markdown PDF** (yzane.markdown-pdf) ou **Markdown Preview Enhanced**
3. Commande : « Markdown PDF: Export (pdf) »
4. Enregistrer sous `docs/API-INTEGRATION-BACKOFFICE.pdf`

## Option 2 — Ligne de commande

```bash
cd docs
npx md-to-pdf API-INTEGRATION-BACKOFFICE.md
```

Le PDF est créé à côté du `.md` (`API-INTEGRATION-BACKOFFICE.pdf`).  
La première exécution peut être longue (téléchargement Chromium).

## Option 3 — Impression navigateur

1. Ouvrir `docs/API-INTEGRATION-BACKOFFICE.html` (si présent) ou prévisualiser le MD
2. Ctrl+P → Enregistrer au format PDF
