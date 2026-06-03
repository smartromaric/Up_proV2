# UpJunoo Pro — Contexte projet

> Document de référence pour l’état d’avancement du back-office React/Next.js.  
> Dernière mise à jour : juin 2026.

---

## 1. Vision produit

**UpJunoo Pro** est le back-office multi-portails pour la mobilité à Abidjan (Côte d’Ivoire).

| Portail | Rôle | Périmètre |
|---------|------|-----------|
| **Admin** | Plateforme UpJunoo | Ops, réseau, flotte, finance, **paramétrage** (dispatchers, règles, rôles, tarifs) |
| **Partenaire** | Owner / flotte locale | Véhicules, chauffeurs, réservations manuelles, portefeuille |
| **Franchise** | Territoire | Sous-partenaires, modération KYC locale, finance territoire |

**Charte UI** : navy / teal, interface épurée premium — pas de clone Bootstrap admin générique.  
**Données locales** : format FCFA (`1 245 800 FCFA`), noms et lieux ivoiriens (Cocody, Yopougon, Plateau…).

---

## 2. Stack & conventions

| Élément | Valeur |
|---------|--------|
| Framework | **Next.js 15** App Router (note : spec initiale mentionnait Vite — le repo est Next.js) |
| Langage | TypeScript |
| Styles | Tailwind CSS |
| Data fetching | TanStack Query |
| État global | Zustand (`authStore`) |
| Mocks dev | MSW — `NEXT_PUBLIC_USE_MOCKS=true` |
| API | `*/api/v2/...` via `apiClient` / `fetchClient` |
| RBAC | Guard route + menu filtré par permissions |
| Scope API | `platform` \| `franchise_id` \| `owner_id` injecté dans les queries |

### Logins mock

| Portail | Email | Mot de passe | URL |
|---------|-------|--------------|-----|
| Admin | `admin@upjunoo.ci` | `demo` | `/admin/login` |
| Partenaire | `contact@cocodyexpress.ci` | `demo` | `/partner/login` |
| Franchise | `franchise@abidjansud.ci` | `demo` | `/franchise/login` |

### Structure repo

```text
src/
├── app/           # Routes Next.js (App Router)
├── core/          # HTTP, auth, config
├── features/      # Domaines métier (auth, ops, partner, …)
├── portals/       # Shells & navigation par portail
├── shared/        # UI, types, utils
└── mocks/         # MSW handlers + fixtures JSON
```

### Docs complémentaires

- `REACT_REFONTE_KICKSTART.md` — cahier technique routes & priorités
- `BACKOFFICE_VISION_DESIGN.md` — vision UI / motion
- `README.md` — démarrage rapide & URLs de test

---

## 3. Priorités d’implémentation

### P0 — Critique (prochaine itération)

| Route | Description |
|-------|-------------|
| `/admin/settings/dispatchers` | Liste + fiche comptes dispatchers |
| `/admin/settings/dispatch-rules` | Règles de dispatch (matching, timeout, priorités) |

### P1 — Important

| Route | Description |
|-------|-------------|
| `/admin/settings/roles` | Rôles & permissions |
| `/admin/settings/pricing` | Tarification |
| `/admin/network/zones` | ✅ Déjà fait (liste + détail) |
| `/admin/ops/dispatch` | Console dispatch manuel (assigner course) |

### P2 — Backlog

Intégrations, audit, marketing, forensic GPS, mode crise, clients B2C/B2B, promos franchise, etc.

---

## 4. Ce qui est déjà fait

### 4.1 Infrastructure transverse

- [x] Auth 3 portails (`/login`, admin / partner / franchise login)
- [x] `AuthGuard`, cookie `upjunoo_auth`, `middleware.ts`
- [x] `apiClient`, `fetchClient`, `notificationService`
- [x] MSW : handlers `auth`, `dashboard`, `ops`, `fleet`, `network`, `finance`, `partner`, `franchise`
- [x] Shells portails : `AdminShell`, `PartnerShell`, `FranchiseShell`, `PortalSidebar`
- [x] Design system : `Button`, `PageHeader`, `KpiCard`, `StatusPill`, `Timeline`, `Tabs`, `ConfirmModal`, `EmptyState`, pills métier…
- [x] **`DataTable`** : pagination client (10/25/50/100), hauteur fixe + scroll, en-tête sticky
- [x] **Export CSV + Excel** (`tableExport.ts`, dépendance `xlsx`) — exporte toutes les lignes filtrées
- [x] Types métier principaux : `User`, `Trip`, `Driver`, `Zone`, `Paginated<T>`, etc.
- [x] Helpers labels export : `tripLabels`, `driverLabels`, `vehicleLabels`

### 4.2 Portail Admin

| Route | Statut | Mock / notes |
|-------|--------|--------------|
| `/admin/dashboard` | ✅ | `dashboard-admin.json` |
| `/admin/ops/map` | ✅ | `live-map.json` |
| `/admin/ops/trips` | ✅ | `trips-list.json` |
| `/admin/ops/trips/[id]` | ✅ | `trip-detail.json` — timeline, route |
| `/admin/network/franchises` | ✅ | `franchises-list.json` |
| `/admin/network/franchises/[id]` | ✅ | `franchise-detail.json` |
| `/admin/network/zones` | ✅ | `zones-list.json` |
| `/admin/network/zones/[id]` | ✅ | `zone-detail.json` — polygone carte |
| `/admin/network/partners` | ✅ | `partners-list.json` |
| `/admin/network/partners/[id]` | ✅ | `partner-detail.json` |
| `/admin/fleet/drivers` | ✅ | `drivers-list.json` |
| `/admin/fleet/drivers/[id]` | ✅ | `driver-detail.json` — KYC approve/reject mock |
| `/admin/fleet/kyc` | ✅ | `kyc-queue.json` |
| `/admin/finance/transactions` | ✅ | `transactions.json` |
| `/admin/finance/withdrawals` | ✅ | `withdrawals.json` — approve/reject mock |

**Navigation admin actuelle** (`src/portals/admin/adminNav.ts`) : OPÉRATIONS · RÉSEAU · FLOTTE · FINANCE — **pas de section PARAMÈTRES**.

### 4.3 Portail Partenaire

| Route | Statut | Notes |
|-------|--------|-------|
| `/partner/dashboard` | ✅ | |
| `/partner/fleet` | ✅ | Liste véhicules |
| `/partner/fleet/pending` | ✅ | En attente validation |
| `/partner/fleet/new` | ✅ | Création véhicule + pièces jointes optionnelles + chauffeur optionnel + docs KYC |
| `/partner/fleet/[id]` | ✅ | Détail + upload carte grise |
| `/partner/drivers` | ✅ | |
| `/partner/drivers/pending` | ✅ | |
| `/partner/drivers/new` | ✅ | Création chauffeur standalone |
| `/partner/drivers/[id]` | ✅ | Détail + upload KYC |
| `/partner/bookings` | ✅ | Liste réservations |
| `/partner/bookings/new` | ✅ | Carte GPS départ + recherche/pin arrivée (`BookingLocationPicker`) |
| `/partner/bookings/[id]` | ✅ | Détail + timeline mock |
| `/partner/wallet` | ✅ | Bouton retrait **désactivé** |
| `/partner/profile` | ✅ | |

**Fichiers clés partenaire** :
- `PartnerVehicleCreatePage.tsx`, `VehicleCreatePiecesSection`, `VehicleCreateDriverSection`, `VehicleCreateDriverDocumentsSection`
- `PartnerBookingsNewPage.tsx`, `BookingLocationPicker.tsx`, `abidjanPlaces.ts`, `mapProjection.ts`
- `src/mocks/handlers/partner.handlers.ts`

**Sidebar** : correction double sélection « Réservations » / « Nouvelle réservation » (match exact par path).

### 4.4 Portail Franchise

| Route | Statut | Notes |
|-------|--------|-------|
| `/franchise/dashboard` | ✅ | |
| `/franchise/partners` | ✅ | Sous-partenaires |
| `/franchise/partners/[id]` | ✅ | |
| `/franchise/drivers` | ✅ | |
| `/franchise/drivers/moderation` | ✅ | Review UI — actions approve/reject partielles |
| `/franchise/drivers/[id]` | ✅ | |
| `/franchise/finance` | ✅ | |

Mocks : `auth-franchise.json`, `dashboard-franchise.json`, `sub-partners-franchise.json`, `drivers-list-franchise.json`, `finance-franchise.json`.

---

## 5. Ce qui reste à faire

### 5.1 P0 — Configuration dispatchers (NON COMMENCÉ)

**Écart majeur** : aucune route, page, type, mock ni handler MSW pour les dispatchers.

| Livrable | Statut |
|----------|--------|
| Types `DispatcherAccount`, `DispatchRules` | ❌ |
| Mocks `dispatchers-list.json`, `dispatch-rules.json` | ❌ |
| Handlers MSW `/api/v2/admin/dispatchers` | ❌ |
| Handlers MSW `/api/v2/admin/settings/dispatch-rules` | ❌ |
| Routes Next.js settings | ❌ |
| Nav admin section PARAMÈTRES | ❌ |
| Spec formulaires / validations | ❌ (voir § 6) |

#### Spec écrans P0

| Écran | Route | Champs / comportement |
|-------|-------|----------------------|
| **Liste dispatchers** | `/admin/settings/dispatchers` | Nom, email, téléphone, franchise/zone, statut (actif/suspendu), dernière connexion, actions (voir / éditer / suspendre) |
| **Fiche dispatcher** | `/admin/settings/dispatchers/new` · `/[id]` | Identité, credentials (création), zones autorisées (multi-select), horaires/shift, permissions dispatch, statut |
| **Règles de dispatch** | `/admin/settings/dispatch-rules` | Rayon matching (km), timeout assignation, priorité (proximité / rating / charge), zones actives, surge lié aux zones, file d’attente max |

**Validations** : email unique, au moins 1 zone, règles numériques > 0.

#### Structure React proposée

```text
src/features/settings/
├── api/
│   ├── dispatchers.service.ts
│   ├── dispatchers.queries.ts
│   ├── dispatchRules.service.ts
│   └── dispatchRules.queries.ts
├── pages/
│   ├── DispatchersListPage.tsx
│   ├── DispatcherDetailPage.tsx
│   └── DispatchRulesPage.tsx
└── components/
    ├── DispatcherForm.tsx
    └── DispatchRulesForm.tsx

src/app/(admin)/admin/settings/
├── dispatchers/page.tsx
├── dispatchers/new/page.tsx
├── dispatchers/[id]/page.tsx
└── dispatch-rules/page.tsx
```

#### Types TypeScript à créer

```typescript
interface DispatcherAccount {
  id: number;
  name: string;
  email: string;
  phone: string;
  franchise_id?: number;
  zone_ids: number[];
  status: "active" | "suspended";
  last_login_at?: string;
}

interface DispatchRules {
  match_radius_km: number;
  assign_timeout_sec: number;
  max_queue_size: number;
  priority_mode: "distance" | "rating" | "balanced";
  auto_reassign: boolean;
  updated_at: string;
}
```

#### Navigation admin à ajouter

```text
PARAMÈTRES
  ├── Dispatchers          → /admin/settings/dispatchers      (permission: settings.dispatchers.view)
  ├── Règles de dispatch   → /admin/settings/dispatch-rules   (permission: settings.dispatch_rules.view)
  └── (P1) Rôles, Tarifs…
```

#### Permissions RBAC suggérées

- `settings.dispatchers.view`
- `settings.dispatchers.create`
- `settings.dispatchers.edit`
- `settings.dispatch_rules.view`
- `settings.dispatch_rules.edit`

---

### 5.2 P1 — Admin restant

| Route | Statut | Notes |
|-------|--------|-------|
| `/admin/ops/dispatch` | ❌ | Console dispatch manuel — réutiliser courses + carte live |
| `/admin/settings/roles` | ❌ | Mock `roles.json` prévu dans kickstart |
| `/admin/settings/pricing` | ❌ | Mock `pricing.json` |
| `/admin/network/franchises/new` | ❌ | Bouton création **désactivé** sur liste |
| `/admin/network/zones/new` | ❌ | Bouton création **désactivé** |
| `/admin/network/partners/new` | ❌ | Non implémenté |
| `*/forgot-password` | ❌ | P1 kickstart |

**Partiellement fait** (UI sans action réelle) :
- Réassignation chauffeur sur détail course (`TripDetailPage`)
- Suspension chauffeur admin (`DriverDetailPage`)
- Demande retrait partenaire (`PartnerWalletPage`)

---

### 5.3 P2 — Backlog admin

| Domaine | Routes |
|---------|--------|
| Ops | `/admin/ops/trips/[id]/forensic`, `/admin/ops/crisis` |
| Finance | `/admin/finance/wallets`, `/admin/finance/commissions`, `/admin/finance/reconciliation` |
| Flotte | `/admin/fleet/clients`, `/admin/fleet/clients/[id]` |
| Support | `/admin/support/tickets`, `/admin/support/disputes/[id]` |
| Marketing | `/admin/marketing/promos`, `/admin/marketing/campaigns`, `/admin/marketing/banners` |
| Settings | `/admin/settings/integrations`, `/admin/settings/audit`, `/admin/settings/general` |

---

### 5.4 Portail Partenaire — reste

| Route | Priorité | Statut |
|-------|----------|--------|
| `/partner/shifts` | P2 | ❌ |
| `/partner/bookings/recurring` | P2 | ❌ |
| `/partner/reports` | P2 | ❌ |
| Retrait wallet (action) | P1 | UI seulement |
| Branchement API Laravel | — | MSW actif |

---

### 5.5 Portail Franchise — reste

| Route | Priorité | Statut |
|-------|----------|--------|
| `/franchise/territory` | P1 | ❌ Carte territoire |
| `/franchise/promos` | P2 | ❌ |
| `/franchise/support` | P2 | ❌ |
| `/franchise/territory/extension` | P2 | ❌ |
| Actions KYC approve/reject | P1 | Partiel |

---

### 5.6 Technique / dette

| Sujet | Statut |
|-------|--------|
| Branchement API Laravel réelle | MSW actif en dev |
| Pagination serveur DataTable | Pagination **client-side** actuellement |
| `useScope()` dans query keys | À vérifier / compléter |
| Rôle `dispatch` dans auth | Type existe, portail dispatch non implémenté |
| Build Next intermittent (`_document`) | `tsc --noEmit` OK |

---

## 6. Wireframes textuels P0 — Dispatchers

### 6.1 Liste dispatchers

```
┌─────────────────────────────────────────────────────────────┐
│  Dispatchers                              [+ Nouveau]       │
├─────────────────────────────────────────────────────────────┤
│  🔍 Rechercher…    [Zone ▼]  [Statut ▼]                     │
├─────────────────────────────────────────────────────────────┤
│  Nom          Email              Zones        Statut  Conn. │
│  ─────────────────────────────────────────────────────────  │
│  Aya Koné     aya@…              Cocody       ● Actif  2h   │
│  Jean Traoré  jean@…             Yopougon     ○ Suspendu —  │
├─────────────────────────────────────────────────────────────┤
│  Pagination · Export CSV / Excel                            │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Fiche dispatcher

```
┌─────────────────────────────────────────────────────────────┐
│  ← Retour    Dispatcher · Aya Koné              [Suspendre] │
├──────────────────────────┬──────────────────────────────────┤
│  Identité                │  Zones autorisées                │
│  Nom, email, téléphone   │  ☑ Cocody  ☑ Plateau  ☐ Yop.   │
│  Mot de passe (création) │                                  │
│                          │  Permissions                     │
│  Statut : Actif          │  ☑ Assigner courses              │
│  Franchise : Abidjan Sud │  ☑ Voir carte live               │
├──────────────────────────┴──────────────────────────────────┤
│                              [Annuler]  [Enregistrer]       │
└─────────────────────────────────────────────────────────────┘
```

### 6.3 Règles de dispatch

```
┌─────────────────────────────────────────────────────────────┐
│  Règles de dispatch                                         │
├─────────────────────────────────────────────────────────────┤
│  Rayon de matching        [ 3 ] km                          │
│  Timeout assignation      [ 45 ] sec                        │
│  Taille max file d’attente [ 12 ]                           │
│  Mode priorité            ( ) Distance  (•) Équilibré  ( ) Note │
│  Réassignation auto       [✓]                               │
├─────────────────────────────────────────────────────────────┤
│  Dernière modification : 12 mai 2026, 14:32                 │
│                              [Enregistrer]                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Fichiers clés pour la suite

```
src/shared/ui/DataTable.tsx
src/shared/lib/tableExport.ts
src/portals/admin/adminNav.ts          ← à étendre (PARAMÈTRES)
src/features/partner/pages/PartnerVehicleCreatePage.tsx
src/features/partner/components/BookingLocationPicker.tsx
src/features/partner/pages/PartnerBookingsListPage.tsx
src/features/partner/pages/PartnerBookingDetailPage.tsx
src/features/partner/api/vehicles.service.ts
src/mocks/handlers/partner.handlers.ts
src/mocks/handlers/franchise.handlers.ts
src/mocks/handlers/index.ts            ← enregistrer settings.handlers.ts
```

---

## 8. Ordre de travail recommandé

1. **P0 Dispatchers** — types + mocks JSON + handlers MSW + nav admin + pages liste/fiche/règles
2. **P1 `/admin/ops/dispatch`** — console dispatch manuel (courses + carte)
3. **P1 Rôles & tarifs** — compléter le groupe PARAMÈTRES
4. **Franchise P1** — carte territoire + modération KYC actions réelles
5. **Partenaire P2** — shifts, récurrentes, rapports
6. **Branchement API** — remplacer MSW progressivement

---

## 9. Synthèse

| Zone | Avancement |
|------|------------|
| Infrastructure | ✅ Solide |
| Admin ops / réseau / flotte / finance | ✅ MVP mock |
| Partenaire | ✅ Quasi complet P0/P1 |
| Franchise | ✅ Socle P0/P1 |
| **Admin settings / dispatchers** | ❌ **Trou P0 — prochain chantier** |
| Admin ops dispatch manuel | ❌ P1 |
| P2 (audit, marketing, intégrations…) | ❌ Backlog |

**En une phrase** : le cœur opérationnel Admin + l’essentiel Partenaire/Franchise sont en place en mock avec une UX cohérente UpJunoo ; la **configuration dispatcher** (comptes + règles) est le gros manque P0 avant la console dispatch ops.
