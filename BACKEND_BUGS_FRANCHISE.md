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
| MANQUE-011 | PARTENAIRES | 🔴 HIGH | `GET /v1/franchises/{id}/partners/{pid}/drivers` | 🔴 Ouvert — route inexistante |
| MANQUE-012 | PARTENAIRES | 🔴 HIGH | `GET /v1/franchises/{id}/partners/{pid}/orders` | 🔴 Ouvert — route inexistante |
| MANQUE-013 | PARTENAIRES | 🔴 HIGH | `GET /v1/franchises/{id}/partners/{pid}/commissions` | 🔴 Ouvert — route inexistante |
| MANQUE-014 | CHAUFFEURS | 🔴 HIGH | `POST /v1/franchises/{id}/drivers` | 🔴 Ouvert — route de création inexistante |
| MANQUE-015 | CHAUFFEURS | 🔴 HIGH | `POST /v1/franchises/{id}/drivers/{driverId}/suspend` | 🔴 Ouvert — route inexistante |
| MANQUE-016 | CHAUFFEURS | 🔴 HIGH | `POST /v1/franchises/{id}/drivers/{driverId}/activate` | 🔴 Ouvert — route inexistante |
| MANQUE-017 | CHAUFFEURS | 🔴 HIGH | `DELETE /v1/franchises/{id}/drivers/{driverId}` | 🔴 Ouvert — route inexistante |
| MANQUE-018 | CHAUFFEURS | 🔴 HIGH | `PATCH /v1/franchises/{id}/drivers/{driverId}` | 🔴 Ouvert — route inexistante |
| MANQUE-019 | CHAUFFEURS | 🟡 MEDIUM | Champs manquants dans `GET /v1/franchises/{id}/drivers/{driverId}` | 🔴 Ouvert |
| MANQUE-020 | DASHBOARD | 🟡 MEDIUM | Champs manquants dans `GET /v1/franchise/dashboard` | 🔴 Ouvert |
| MANQUE-021 | TERRITOIRE | 🟢 LOW | Champs manquants dans `GET /v1/franchise/territory` | 🔴 Ouvert |
| MANQUE-022 | FINANCE | 🟡 MEDIUM | Champs manquants dans `GET /v1/franchise/finance` | 🔴 Ouvert |
| MANQUE-023 | CLIENTS | 🔴 HIGH | Champs manquants dans `GET /v1/franchise/clients` et `/{id}` | 🔴 Ouvert |
| MANQUE-024 | RÉCONCILIATION | 🔴 HIGH | `GET /v1/franchise/finance/reconciliation` retourne `items: []` et `entries: []` vides | 🔴 Ouvert |

> **⚠️ 404 — no data en base** : la route existe et répond correctement. Le 404 est dû à l'absence de données dans l'environnement de test, pas à un bug d'implémentation.

**Priorité de correction backend restante :**  
🔴 BUG-007 (migration SQL `franchise_territory_requests`)  
🔴 MANQUE-011/012/013 (sous-routes partenaire — Chauffeurs / Courses / Commissions)  
🔴 MANQUE-014 à 018 (CRUD chauffeur — création, suspension, réactivation, suppression, modification)  
🟡 MANQUE-019/020/021/022 (enrichissement champs existants)  
⚠️ Peupler la base de test pour valider MANQUE-006/007/009/010

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
| `adminPartners.api.types.ts` | `ApiAdminPartnerStats` + champs `stats`, `address`, `vehicles_count`, `wallet_id`, etc. | MANQUE-003 |
| `partners.service.ts` | Mapper `getById` exploite `stats.revenue_xof`, `trips_count`, `wallet_balance_xof`, `drivers_count`, `vehicles_count`, `address`, `commission_rate`, `partner_type` | MANQUE-003 |
| `FranchisePartnerDetailPage.tsx` | Tab Aperçu : 6 KPI cards + bloc Infos commerciales (type, taux, registre, tax_id) | MANQUE-003 |

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

---

## 🔴 MANQUE-011 — `GET /v1/franchises/{id}/partners/{pid}/drivers`

**Sévérité :** HIGH  
**Status :** 🔴 OUVERT  
**Section :** PARTENAIRES — Tab "Chauffeurs"  
**Découvert :** 2026-06-11

### Contexte
La page détail partenaire affiche un tab **Chauffeurs** listant les chauffeurs rattachés à ce partenaire spécifique. Cette route n'existe pas encore.

### Réponse attendue
```json
{
  "status": "ok",
  "items": [
    {
      "id": "uuid",
      "first_name": "Kouamé",
      "last_name": "Yao",
      "phone": "+2250700000000",
      "account_status": "active",
      "availability": "online",
      "zone": "Plateau"
    }
  ],
  "pagination": { "total": 13, "page": 1, "per_page": 20, "total_pages": 1 }
}
```

### Alternative possible
Utiliser `GET /v1/franchise/drivers?partner_id={pid}` si ce filtre est disponible.

### État frontend
Le hook `useFranchisePartnerDrivers` et le service `franchisePartnersService.getDrivers()` sont prêts.  
Le tab affichera une liste vide jusqu'à ce que la route existe.

---

## 🔴 MANQUE-012 — `GET /v1/franchises/{id}/partners/{pid}/orders`

**Sévérité :** HIGH  
**Status :** 🔴 OUVERT  
**Section :** PARTENAIRES — Tab "Courses"  
**Découvert :** 2026-06-11

### Contexte
La page détail partenaire affiche un tab **Courses** listant les courses effectuées par les chauffeurs de ce partenaire. Cette route n'existe pas encore.

### Réponse attendue
Même format que `GET /v1/franchises/{id}/orders` mais filtré sur `partner_id` :
```json
{
  "status": "ok",
  "orders": [...],
  "pagination": { "total": 90, "page": 1, "limit": 20, "totalPages": 5 }
}
```

### Alternative possible
Utiliser `GET /v1/franchises/{id}/orders?partner_id={pid}` si le filtre est supporté.

### État frontend
Le hook `useFranchisePartnerOrders` et le service `franchisePartnersService.getOrders()` sont prêts.

---

## 🔴 MANQUE-013 — `GET /v1/franchises/{id}/partners/{pid}/commissions`

**Sévérité :** HIGH  
**Status :** 🔴 OUVERT  
**Section :** PARTENAIRES — Tab "Commissions"  
**Découvert :** 2026-06-11

### Contexte
La page détail partenaire affiche un tab **Commissions** avec les commissions perçues par course + statistiques agrégées. Cette route n'existe pas encore.

### Réponse attendue
```json
{
  "status": "ok",
  "items": [
    {
      "id": "uuid",
      "trip_ref": "TRP-001",
      "trip_id": "uuid",
      "driver_name": "Kouamé Yao",
      "rate_pct": 15,
      "amount_fcfa": 2500,
      "status": "paid",
      "created_at": "2026-06-05T16:00:51Z"
    }
  ],
  "pagination": { "total": 90, "page": 1, "per_page": 20, "total_pages": 5 },
  "stats": {
    "total_fcfa": 250200,
    "avg_rate_pct": 15,
    "count": 90
  }
}
```

> **Note :** `stats.total_fcfa` = `revenue_xof` déjà renvoyé par `GET .../partners/{pid}`. Les stats globales sont donc déjà disponibles — seul le détail ligne par ligne manque.

### État frontend
Le hook `useFranchisePartnerCommissions` et le service `franchisePartnersService.getCommissions()` sont prêts.  
Le tab Commissions affiche déjà les KPI stats globales (depuis `getById`) et attend la liste paginée.

---

## 🔴 MANQUE-014 — `POST /v1/franchises/{id}/drivers` (création chauffeur)

**Sévérité :** HIGH  
**Status :** 🔴 OUVERT  
**Section :** CHAUFFEURS  
**Découvert :** 2026-06-11

### Contexte
La page `/franchise/drivers/new` permet à la franchise de créer un nouveau chauffeur directement. La route de création n'existe pas encore côté franchise — seul le portail admin possède `POST /v1/admin/drivers`.

### Corps de la requête attendu
```json
{
  "first_name": "Kouamé",
  "last_name": "Yao",
  "phone": "+2250700000000",
  "email": "k.yao@exemple.com",
  "ride_category_code": "STANDARD",
  "accepts_cash": true,
  "accepts_wallet": true
}
```

### Réponse attendue
```json
{
  "status": "ok",
  "driver": {
    "id": "uuid",
    "first_name": "Kouamé",
    "last_name": "Yao",
    "phone": "+2250700000000",
    "account_status": "pending",
    "created_at": "2026-06-11T15:00:00Z"
  }
}
```

### État frontend
Le hook `useCreateFranchiseDriver` et la méthode `franchiseDriversService.create()` sont prêts.  
La page `FranchiseDriverNewPage.tsx` est fonctionnelle. L'appel API échouera avec 404 jusqu'à déploiement de la route.

---

## 🔴 MANQUE-015 — `POST /v1/franchises/{id}/drivers/{driverId}/suspend`

**Sévérité :** HIGH  
**Status :** 🔴 OUVERT  
**Section :** CHAUFFEURS

### Contexte
Le bouton "Suspendre" sur la fiche chauffeur appelle cette route. Elle n'existe pas côté franchise.

### Corps attendu
```json
{ "reason": "Comportement signalé" }
```

### Réponse attendue
```json
{ "status": "ok", "driver": { "id": "uuid", "account_status": "suspended" } }
```

### État frontend
`franchiseDriversService.suspend()` + `useSuspendFranchiseDriver` sont prêts.

---

## 🔴 MANQUE-016 — `POST /v1/franchises/{id}/drivers/{driverId}/activate`

**Sévérité :** HIGH  
**Status :** 🔴 OUVERT  
**Section :** CHAUFFEURS

### Contexte
Le bouton "Réactiver" sur la fiche chauffeur suspendu appelle cette route.

### Réponse attendue
```json
{ "status": "ok", "driver": { "id": "uuid", "account_status": "active" } }
```

### État frontend
`franchiseDriversService.unsuspend()` + `useUnsuspendFranchiseDriver` sont prêts.

---

## 🔴 MANQUE-017 — `DELETE /v1/franchises/{id}/drivers/{driverId}`

**Sévérité :** HIGH  
**Status :** 🔴 OUVERT  
**Section :** CHAUFFEURS

### Contexte
Le bouton "Supprimer" sur la fiche chauffeur appelle cette route. Après suppression, le frontend redirige vers `/franchise/drivers`.

### Réponse attendue
```json
{ "status": "ok" }
```

### État frontend
`franchiseDriversService.delete()` + `useDeleteFranchiseDriver` sont prêts.

---

## 🔴 MANQUE-018 — `PATCH /v1/franchises/{id}/drivers/{driverId}`

**Sévérité :** HIGH  
**Status :** 🔴 OUVERT  
**Section :** CHAUFFEURS

### Contexte
Le formulaire "Modifier" sur la fiche chauffeur appelle cette route.

### Corps attendu (champs partiels acceptés)
```json
{
  "first_name": "Kouamé",
  "last_name": "Yao",
  "phone": "+2250700000000",
  "email": "k.yao@exemple.com",
  "ride_category_code": "CONFORT",
  "accepts_cash": true,
  "accepts_wallet": true
}
```

### Réponse attendue
```json
{ "status": "ok", "driver": { ...driver_detail_complet } }
```

### État frontend
`franchiseDriversService.update()` + `useUpdateFranchiseDriver` sont prêts.

---

## 🟡 MANQUE-019 — Champs manquants dans `GET /v1/franchises/{id}/drivers/{driverId}`

**Sévérité :** MEDIUM  
**Status :** 🔴 OUVERT  
**Section :** CHAUFFEURS — fiche détail

### Champs absents ou non renvoyés actuellement

| Champ | Utilisé dans | Description |
|-------|-------------|-------------|
| `stats.trips_completed` | Tab Aperçu KPI | Courses terminées |
| `stats.trips_cancelled` | Tab Aperçu KPI | Courses annulées |
| `stats.acceptance_rate_pct` | Tab Aperçu KPI | Taux d'acceptation (renvoie `null`) |
| `stats.wallet_balance_fcfa` | Sidebar solde | Solde wallet en FCFA |
| `rating_avg` | Tab Aperçu KPI | Note moyenne (distincte de `rating`) |
| `rating_count` | Tab Aperçu | Nombre d'avis |
| `cancellation_rate` | Tab Aperçu | Taux d'annulation en % |
| `reliability_score` | Tab Aperçu KPI | Score 0-100 |
| `total_completed_orders` | Tab Aperçu | Total courses terminées lifetime |
| `accepts_cash` | Tab Aperçu + sidebar | Mode paiement cash |
| `accepts_wallet` | Tab Aperçu + sidebar | Mode paiement wallet |
| `last_online_at` | Tab Aperçu | Date/heure dernière connexion |
| `ride_category_code` | Tab Aperçu | Catégorie (STANDARD/CONFORT/VIP/MOTO) |
| `kyc_status` | Tab Aperçu | Statut KYC texte |
| `onboarding_status` | Tab Aperçu | Statut onboarding |
| `is_online` | Sidebar badge | Disponibilité temps réel |
| `wallet_balance_xof` | Sidebar solde | Fallback si `stats.wallet_balance_fcfa` absent |
| `timeline` | Tab Historique | Tableau d'événements `[]` actuellement |

### État frontend
Tous ces champs sont typés dans `DriverDetail` (`shared/types/index.ts`) et affichés avec fallback gracieux (`"—"` ou `0`). Dès que le backend les renvoie, ils s'afficheront automatiquement.

---

## 🟡 MANQUE-020 — Champs manquants dans `GET /v1/franchise/dashboard`

**Sévérité :** MEDIUM  
**Status :** 🔴 OUVERT  
**Section :** DASHBOARD

### Champs absents ou non utilisables actuellement

| Champ API attendu | Utilisé dans | Description |
|------------------|-------------|-------------|
| `dashboard.trips_today_trend_pct` | HeroTripsTodayKpi trend | Tendance % courses vs veille |
| `dashboard.trips_completed_today` | KPI card | Courses terminées aujourd'hui |
| `dashboard.revenue_today_xof` | Non affiché faute de données | CA aujourd'hui |
| `dashboard.revenue_trend_pct` | Non affiché | Tendance CA |
| `dashboard.drivers_online` | KPI en ligne / total | Chauffeurs en ligne actuellement (renvoie 0) |
| `dashboard.pending_kyc` | Bandeau KYC | Dossiers en attente modération |
| `dashboard.pending_withdrawals.partners_xof` | KPI retraits | Retraits partenaires en attente |
| `dashboard.pending_withdrawals.drivers_xof` | KPI retraits | Retraits chauffeurs en attente |
| `dashboard.weekly_flow.revenue[]` | Graphique barres | Revenus par jour (renvoie `[]` si absent) |
| `dashboard.weekly_flow.trips[]` | Graphique barres | Courses par jour |

### État frontend
Le mapper `franchiseDashboard.mapper.ts` tente tous les alias connus (`d.drivers_online`, `d.driversOnline`, etc.). Les champs affichés avec `0` ou `"—"` sont ceux non encore fournis par l'API.

---

## 🟢 MANQUE-021 — Champs manquants dans `GET /v1/franchise/territory`

**Sévérité :** LOW  
**Status :** 🔴 OUVERT  
**Section :** TERRITOIRE

### Champs absents ou partiels

| Champ | Utilisé dans | Description |
|-------|-------------|-------------|
| `stats.area_km2` | KPI Superficie | Superficie totale du territoire en km² |
| `stats.partners_count` | KPI Partenaires | Nombre de partenaires sur le territoire |
| `zones[].drivers_active` | Sidebar zone sélectionnée | Chauffeurs actifs par zone |

### État frontend
Affiché avec `0` si absent. Type `FranchiseTerritory` dans `shared/types/index.ts`.

---

## 🟡 MANQUE-022 — Champs manquants dans `GET /v1/franchise/finance`

**Sévérité :** MEDIUM  
**Status :** 🔴 OUVERT  
**Section :** FINANCE

### Champs absents ou ambigus

| Champ API attendu | Mappé depuis | Description |
|------------------|-------------|-------------|
| `summary.commissions_month_xof` | `commission_month_fcfa` | Commissions du mois (parfois 0) |
| `summary.pending_withdrawal_xof` | `payouts_pending_fcfa` | Paiements en attente |
| `summary.available_xof` | `available_fcfa` | Solde disponible pour recharges |
| `wallet.recent_movements[]` | `transactions[]` | Mouvements récents (tableau vide si absent) |
| `wallet.recent_movements[].amount_xof` | `amount_fcfa` | Montant mouvement |
| `wallet.recent_movements[].direction` | `direction` | `"credit"` ou `"debit"` |
| Recharge stats — `total_amount_xof` | `total_spent_fcfa` | Total recharges chauffeurs/partenaires |

### Problème observé
`summary.available_xof` est souvent `null` ou `0` côté API, ce qui désactive le bouton "Recharger un partenaire" (guard `available <= 0`).

### État frontend
Le mapper `mapV1Finance()` dans `finance.service.ts` tente tous les alias connus. La page affiche `0 FCFA` pour les champs non renvoyés.

---

## 🔴 MANQUE-023 — Champs manquants dans `GET /v1/franchise/clients` et `GET /v1/franchise/clients/{id}`

**Sévérité :** HIGH  
**Status :** 🔴 OUVERT  
**Section :** CLIENTS  
**Découvert :** 2026-06-11

### Champs actuellement renvoyés par l'API (confirmés)

```json
{
  "id": "uuid",
  "display_name": null,
  "first_name": "Seed",
  "last_name": "seed ci ci-p5 d13",
  "phone": "+2250795501918",
  "email": "seed.ci.ci-p5.d13@upjunoo-dev.tech",
  "user_type": "DRIVER",
  "status": "active",
  "created_at": "2026-06-05T16:01:22.128Z",
  "fullName": "Seed seed ci ci-p5 d13"
}
```

### Champs manquants — liste `GET /v1/franchise/clients`

| Champ attendu | Utilisé dans | Description |
|--------------|-------------|-------------|
| `trips_count` | Colonne "Courses" | Nombre total de courses du client |
| `wallet_balance_xof` | Colonne "Wallet" | Solde wallet en XOF |
| `last_trip_at` | Colonne "Dernière course" | Date de la dernière course |

### Champs manquants — détail `GET /v1/franchise/clients/{id}`

| Champ attendu | Utilisé dans | Description |
|--------------|-------------|-------------|
| `trips_count` / `tripsCount` | KPI "Courses totales" | Total courses |
| `wallet_balance_xof` | KPI "Solde wallet" | Solde wallet |
| Objet `profile.orders_completed_count` | KPI courses | Fallback si `trips_count` absent |
| `profile.cancelled_trips_count` | KPI "Annulées" | Courses annulées |
| `profile.total_spent_xof` | KPI "Dépenses totales" | Total dépensé lifetime |
| `recentOrders[]` | Tableau courses récentes | Liste des dernières courses |
| `recentOrders[].orderReference` | Réf. course | Référence lisible |
| `recentOrders[].amountXof` | Montant | Montant de la course |
| `recentOrders[].pickupAddress` | Trajet | Adresse départ |
| `recentOrders[].dropoffAddress` | Trajet | Adresse arrivée |
| `recentOrders[].status` | Statut | Statut de la course |

### Problème observé
`user_type` renvoie `"DRIVER"` pour des entrées dans la liste clients. L'API `/v1/franchise/clients` semble renvoyer tous les utilisateurs (clients + chauffeurs) sans filtrage par `user_type === "CLIENT"`. Le frontend filtre côté client mais cela affecte la pagination.

**Demande backend :** Filtrer uniquement les `user_type = "CLIENT"` par défaut, ou accepter un paramètre `?user_type=CLIENT` dans la query string.

### État frontend
- Le mapper `mapV1ClientItem()` dans `franchise/api/clients.service.ts` gère tous les alias connus.  
- Affiche `0` / `"—"` pour les champs absents.  
- Un badge "Chauffeur" s'affiche si `user_type === "DRIVER"` pour signaler les entrées incorrectes.

---

## 🔴 BUG-CLIENTS-001 — `GET /v1/franchise/clients/{id}` retourne `ADMIN_REQUIRED` (403)

**Sévérité :** CRITIQUE  
**Status :** 🔴 OUVERT  
**Section :** CLIENTS  
**Découvert :** 2026-06-11

### Symptôme
```json
{ "error": { "code": "ADMIN_REQUIRED", "message": "Admin role required" } }
```
La route `GET /v1/franchise/clients` (liste) fonctionne correctement avec le token franchise.  
La route `GET /v1/franchise/clients/{id}` (détail) retourne 403 `ADMIN_REQUIRED` avec le même token.

### Cause probable
La route de détail a un guard middleware `requireAdmin` au lieu de `requireFranchise`.

### Correction attendue
Autoriser le rôle `franchise` sur `GET /v1/franchise/clients/{id}`, de même que pour les actions `suspend` et `activate`.

### Workaround frontend appliqué
Le service `franchiseClientsService.get()` tente d'abord `/v1/franchise/clients/{id}`, puis en cas de `ADMIN_REQUIRED` ou `403` bascule automatiquement sur la route legacy `/franchise/fleet/clients/{id}`.
