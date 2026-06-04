# Générer le PDF du document d'intégration API

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
