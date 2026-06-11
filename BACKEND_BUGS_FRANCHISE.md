# Bugs Backend — Module Franchise

> Découverts via `scripts/test-tab-features.mjs` + `scripts/audit-swagger-gaps.mjs`  
> Dernière mise à jour : **2026-06-11**

---

## Récapitulatif

| ID | Section | Sévérité | Route concernée | Status |
|----|---------|----------|-----------------|--------|
| BUG-001 | FLOTTE | 🔴 HIGH | `GET /v1/franchise/drivers/moderation` | ✅ Corrigé backend |
| BUG-002 | AUTH | 🟡 LOW | `POST /v1/auth/franchise/login` | ✅ Corrigé backend |
| BUG-003 | MARKETING | 🔴 HIGH | `GET /v1/franchise/promos` | ✅ Corrigé backend |
| BUG-004 | MARKETING | 🔴 HIGH | `GET /v1/franchise/marketing/campaigns` | ✅ Corrigé backend |
| BUG-005 | MARKETING | 🔴 HIGH | `GET /v1/franchise/marketing/banners` | ✅ Corrigé backend |
| BUG-006 | SUPPORT | 🔴 HIGH | `GET /v1/franchise/support/tickets` | ✅ Corrigé backend |
| BUG-007 | TERRITOIRE | 🟡 MEDIUM | `POST /v1/franchise/territory/extension-request` | 🔴 Ouvert |
| MANQUE-001 | SUPPORT | 🔴 HIGH | `GET/POST /v1/franchise/support/chat` | ✅ Corrigé backend |
| MANQUE-002 | FLOTTE | 🟡 MEDIUM | `GET /v1/franchises/{id}/drivers/{driverId}` | ✅ Corrigé backend |
| MANQUE-003 | FLOTTE | 🟢 LOW | `GET /v1/franchises/{id}/partners/{partnerId}` | ✅ Corrigé backend |
| MANQUE-004 | TERRITOIRE | 🟢 LOW | `GET /v1/franchises/{id}/orders/{orderId}` | ✅ Corrigé backend |
| MANQUE-006 | FINANCE | 🟢 LOW | `GET /v1/franchise/finance/commissions/{id}` | ⚠️ 404 — no data en base |
| MANQUE-007 | FINANCE | 🟢 LOW | `GET /v1/franchise/finance/reconciliation/{id}` | ⚠️ 404 — no data en base |
| MANQUE-008 | FINANCE | 🔴 HIGH | tous `/v1/franchise/finance/*` (`_xof`→`_fcfa`) | ✅ Corrigé frontend |
| MANQUE-009 | MARKETING | 🟢 LOW | `GET /v1/franchise/promos/{id}` | ⚠️ 404 — no data en base |
| MANQUE-010 | SUPPORT | 🟡 MEDIUM | `GET /v1/franchise/support/tickets/{id}` | ⚠️ 404 — no data en base |

> **⚠️ 404 — no data en base** : la route existe et répond correctement. Le 404 est dû à l'absence de données dans l'environnement de test, pas à un bug d'implémentation.

**Priorité de correction backend restante :**  
🔴 BUG-007 (migration SQL `franchise_territory_requests`) · peupler la base de test pour valider MANQUE-006/007/009/010

---

## Corrections frontend appliquées (à ne pas supprimer)

| Fichier | Modification | Lié à |
|---------|-------------|-------|
| `finance.service.ts` | Mappers `_xof→_fcfa` | MANQUE-008 |
| `support.service.ts` | Routes v1 chat activées + mappers réponse, try/catch retirés | BUG-006 + MANQUE-001 |
| `marketing.service.ts` | try/catch retirés, routes directes | BUG-003/004/005 |
| `promos.service.ts` | try/catch retirés, routes directes | BUG-003 |
| `territory.service.ts` | `requestExtension()` sur `POST .../extension-request` | BUG-007 |
| `territory.queries.ts` | Mutation `useRequestExtension` ajoutée | BUG-007 |
| `FranchiseTerritoryExtensionPage.tsx` | Mock remplacé par vrai appel API | BUG-007 |
| `links.ts` | `extensionRequest`, `supportChats`, `supportChatById`, `supportChatReply` ajoutés | MANQUE-001 + BUG-007 |

---

## 🔴 BUG-007 — `500` sur `POST /v1/franchise/territory/extension-request`

**Sévérité :** MEDIUM  
**Status :** 🔴 OUVERT  
**Section :** TERRITOIRE  
**Découvert :** 2026-06-11

### Symptôme
```
POST /v1/franchise/territory/extension-request
→ 500 Internal Server Error
   "Could not find the table 'public.franchise_territory_requests' in the schema cache"
```

### Cause
La route existe dans le Swagger live mais la **migration SQL créant la table `franchise_territory_requests` n'a pas été exécutée**, ou PostgREST n'a pas rechargé son schema cache.

### Correction attendue (backend)
```sql
CREATE TABLE public.franchise_territory_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  franchise_id UUID NOT NULL REFERENCES franchises(id),
  zone_ids TEXT[] NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```
Ou recharger le schema PostgREST : `POST /v1/admin/postgrest/reload-schema`

### État frontend
Le formulaire d'extension est branché sur la vraie API (`territory.service.ts → requestExtension()`).  
L'erreur 500 remonte correctement à l'utilisateur via `notificationService.error(...)`.
