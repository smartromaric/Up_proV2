```
{
  "openapi": "3.0.3",
  "info": {
    "title": "UPJUNOO API",
    "version": "0.3.0",
    "description": "## Environnements\n\n| Env | Base URL |\n|-----|----------|\n| **Dev (server1)** | `https://api.upjunoo-dev.tech` |\n| Local | `http://localhost:8080` |\n\n**Supabase** (apps mobile) :\n\n- URL : `https://wfajmgpahlpcmoxopwze.supabase.co`\n- Clé **anon** : voir `GET /v1/dev/sandbox` (dev) ou dashboard Supabase\n- Backend JWT : `POST /v1/auth/login` → `access_token` → **Authorize**\n\n---\n\n## Comptes test DEV (server1)\n\nMot de passe commun : `Upjunoo@Dev2026!`\n\n| Rôle | Email |\n|------|-------|\n| Client | `dev.client@upjunoo-dev.tech` |\n| Chauffeur | `dev.driver@upjunoo-dev.tech` |\n| Admin | `dev.admin@upjunoo-dev.tech` |\n\nConfig complète : `GET /v1/dev/sandbox` (anon key + cityId Abidjan)\n\n---\n\n## Erreur 401 `AUTH_REQUIRED` — quoi envoyer ?\n\nMessage `Missing bearer token` = route protégée sans JWT.\n\n1. **POST /v1/auth/login** (body ci-dessous, sans cadenas)\n2. Copier `session.access_token` dans la réponse (`eyJ...`)\n3. **Authorize** (cadenas) → coller le token **sans** écrire `Bearer`\n4. Retester la route\n\n```json\n{ \"email\": \"votre-email@example.com\", \"password\": \"votre-mot-de-passe\" }\n```\n\n| Code | Correction |\n|------|------------|\n| `AUTH_REQUIRED` | Login + Authorize |\n| `AUTH_INVALID` | POST /v1/auth/refresh ou re-login |\n| `ADMIN_REQUIRED` | Compte admin requis |\n\n---\n\n## CRUD — ressources principales\n\n### Courses VTC\n| Action | Méthode | Endpoint |\n|--------|---------|----------|\n| Estimer | POST | `/v1/rides/estimate` |\n| Créer | POST | `/v1/rides` |\n| Lister | GET | `/v1/rides` |\n| Détail | GET | `/v1/rides/:id` |\n| Annuler | POST | `/v1/rides/:id/cancel` |\n\n### Dispatch · Profil · Admin\nVoir sections **05 - Dispatch**, **03 - Profil**, **10 - Admin** (GET=liste/lire, POST=créer/action, PATCH=màj).\n\nCatalogue public : **01 - Démarrage** (`/v1/catalog/bootstrap`).\n\nModules **99** : souvent **501 not_implemented**.\n\n---\n\n## Première inscription — Client (app passager)\n\n**Aucun JWT requis** pour les étapes 1–2.\n\n1. `GET /v1/catalog/bootstrap` — récupérer `cityId`, catégories véhicule\n\n2. `POST /v1/auth/register` — body exemple :\n\n```json\n{\n  \"email\": \"client@example.com\",\n  \"password\": \"MotDePasse123!\",\n  \"firstName\": \"Aya\",\n  \"lastName\": \"Koné\",\n  \"phone\": \"+2250700000000\",\n  \"userType\": \"CLIENT\",\n  \"cityId\": \"uuid-ville-depuis-bootstrap\"\n}\n```\n\n3. Réponse : `session.access_token` **déjà inclus** → **Authorize** (JWT seul, sans `Bearer`)\n\n4. `PATCH /v1/me/profile` — compléter le profil (optionnel)\n\n5. `POST /v1/rides/estimate` puis `POST /v1/rides` — première course\n\n---\n\n## Première inscription — Chauffeur (app driver)\n\nListes en cascade (public, sans JWT) :\n\n1. `GET /v1/catalog/countries` — `flag_url`, `dial_code`\n2. `GET /v1/catalog/countries/CI/cities?q=` — **code pays**, pas UUID\n3. `GET /v1/catalog/countries/CI/cities/abidjan` — slug ville\n4. `GET /v1/catalog/vehicle-brands?q=` — `logo_url`\n5. `GET /v1/catalog/vehicle-brands/TOYOTA/models?q=`\n6. `GET /v1/catalog/vehicle-colors/BLANC` — `hex`\n7. `GET /v1/catalog/partners?countryCode=CI&citySlug=abidjan`\n\nAuth puis fiche chauffeur :\n\n7. `POST /v1/auth/otp/send` + `POST /v1/auth/otp/verify` (ou `POST /v1/dev/login` role driver en sandbox)\n8. `POST /v1/drivers/onboarding/start` — `{ cityId, rideCategoryCode: \"ECO\" }`\n9. `PATCH /v1/drivers/me` — `{ cityId, franchiseId, partnerId }`\n10. `POST /v1/vehicles` — `{ brandCode, modelId, colorCode, categoryCode, plateNumber }` (codes + UUID modèle)\n11. `POST /v1/kyc/my-documents` — types depuis `GET /v1/catalog/document-types?subject=DRIVER`\n12. `PATCH /v1/drivers/me/status` — online + GPS / dispatch\n\nAlternative tout-en-un : `GET /v1/catalog/bootstrap` (cache Redis, inclut aussi `logo_url` / `flag_url`).\n\n---\n\n## Pagination (listes)\n\nQuery sur les GET liste :\n\n| Param | Défaut | Max |\n|-------|--------|-----|\n| `page` | 1 | — |\n| `limit` | 20 | 100 |\n\nRéponse :\n\n```json\n{\n  \"status\": \"ok\",\n  \"rides\": [ \"...\" ],\n  \"pagination\": { \"page\": 1, \"limit\": 20, \"total\": 142, \"hasMore\": true }\n}\n```\n\n**Endpoints paginés** : `GET /v1/rides`, `/v1/deliveries`, `/v1/orders`, `/v1/notifications`, `/v1/drivers/me/orders`\n\n---\n\n## Démarrage rapide (Swagger)\n\n1. `GET /health` — l’API répond\n\n2. `GET /ready` — Postgres + Redis OK\n\n3. `GET /v1/catalog/bootstrap` — pays, villes, services\n\n4. `POST /v1/auth/register` **ou** `POST /v1/auth/login`\n\n5. Copier `session.access_token` → **Authorize** (sans écrire `Bearer`)\n\n6. Tester les routes métier (cadenas vert = OK)\n\n---\n\n## Workflow Client · course VTC\n\n```\nestimate → create ride → dispatch (auto ou start) → poll status → ride lifecycle\n```\n\n| Étape | Endpoint | Rôle |\n|-------|----------|------|\n| 1 | `POST /v1/rides/estimate` | Prix / ETA avant commande |\n| 2 | `POST /v1/rides` | Créer la course (`status: requested`) |\n| 3 | `POST /v1/dispatch/rides/:rideId/start` | Lancer le dispatch si non auto |\n| 4 | `GET /v1/dispatch/RIDE/:orderId/status` | Vague, rayon, offre en cours |\n| 5 | `GET /v1/dispatch/RIDE/:orderId/logs` | Audit dispatch (debug) |\n| 6 | `POST /v1/rides/:id/cancel` | Annulation client |\n\n**Catégories chauffeur** (règle dispatch RIDE) : ECO reçoit ECO ; CONFORT reçoit CONFORT+ECO ; CONFORT+ reçoit CONFORT+/CONFORT/ECO ; PREMIUM reçoit PREMIUM+CONFORT+ uniquement.\n\n---\n\n## Workflow Chauffeur\n\n```\nlogin → GPS loop → socket join → offer received → accept/reject → ride transitions\n```\n\n| Étape | Endpoint | Rôle |\n|-------|----------|------|\n| 1 | `POST /v1/locations/driver` | Envoyer position (haute fréquence) |\n| 2 | **WebSocket** `join { driverUserId }` | Room `driver:{userId}` |\n| 3 | *(push)* `dispatch:offer` | Nouvelle offre (TTL ~120 s) |\n| 4 | `POST /v1/dispatch/offers/:id/received` | Accusé réception |\n| 5 | `POST /v1/dispatch/offers/:id/accept` | Accepter |\n| 6 | `POST /v1/rides/:id/arrived` … `complete` | Étapes course |\n\n---\n\n## WebSocket (Socket.IO)\n\n- **URL** : `wss://api.upjunoo-dev.tech` (même host que l’API)\n- **Connexion** : Socket.IO client v4\n- **Join** : émettre `join` avec `{ driverUserId }` ou `{ orderId }`\n\n| Event | Direction | Description |\n|-------|-----------|-------------|\n| `connected` | serveur → client | Handshake OK |\n| `dispatch:offer` | serveur → chauffeur | Nouvelle offre dispatch |\n| `dispatch:update` | serveur → commande | Changement statut dispatch |\n| `dispatch:offer_cancelled` | serveur → chauffeur | Offre expirée / annulée |\n| `driver:location_updated` | serveur → admin/map | Position chauffeur |\n\n---\n\n## Workflow Admin · config dispatch\n\n| Étape | Endpoint |\n|-------|----------|\n| Lire config CI | `GET /v1/admin/dispatch-config?countryCode=CI` |\n| Modifier globale | `PUT /v1/admin/dispatch-config` |\n| Override pays | `PATCH /v1/admin/dispatch-config/countries/:code` |\n\nSchéma `schemaVersion: 2` : `global` + `countries.{CI,SN,BF,ML}`. Trafic zone : `strategies.traffic.zoneProfiles`.\n\n---\n\n## Format des réponses\n\nSuccès : `{ \"data\": ... }` ou payload direct (catalog).  \nErreur : `{ \"error\": { \"code\", \"message\", \"details?\" } }`.  \nStub : `501` + `not_implemented` (route listée, moteur pas encore branché).",
    "contact": {
      "name": "UPJUNOO Backend",
      "url": "https://api.upjunoo-dev.tech"
    }
  },
  "components": {
    "securitySchemes": {
      "bearerAuth": {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "JWT",
        "description": "JWT utilisateur (`accessToken` de POST /v1/dev/login ou `session.access_token` de POST /v1/auth/login). **Ne pas** coller supabaseAnonKey. Sur /docs : boutons « Connexion dev » en haut de page."
      }
    },
    "responses": {
      "Unauthorized": {
        "description": "Token JWT absent ou invalide. Faire POST /v1/auth/login puis Authorize avec access_token.",
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {
                "error": {
                  "type": "object",
                  "properties": {
                    "code": {
                      "type": "string",
                      "example": "AUTH_REQUIRED"
                    },
                    "message": {
                      "type": "string",
                      "example": "Missing bearer token"
                    }
                  }
                }
              }
            }
          }
        }
      },
      "Forbidden": {
        "description": "Rôle insuffisant (ex. ADMIN_REQUIRED).",
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {
                "error": {
                  "type": "object",
                  "properties": {
                    "code": {
                      "type": "string",
                      "example": "ADMIN_REQUIRED"
                    },
                    "message": {
                      "type": "string"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "schemas": {
      "ErrorResponse": {
        "type": "object",
        "properties": {
          "error": {
            "type": "object",
            "properties": {
              "code": {
                "type": "string",
                "example": "AUTH_REQUIRED"
              },
              "message": {
                "type": "string"
              },
              "details": {
                "type": "object",
                "additionalProperties": true
              }
            },
            "required": [
              "code",
              "message"
            ]
          }
        }
      },
      "NotImplementedResponse": {
        "type": "object",
        "properties": {
          "error": {
            "type": "object",
            "properties": {
              "code": {
                "type": "string",
                "example": "NOT_IMPLEMENTED"
              },
              "message": {
                "type": "string"
              },
              "module": {
                "type": "string"
              },
              "action": {
                "type": "string"
              }
            }
          }
        }
      },
      "PaginationMeta": {
        "type": "object",
        "properties": {
          "page": {
            "type": "integer",
            "example": 1
          },
          "limit": {
            "type": "integer",
            "example": 20
          },
          "total": {
            "type": "integer",
            "example": 142
          },
          "hasMore": {
            "type": "boolean",
            "example": true
          }
        }
      }
    }
  },
  "paths": {
    "/": {
      "get": {
        "summary": "Accueil API — liens utiles",
        "tags": [
          "00 - Système"
        ],
        "description": "Point d’entrée JSON avec liens vers `/docs`, `/health`, `/v1`.",
        "security": [],
        "responses": {
          "200": {
            "description": "Default Response"
          }
        }
      }
    },
    "/health": {
      "get": {
        "summary": "Ping API",
        "tags": [
          "00 - Système"
        ],
        "description": "Vérifie que le process Node répond (sans test Postgres).",
        "security": [],
        "responses": {
          "200": {
            "description": "Default Response"
          }
        }
      }
    },
    "/ready": {
      "get": {
        "summary": "Readiness Postgres + Redis",
        "tags": [
          "00 - Système"
        ],
        "description": "Utilisé par le déploiement et le monitoring.",
        "security": [],
        "responses": {
          "200": {
            "description": "Default Response"
          }
        }
      }
    },
    "/v1/catalog/bootstrap": {
      "get": {
        "summary": "Bootstrap app (catalogue complet)",
        "tags": [
          "01 - Démarrage"
        ],
        "description": "**Premier appel recommandé.** Retourne pays, villes, services, véhicules, zones, tarifs. Cache Redis ~60 s.",
        "security": [],
        "responses": {
          "200": {
            "description": "Default Response"
          }
        }
      }
    },
    "/v1/catalog/services": {
      "get": {
        "summary": "Types de service et disponibilité par ville",
        "tags": [
          "01 - Démarrage"
        ],
        "security": [],
        "responses": {
          "200": {
            "description": "Default Response"
          }
        }
      }
    },
    "/v1/catalog/vehicles": {
      "get": {
        "summary": "Catalogue véhicules par catégorie",
        "tags": [
          "01 - Démarrage"
        ],
        "security": [],
        "responses": {
          "200": {
            "description": "Default Response"
          }
        }
      }
    },
    "/v1/catalog/geo": {
      "get": {
        "summary": "Géo : pays, villes, zones, péages",
        "tags": [
          "01 - Démarrage"
        ],
        "security": [],
        "responses": {
          "200": {
            "description": "Default Response"
          }
        }
      }
    },
    "/v1/catalog/pricing": {
      "get": {
        "summary": "Règles tarifaires et commissions",
        "tags": [
          "01 - Démarrage"
        ],
        "security": [],
        "responses": {
          "200": {
            "description": "Default Response"
          }
        }
      }
    },
    "/v1/catalog/countries": {
      "get": {
        "summary": "Liste des pays (drapeau, indicatif)",
        "tags": [
          "01 - Démarrage"
        ],
        "description": "Chaque pays inclut `flag_url`, `dial_code`, `code` (CI, SN…).",
        "security": [],
        "responses": {
          "200": {
            "description": "Default Response"
          }
        }
      }
    },
    "/v1/catalog/cities": {
      "get": {
        "summary": "Villes par code pays",
        "tags": [
          "01 - Démarrage"
        ],
        "description": "Query `?countryCode=CI&q=abi` — **pas d’UUID**.",
        "security": [],
        "responses": {
          "200": {
            "description": "Default Response"
          }
        }
      }
    },
    "/v1/catalog/countries/{countryCode}": {
      "get": {
        "summary": "Détail pays (code)",
        "tags": [
          "01 - Démarrage"
        ],
        "description": "Ex. `/countries/CI` — `flag_url`, `dial_code`.",
        "security": [],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "countryCode",
            "required": true
          }
        ],
        "responses": {
          "200": {
            "description": "Default Response"
          }
        }
      }
    },
    "/v1/catalog/countries/{countryCode}/cities": {
      "get": {
        "summary": "Villes d’un pays (code)",
        "tags": [
          "01 - Démarrage"
        ],
        "description": "Ex. `/countries/CI/cities?q=abi` — `countryCode` = CI, SN… (UUID accepté en secours).",
        "security": [],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "countryCode",
            "required": true
          }
        ],
        "responses": {
          "200": {
            "description": "Default Response"
          }
        }
      }
    },
    "/v1/catalog/countries/{countryCode}/cities/{citySlug}": {
      "get": {
        "summary": "Détail ville (slug)",
        "tags": [
          "01 - Démarrage"
        ],
        "description": "Ex. `/countries/CI/cities/abidjan`",
        "security": [],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "countryCode",
            "required": true
          },
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "citySlug",
            "required": true
          }
        ],
        "responses": {
          "200": {
            "description": "Default Response"
          }
        }
      }
    },
    "/v1/catalog/vehicle-brands": {
      "get": {
        "summary": "Marques véhicule avec logo",
        "tags": [
          "01 - Démarrage"
        ],
        "description": "Chaque marque : `code`, `logo_url`. Query `?q=toy`.",
        "security": [],
        "responses": {
          "200": {
            "description": "Default Response"
          }
        }
      }
    },
    "/v1/catalog/vehicle-brands/{brandCode}": {
      "get": {
        "summary": "Détail marque (code)",
        "tags": [
          "01 - Démarrage"
        ],
        "description": "Ex. `/vehicle-brands/TOYOTA` + `logo_url`.",
        "security": [],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "brandCode",
            "required": true
          }
        ],
        "responses": {
          "200": {
            "description": "Default Response"
          }
        }
      }
    },
    "/v1/catalog/vehicle-brands/{brandCode}/models": {
      "get": {
        "summary": "Modèles d’une marque (code)",
        "tags": [
          "01 - Démarrage"
        ],
        "description": "Ex. `/vehicle-brands/TOYOTA/models?q=yaris`",
        "security": [],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "brandCode",
            "required": true
          }
        ],
        "responses": {
          "200": {
            "description": "Default Response"
          }
        }
      }
    },
    "/v1/catalog/vehicle-brands/{brandCode}/models/{modelRef}": {
      "get": {
        "summary": "Détail modèle",
        "tags": [
          "01 - Démarrage"
        ],
        "description": "Ex. `/vehicle-brands/TOYOTA/models/Yaris`",
        "security": [],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "brandCode",
            "required": true
          },
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "modelRef",
            "required": true
          }
        ],
        "responses": {
          "200": {
            "description": "Default Response"
          }
        }
      }
    },
    "/v1/catalog/vehicle-models": {
      "get": {
        "summary": "Modèles par marque (alias)",
        "tags": [
          "01 - Démarrage"
        ],
        "description": "Query `?brandCode=TOYOTA` (ou brandId UUID).",
        "security": [],
        "responses": {
          "200": {
            "description": "Default Response"
          }
        }
      }
    },
    "/v1/catalog/vehicle-colors": {
      "get": {
        "summary": "Couleurs véhicule",
        "tags": [
          "01 - Démarrage"
        ],
        "description": "`code`, `label`, `hex` (pastille UI).",
        "security": [],
        "responses": {
          "200": {
            "description": "Default Response"
          }
        }
      }
    },
    "/v1/catalog/vehicle-colors/{colorCode}": {
      "get": {
        "summary": "Détail couleur",
        "tags": [
          "01 - Démarrage"
        ],
        "description": "Ex. `/vehicle-colors/BLANC` ou `/vehicle-colors/%23FFFFFF`",
        "security": [],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "colorCode",
            "required": true
          }
        ],
        "responses": {
          "200": {
            "description": "Default Response"
          }
        }
      }
    },
    "/v1/catalog/vehicle-categories": {
      "get": {
        "summary": "Catégories véhicule",
        "tags": [
          "01 - Démarrage"
        ],
        "description": "Query `?service=RIDE` — codes ECO, CONFORT…",
        "security": [],
        "responses": {
          "200": {
            "description": "Default Response"
          }
        }
      }
    },
    "/v1/catalog/vehicle-categories/{categoryCode}": {
      "get": {
        "summary": "Détail catégorie véhicule",
        "tags": [
          "01 - Démarrage"
        ],
        "description": "Ex. `/vehicle-categories/ECO`",
        "security": [],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "categoryCode",
            "required": true
          }
        ],
        "responses": {
          "200": {
            "description": "Default Response"
          }
        }
      }
    },
    "/v1/catalog/ride-categories": {
      "get": {
        "summary": "Catégories course VTC",
        "tags": [
          "01 - Démarrage"
        ],
        "security": [],
        "responses": {
          "200": {
            "description": "Default Response"
          }
        }
      }
    },
    "/v1/catalog/ride-options": {
      "get": {
        "summary": "Options course",
        "tags": [
          "01 - Démarrage"
        ],
        "description": "Query `?categoryCode=ECO`",
        "security": [],
        "responses": {
          "200": {
            "description": "Default Response"
          }
        }
      }
    },
    "/v1/catalog/service-types": {
      "get": {
        "summary": "Types de service (tuiles app)",
        "tags": [
          "01 - Démarrage"
        ],
        "security": [],
        "responses": {
          "200": {
            "description": "Default Response"
          }
        }
      }
    },
    "/v1/catalog/service-classes": {
      "get": {
        "summary": "Classes de service",
        "tags": [
          "01 - Démarrage"
        ],
        "description": "Query `?serviceType=RIDE`",
        "security": [],
        "responses": {
          "200": {
            "description": "Default Response"
          }
        }
      }
    },
    "/v1/catalog/document-types": {
      "get": {
        "summary": "Types de documents KYC",
        "tags": [
          "01 - Démarrage"
        ],
        "description": "Query `?subject=DRIVER`",
        "security": [],
        "responses": {
          "200": {
            "description": "Default Response"
          }
        }
      }
    },
    "/v1/catalog/languages": {
      "get": {
        "summary": "Langues app",
        "tags": [
          "01 - Démarrage"
        ],
        "security": [],
        "responses": {
          "200": {
            "description": "Default Response"
          }
        }
      }
    },
    "/v1/catalog/navigation-apps": {
      "get": {
        "summary": "Apps navigation",
        "tags": [
          "01 - Démarrage"
        ],
        "security": [],
        "responses": {
          "200": {
            "description": "Default Response"
          }
        }
      }
    },
    "/v1/catalog/payment-methods": {
      "get": {
        "summary": "Moyens de paiement",
        "tags": [
          "01 - Démarrage"
        ],
        "security": [],
        "responses": {
          "200": {
            "description": "Default Response"
          }
        }
      }
    },
    "/v1/catalog/partners": {
      "get": {
        "summary": "Partenaires / flottes onboarding",
        "tags": [
          "01 - Démarrage"
        ],
        "description": "Query `?countryCode=CI&citySlug=abidjan&status=active` (ou cityId UUID).",
        "security": [],
        "responses": {
          "200": {
            "description": "Default Response"
          }
        }
      }
    },
    "/v1/catalog/cache/refresh": {
      "post": {
        "summary": "Rafraîchir le cache catalogue (admin)",
        "tags": [
          "10 - Admin"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Default Response"
          }
        }
      }
    },
    "/v1/dev/sandbox": {
      "get": {
        "summary": "Config dev — anon key, comptes test, cityId",
        "tags": [
          "01 - Démarrage"
        ],
        "description": "Actif uniquement si `ENABLE_DEV_SANDBOX=true` (api.upjunoo-dev.tech).",
        "security": [],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/dev/login": {
      "post": {
        "summary": "Login dev — JWT pour Swagger (admin / client / driver)",
        "tags": [
          "01 - Démarrage"
        ],
        "description": "Body `{ \"role\": \"admin\" }` → retourne `accessToken`. Copier dans **Authorize** (cadenas) sans écrire `Bearer`. La clé anon Supabase ne remplace pas ce JWT pour les routes `/v1/admin/`*.",
        "security": [],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/auth/client/register": {
      "post": {
        "summary": "Inscription par rôle (client, driver, partner, franchise, admin)",
        "tags": [
          "02 - Auth"
        ],
        "description": "Crée Auth Supabase + profil + bootstrap métier (driver/partner/franchise). Admin : `inviteCode` ou `devBypass` (sandbox).",
        "security": [],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/auth/client/login": {
      "post": {
        "summary": "Connexion email/mot de passe par rôle",
        "tags": [
          "02 - Auth"
        ],
        "description": "Vérifie `profiles.user_type`. Retourne session JWT + contexte (driver, partner, franchise).",
        "security": [],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/auth/driver/register": {
      "post": {
        "summary": "Inscription par rôle (client, driver, partner, franchise, admin)",
        "tags": [
          "02 - Auth"
        ],
        "description": "Crée Auth Supabase + profil + bootstrap métier (driver/partner/franchise). Admin : `inviteCode` ou `devBypass` (sandbox).",
        "security": [],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/auth/driver/login": {
      "post": {
        "summary": "Connexion email/mot de passe par rôle",
        "tags": [
          "02 - Auth"
        ],
        "description": "Vérifie `profiles.user_type`. Retourne session JWT + contexte (driver, partner, franchise).",
        "security": [],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/auth/partner/register": {
      "post": {
        "summary": "Inscription par rôle (client, driver, partner, franchise, admin)",
        "tags": [
          "02 - Auth"
        ],
        "description": "Crée Auth Supabase + profil + bootstrap métier (driver/partner/franchise). Admin : `inviteCode` ou `devBypass` (sandbox).",
        "security": [],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/auth/partner/login": {
      "post": {
        "summary": "Connexion email/mot de passe par rôle",
        "tags": [
          "02 - Auth"
        ],
        "description": "Vérifie `profiles.user_type`. Retourne session JWT + contexte (driver, partner, franchise).",
        "security": [],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/auth/franchise/register": {
      "post": {
        "summary": "Inscription par rôle (client, driver, partner, franchise, admin)",
        "tags": [
          "02 - Auth"
        ],
        "description": "Crée Auth Supabase + profil + bootstrap métier (driver/partner/franchise). Admin : `inviteCode` ou `devBypass` (sandbox).",
        "security": [],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/auth/franchise/login": {
      "post": {
        "summary": "Connexion email/mot de passe par rôle",
        "tags": [
          "02 - Auth"
        ],
        "description": "Vérifie `profiles.user_type`. Retourne session JWT + contexte (driver, partner, franchise).",
        "security": [],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/auth/admin/register": {
      "post": {
        "summary": "Inscription par rôle (client, driver, partner, franchise, admin)",
        "tags": [
          "02 - Auth"
        ],
        "description": "Crée Auth Supabase + profil + bootstrap métier (driver/partner/franchise). Admin : `inviteCode` ou `devBypass` (sandbox).",
        "security": [],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/auth/admin/login": {
      "post": {
        "summary": "Connexion email/mot de passe par rôle",
        "tags": [
          "02 - Auth"
        ],
        "description": "Vérifie `profiles.user_type`. Retourne session JWT + contexte (driver, partner, franchise).",
        "security": [],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/auth/driver/phone": {
      "post": {
        "summary": "OTP chauffeur SMS Supabase",
        "tags": [
          "02 - Auth"
        ],
        "description": "Pas de WhatsApp tiers. `verify-otp` crée profil DRIVER + onboarding si nouveau.",
        "security": [],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/auth/driver/verify-otp": {
      "post": {
        "summary": "OTP chauffeur SMS Supabase",
        "tags": [
          "02 - Auth"
        ],
        "description": "Pas de WhatsApp tiers. `verify-otp` crée profil DRIVER + onboarding si nouveau.",
        "security": [],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/auth/driver/resend-otp": {
      "post": {
        "summary": "OTP chauffeur SMS Supabase",
        "tags": [
          "02 - Auth"
        ],
        "description": "Pas de WhatsApp tiers. `verify-otp` crée profil DRIVER + onboarding si nouveau.",
        "security": [],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/auth/register": {
      "post": {
        "summary": "Inscription (alias — userType dans le body)",
        "tags": [
          "02 - Auth"
        ],
        "description": "Alias de `/auth/client/register`. `userType`: CLIENT, DRIVER, PARTNER_USER, FRANCHISE_USER, ADMIN.",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "email",
                  "password"
                ],
                "properties": {
                  "email": {
                    "type": "string",
                    "format": "email",
                    "example": "client@upjunoo.test"
                  },
                  "password": {
                    "type": "string",
                    "minLength": 8,
                    "example": "MotDePasse123!"
                  },
                  "phone": {
                    "type": "string",
                    "example": "+2250700000000"
                  },
                  "firstName": {
                    "type": "string",
                    "example": "Aya"
                  },
                  "lastName": {
                    "type": "string",
                    "example": "Koné"
                  },
                  "userType": {
                    "type": "string",
                    "enum": [
                      "CLIENT",
                      "DRIVER",
                      "PARTNER"
                    ],
                    "default": "CLIENT",
                    "description": "CLIENT = passager · DRIVER = chauffeur"
                  },
                  "accountType": {
                    "type": "string",
                    "enum": [
                      "INDIVIDUAL",
                      "BUSINESS"
                    ],
                    "default": "INDIVIDUAL"
                  },
                  "cityId": {
                    "type": "string",
                    "format": "uuid",
                    "description": "UUID ville depuis /v1/catalog/bootstrap"
                  },
                  "ageConfirmed": {
                    "type": "boolean",
                    "example": true
                  }
                },
                "example": {
                  "email": "driver@upjunoo.test",
                  "password": "MotDePasse123!",
                  "firstName": "Kofi",
                  "lastName": "Diabaté",
                  "phone": "+2250700000000",
                  "userType": "DRIVER",
                  "cityId": "00000000-0000-0000-0000-000000000000"
                }
              }
            }
          }
        },
        "security": [],
        "responses": {
          "201": {
            "description": "Compte créé + session JWT (auto-login). Copier access_token → Authorize.",
            "content": {
              "application/json": {
                "schema": {
                  "description": "Compte créé + session JWT (auto-login). Copier access_token → Authorize.",
                  "content": {
                    "application/json": {
                      "example": {
                        "status": "created",
                        "session": {
                          "access_token": "eyJ...",
                          "refresh_token": "xxx"
                        },
                        "nextSteps": [
                          "POST /v1/drivers/onboarding/start"
                        ]
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/v1/auth/login": {
      "post": {
        "summary": "Login (alias — role optionnel dans body)",
        "tags": [
          "02 - Auth"
        ],
        "description": "Alias générique. Préférer `/auth/{role}/login`. Retourne `session.access_token` pour Swagger Authorize.",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "email",
                  "password"
                ],
                "properties": {
                  "email": {
                    "type": "string",
                    "format": "email",
                    "example": "client@upjunoo.test"
                  },
                  "password": {
                    "type": "string",
                    "format": "password",
                    "example": "MotDePasse123!"
                  }
                }
              }
            }
          }
        },
        "security": [],
        "responses": {
          "200": {
            "description": "Session Supabase — copier `session.access_token` dans **Authorize**.",
            "content": {
              "application/json": {
                "schema": {
                  "description": "Session Supabase — copier `session.access_token` dans **Authorize**.",
                  "content": {
                    "application/json": {
                      "example": {
                        "status": "ok",
                        "generatedAt": "2026-06-03T20:00:00.000Z",
                        "session": {
                          "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                          "refresh_token": "xxx",
                          "expires_in": 3600,
                          "token_type": "bearer"
                        },
                        "user": {
                          "id": "uuid",
                          "email": "client@upjunoo.test"
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Identifiants incorrects",
            "content": {
              "application/json": {
                "schema": {
                  "description": "Identifiants incorrects",
                  "content": {
                    "application/json": {
                      "example": {
                        "error": {
                          "code": "AUTH_LOGIN_FAILED",
                          "message": "Invalid login credentials"
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/v1/auth/otp/send": {
      "post": {
        "summary": "Envoyer OTP email ou SMS",
        "tags": [
          "02 - Auth"
        ],
        "security": [],
        "responses": {
          "200": {
            "description": "Default Response"
          }
        }
      }
    },
    "/v1/auth/otp/verify": {
      "post": {
        "summary": "Vérifier OTP et obtenir session",
        "tags": [
          "02 - Auth"
        ],
        "security": [],
        "responses": {
          "200": {
            "description": "Default Response"
          }
        }
      }
    },
    "/v1/auth/logout": {
      "post": {
        "summary": "Déconnexion session courante",
        "tags": [
          "02 - Auth"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/auth/refresh": {
      "post": {
        "summary": "Renouveler access_token",
        "tags": [
          "02 - Auth"
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "refresh_token"
                ],
                "properties": {
                  "refresh_token": {
                    "type": "string",
                    "description": "Valeur `session.refresh_token` du login"
                  }
                }
              }
            }
          }
        },
        "security": [],
        "responses": {
          "200": {
            "description": "Default Response"
          }
        }
      }
    },
    "/v1/auth/logout-all": {
      "post": {
        "summary": "POST Auth — auth · logout-all",
        "tags": [
          "02 - Auth"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/auth/password/forgot": {
      "post": {
        "summary": "POST Auth — auth · password · forgot",
        "tags": [
          "02 - Auth"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [],
        "responses": {
          "200": {
            "description": "Default Response"
          }
        }
      }
    },
    "/v1/auth/password/reset": {
      "post": {
        "summary": "POST Auth — auth · password · reset",
        "tags": [
          "02 - Auth"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [],
        "responses": {
          "200": {
            "description": "Default Response"
          }
        }
      }
    },
    "/v1/auth/password/change": {
      "post": {
        "summary": "POST Auth — auth · password · change",
        "tags": [
          "02 - Auth"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/auth/verify-email": {
      "post": {
        "summary": "POST Auth — auth · verify-email",
        "tags": [
          "02 - Auth"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [],
        "responses": {
          "200": {
            "description": "Default Response"
          }
        }
      }
    },
    "/v1/auth/verify-phone": {
      "post": {
        "summary": "POST Auth — auth · verify-phone",
        "tags": [
          "02 - Auth"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [],
        "responses": {
          "200": {
            "description": "Default Response"
          }
        }
      }
    },
    "/v1/auth/account": {
      "delete": {
        "summary": "DELETE Auth — auth · account",
        "tags": [
          "02 - Auth"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/auth/me": {
      "get": {
        "summary": "Utilisateur + profil courant",
        "tags": [
          "02 - Auth"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/auth/passkeys": {
      "post": {
        "summary": "POST Auth — auth · passkeys",
        "tags": [
          "02 - Auth"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/auth/passkeys/{id}": {
      "delete": {
        "summary": "DELETE Auth — auth · passkeys · :id",
        "tags": [
          "02 - Auth"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/me/profile": {
      "get": {
        "summary": "GET Profil — me · profile",
        "tags": [
          "03 - Profil"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      },
      "patch": {
        "summary": "PATCH Profil — me · profile",
        "tags": [
          "03 - Profil"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "firstName": {
                    "type": "string"
                  },
                  "lastName": {
                    "type": "string"
                  },
                  "displayName": {
                    "type": "string"
                  },
                  "cityId": {
                    "type": "string",
                    "format": "uuid"
                  }
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/me/preferences": {
      "get": {
        "summary": "GET Profil — me · preferences",
        "tags": [
          "03 - Profil"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      },
      "patch": {
        "summary": "PATCH Profil — me · preferences",
        "tags": [
          "03 - Profil"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/me/devices": {
      "get": {
        "summary": "GET Profil — me · devices",
        "tags": [
          "03 - Profil"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      },
      "post": {
        "summary": "POST Profil — me · devices",
        "tags": [
          "03 - Profil"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/me/device-tokens": {
      "post": {
        "summary": "POST Profil — me · device-tokens",
        "tags": [
          "03 - Profil"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/me/consents": {
      "post": {
        "summary": "POST Profil — me · consents",
        "tags": [
          "03 - Profil"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/me/addresses": {
      "get": {
        "summary": "GET Profil — me · addresses",
        "tags": [
          "03 - Profil"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      },
      "post": {
        "summary": "POST Profil — me · addresses",
        "tags": [
          "03 - Profil"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/me/addresses/{id}": {
      "patch": {
        "summary": "PATCH Profil — me · addresses · :id",
        "tags": [
          "03 - Profil"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      },
      "delete": {
        "summary": "DELETE Profil — me · addresses · :id",
        "tags": [
          "03 - Profil"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/me/recent-places": {
      "get": {
        "summary": "GET Profil — me · recent-places",
        "tags": [
          "03 - Profil"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      },
      "post": {
        "summary": "POST Profil — me · recent-places",
        "tags": [
          "03 - Profil"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/drivers/onboarding/start": {
      "post": {
        "summary": "Démarrer onboarding chauffeur (après register DRIVER)",
        "tags": [
          "06 - Chauffeur",
          "02 - Auth"
        ],
        "description": "Crée la fiche `drivers` + partenaire. Requis avant KYC, véhicule et mise en ligne.",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "cityId": {
                    "type": "string",
                    "format": "uuid"
                  },
                  "rideCategoryCode": {
                    "type": "string",
                    "enum": [
                      "ECO",
                      "CONFORT",
                      "CONFORT+",
                      "PREMIUM"
                    ],
                    "example": "ECO"
                  },
                  "franchiseId": {
                    "type": "string",
                    "format": "uuid"
                  },
                  "acceptsCash": {
                    "type": "boolean",
                    "default": true
                  },
                  "acceptsWallet": {
                    "type": "boolean",
                    "default": true
                  }
                },
                "example": {
                  "cityId": "uuid-ville",
                  "rideCategoryCode": "ECO",
                  "acceptsCash": true
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "201": {
            "description": "Fiche chauffeur créée (`onboarding_status: started`)",
            "content": {
              "application/json": {
                "schema": {
                  "description": "Fiche chauffeur créée (`onboarding_status: started`)"
                }
              }
            }
          },
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/drivers/me": {
      "get": {
        "summary": "GET Chauffeur — drivers · me",
        "tags": [
          "06 - Chauffeur"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      },
      "patch": {
        "summary": "PATCH Chauffeur — drivers · me",
        "tags": [
          "06 - Chauffeur"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/drivers/me/orders": {
      "get": {
        "summary": "GET Chauffeur — drivers · me · orders",
        "tags": [
          "06 - Chauffeur"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "parameters": [
          {
            "schema": {
              "type": "integer",
              "minimum": 1,
              "default": 1,
              "example": 1
            },
            "in": "query",
            "name": "page",
            "required": false,
            "description": "Numéro de page (1-based)"
          },
          {
            "schema": {
              "type": "integer",
              "minimum": 1,
              "maximum": 100,
              "default": 20,
              "example": 20
            },
            "in": "query",
            "name": "limit",
            "required": false,
            "description": "Nombre d’éléments par page (max 100)"
          }
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/drivers/me/status": {
      "patch": {
        "summary": "PATCH Chauffeur — drivers · me · status",
        "tags": [
          "06 - Chauffeur"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/drivers/me/preferences": {
      "patch": {
        "summary": "PATCH Chauffeur — drivers · me · preferences",
        "tags": [
          "06 - Chauffeur"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/drivers/me/service-classes": {
      "post": {
        "summary": "POST Chauffeur — drivers · me · service-classes",
        "tags": [
          "06 - Chauffeur"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/drivers/me/service-classes/{id}": {
      "delete": {
        "summary": "DELETE Chauffeur — drivers · me · service-classes · :id",
        "tags": [
          "06 - Chauffeur"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/drivers/me/saved-places": {
      "get": {
        "summary": "GET Chauffeur — drivers · me · saved-places",
        "tags": [
          "06 - Chauffeur"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      },
      "post": {
        "summary": "POST Chauffeur — drivers · me · saved-places",
        "tags": [
          "06 - Chauffeur"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/drivers/me/partner-change-requests": {
      "post": {
        "summary": "POST Chauffeur — drivers · me · partner-change-requests",
        "tags": [
          "06 - Chauffeur"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/drivers/me/dashboard": {
      "get": {
        "summary": "GET Chauffeur — drivers · me · dashboard",
        "tags": [
          "06 - Chauffeur"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/drivers/me/earnings/daily": {
      "get": {
        "summary": "GET Chauffeur — drivers · me · earnings · daily",
        "tags": [
          "06 - Chauffeur"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/drivers/me/earnings/weekly": {
      "get": {
        "summary": "GET Chauffeur — drivers · me · earnings · weekly",
        "tags": [
          "06 - Chauffeur"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/drivers/me/earnings/monthly": {
      "get": {
        "summary": "GET Chauffeur — drivers · me · earnings · monthly",
        "tags": [
          "06 - Chauffeur"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/drivers/me/performance": {
      "get": {
        "summary": "GET Chauffeur — drivers · me · performance",
        "tags": [
          "06 - Chauffeur"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/drivers/me/heatmap": {
      "get": {
        "summary": "GET Chauffeur — drivers · me · heatmap",
        "tags": [
          "06 - Chauffeur"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/drivers/me/cash-reconciliations": {
      "get": {
        "summary": "GET Chauffeur — drivers · me · cash-reconciliations",
        "tags": [
          "06 - Chauffeur"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      },
      "post": {
        "summary": "POST Chauffeur — drivers · me · cash-reconciliations",
        "tags": [
          "06 - Chauffeur"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/drivers/me/break/start": {
      "post": {
        "summary": "POST Chauffeur — drivers · me · break · start",
        "tags": [
          "06 - Chauffeur"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/drivers/me/break/end": {
      "post": {
        "summary": "POST Chauffeur — drivers · me · break · end",
        "tags": [
          "06 - Chauffeur"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/drivers/me/panic": {
      "post": {
        "summary": "POST Chauffeur — drivers · me · panic",
        "tags": [
          "06 - Chauffeur"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/kyc/status": {
      "get": {
        "summary": "GET KYC — kyc · status",
        "tags": [
          "06 - Chauffeur"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/kyc/my-documents": {
      "get": {
        "summary": "GET KYC — kyc · my-documents",
        "tags": [
          "06 - Chauffeur"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/kyc/documents": {
      "post": {
        "summary": "POST KYC — kyc · documents",
        "tags": [
          "06 - Chauffeur"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/kyc/documents/{id}": {
      "patch": {
        "summary": "PATCH KYC — kyc · documents · :id",
        "tags": [
          "06 - Chauffeur"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/kyc/photo-controls": {
      "get": {
        "summary": "GET KYC — kyc · photo-controls",
        "tags": [
          "06 - Chauffeur"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/kyc/photo-controls/{id}/files": {
      "post": {
        "summary": "POST KYC — kyc · photo-controls · :id · files",
        "tags": [
          "06 - Chauffeur"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/vehicles/me": {
      "get": {
        "summary": "GET Véhicule — vehicles · me",
        "tags": [
          "06 - Chauffeur"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/vehicles": {
      "post": {
        "summary": "POST vehicles",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/vehicles/{id}": {
      "get": {
        "summary": "GET Véhicule — vehicles · :id",
        "tags": [
          "06 - Chauffeur"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      },
      "patch": {
        "summary": "PATCH Véhicule — vehicles · :id",
        "tags": [
          "06 - Chauffeur"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/vehicles/{id}/assign-driver": {
      "post": {
        "summary": "POST Véhicule — vehicles · :id · assign-driver",
        "tags": [
          "06 - Chauffeur"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/vehicles/{id}/availability": {
      "patch": {
        "summary": "PATCH Véhicule — vehicles · :id · availability",
        "tags": [
          "06 - Chauffeur"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/partners/me": {
      "get": {
        "summary": "GET partners · me",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/partners": {
      "post": {
        "summary": "POST partners",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/partners/{id}": {
      "get": {
        "summary": "GET partners · :id",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      },
      "patch": {
        "summary": "PATCH partners · :id",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/partners/{id}/dashboard": {
      "get": {
        "summary": "GET partners · :id · dashboard",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/partners/{id}/revenue": {
      "get": {
        "summary": "GET partners · :id · revenue",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/partners/{id}/wallet": {
      "get": {
        "summary": "GET partners · :id · wallet",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/partners/{id}/ledger": {
      "get": {
        "summary": "GET partners · :id · ledger",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/partners/{id}/settlements": {
      "get": {
        "summary": "GET partners · :id · settlements",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/partners/{id}/driver-performance": {
      "get": {
        "summary": "GET partners · :id · driver-performance",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/partners/{id}/vehicle-performance": {
      "get": {
        "summary": "GET partners · :id · vehicle-performance",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/partners/{id}/members": {
      "get": {
        "summary": "GET partners · :id · members",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      },
      "post": {
        "summary": "POST partners · :id · members",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/partners/{id}/drivers": {
      "get": {
        "summary": "GET partners · :id · drivers",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/partners/{id}/vehicles": {
      "get": {
        "summary": "GET partners · :id · vehicles",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/partners/{id}/members/{memberId}": {
      "patch": {
        "summary": "PATCH partners · :id · members · :memberId",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          },
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "memberId",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      },
      "delete": {
        "summary": "DELETE partners · :id · members · :memberId",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          },
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "memberId",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/partners/{id}/gps-devices": {
      "get": {
        "summary": "GET partners · :id · gps-devices",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      },
      "post": {
        "summary": "POST partners · :id · gps-devices",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/partners/{id}/gps-devices/{deviceId}": {
      "patch": {
        "summary": "PATCH partners · :id · gps-devices · :deviceId",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          },
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "deviceId",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      },
      "delete": {
        "summary": "DELETE partners · :id · gps-devices · :deviceId",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          },
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "deviceId",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/partners/{id}/freight-offers": {
      "get": {
        "summary": "GET partners · :id · freight-offers",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      },
      "post": {
        "summary": "POST partners · :id · freight-offers",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/partners/{id}/freight-offers/{offerId}": {
      "patch": {
        "summary": "PATCH partners · :id · freight-offers · :offerId",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          },
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "offerId",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      },
      "delete": {
        "summary": "DELETE partners · :id · freight-offers · :offerId",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          },
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "offerId",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/partners/{id}/cash-reconciliations": {
      "get": {
        "summary": "GET partners · :id · cash-reconciliations",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/franchises/me": {
      "get": {
        "summary": "GET franchises · me",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/franchises/{id}": {
      "get": {
        "summary": "GET franchises · :id",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      },
      "patch": {
        "summary": "PATCH franchises · :id",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/franchises/{id}/partners": {
      "get": {
        "summary": "GET franchises · :id · partners",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/franchises/{id}/drivers": {
      "get": {
        "summary": "GET franchises · :id · drivers",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/franchises/{id}/orders": {
      "get": {
        "summary": "GET franchises · :id · orders",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/franchises/{id}/revenue": {
      "get": {
        "summary": "GET franchises · :id · revenue",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/franchises/{id}/settlements": {
      "get": {
        "summary": "GET franchises · :id · settlements",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/franchises/{id}/pricing-rules": {
      "get": {
        "summary": "GET franchises · :id · pricing-rules",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/franchises/{id}/commission-rules": {
      "get": {
        "summary": "GET franchises · :id · commission-rules",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/franchises/{id}/members": {
      "get": {
        "summary": "GET franchises · :id · members",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      },
      "post": {
        "summary": "POST franchises · :id · members",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/franchises/{id}/members/{memberId}": {
      "patch": {
        "summary": "PATCH franchises · :id · members · :memberId",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          },
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "memberId",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      },
      "delete": {
        "summary": "DELETE franchises · :id · members · :memberId",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          },
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "memberId",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/client/dashboard": {
      "get": {
        "summary": "GET client · dashboard",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/driver/dashboard": {
      "get": {
        "summary": "GET driver · dashboard",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/partner/dashboard": {
      "get": {
        "summary": "GET partner · dashboard",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/franchise/dashboard": {
      "get": {
        "summary": "GET franchise · dashboard",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/maps/autocomplete": {
      "get": {
        "summary": "GET Cartographie — maps · autocomplete",
        "tags": [
          "08 - Cartographie"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [],
        "responses": {
          "200": {
            "description": "Default Response"
          }
        }
      }
    },
    "/v1/maps/geocode": {
      "get": {
        "summary": "GET Cartographie — maps · geocode",
        "tags": [
          "08 - Cartographie"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [],
        "responses": {
          "200": {
            "description": "Default Response"
          }
        }
      }
    },
    "/v1/maps/reverse-geocode": {
      "get": {
        "summary": "GET Cartographie — maps · reverse-geocode",
        "tags": [
          "08 - Cartographie"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [],
        "responses": {
          "200": {
            "description": "Default Response"
          }
        }
      }
    },
    "/v1/maps/route": {
      "post": {
        "summary": "POST Cartographie — maps · route",
        "tags": [
          "08 - Cartographie"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/maps/eta": {
      "post": {
        "summary": "POST Cartographie — maps · eta",
        "tags": [
          "08 - Cartographie"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/maps/distance-matrix": {
      "post": {
        "summary": "POST Cartographie — maps · distance-matrix",
        "tags": [
          "08 - Cartographie"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/maps/zone-detect": {
      "post": {
        "summary": "POST Cartographie — maps · zone-detect",
        "tags": [
          "08 - Cartographie"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/maps/nearest-drivers": {
      "post": {
        "summary": "POST Cartographie — maps · nearest-drivers",
        "tags": [
          "08 - Cartographie"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/maps/snap-to-road": {
      "post": {
        "summary": "POST Cartographie — maps · snap-to-road",
        "tags": [
          "08 - Cartographie"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/maps/config": {
      "get": {
        "summary": "GET Cartographie — maps · config",
        "tags": [
          "08 - Cartographie"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [],
        "responses": {
          "200": {
            "description": "Default Response"
          }
        }
      }
    },
    "/v1/geo/hot-zones": {
      "get": {
        "summary": "GET geo · hot-zones",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/geo/hot-zones/nearby": {
      "get": {
        "summary": "GET geo · hot-zones · nearby",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/geo/demand-summary": {
      "get": {
        "summary": "GET geo · demand-summary",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/geo/pickup-demand": {
      "get": {
        "summary": "GET geo · pickup-demand",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/config/app": {
      "get": {
        "summary": "GET config · app",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/orders": {
      "get": {
        "summary": "GET orders",
        "tags": [
          "99 - Autres modules"
        ],
        "parameters": [
          {
            "schema": {
              "type": "integer",
              "minimum": 1,
              "default": 1,
              "example": 1
            },
            "in": "query",
            "name": "page",
            "required": false,
            "description": "Numéro de page (1-based)"
          },
          {
            "schema": {
              "type": "integer",
              "minimum": 1,
              "maximum": 100,
              "default": 20,
              "example": 20
            },
            "in": "query",
            "name": "limit",
            "required": false,
            "description": "Nombre d’éléments par page (max 100)"
          }
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/orders/{serviceType}/{orderId}": {
      "get": {
        "summary": "GET orders · :serviceType · :orderId",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "serviceType",
            "required": true
          },
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "orderId",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/orders/{serviceType}/{orderId}/events": {
      "get": {
        "summary": "GET orders · :serviceType · :orderId · events",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "serviceType",
            "required": true
          },
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "orderId",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/orders/{serviceType}/{orderId}/tracking": {
      "get": {
        "summary": "GET orders · :serviceType · :orderId · tracking",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "serviceType",
            "required": true
          },
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "orderId",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/orders/{serviceType}/{orderId}/receipt": {
      "get": {
        "summary": "GET orders · :serviceType · :orderId · receipt",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "serviceType",
            "required": true
          },
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "orderId",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/orders/{serviceType}/{orderId}/rate": {
      "post": {
        "summary": "POST orders · :serviceType · :orderId · rate",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "serviceType",
            "required": true
          },
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "orderId",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/orders/{serviceType}/{orderId}/report-issue": {
      "post": {
        "summary": "POST orders · :serviceType · :orderId · report-issue",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "serviceType",
            "required": true
          },
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "orderId",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/rides/estimate": {
      "post": {
        "summary": "Estimer prix / durée avant commande",
        "tags": [
          "04 - Client · Course VTC"
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "pickup",
                  "dropoff"
                ],
                "properties": {
                  "categoryCode": {
                    "type": "string",
                    "enum": [
                      "ECO",
                      "CONFORT",
                      "CONFORT+",
                      "PREMIUM"
                    ],
                    "example": "ECO"
                  },
                  "cityId": {
                    "type": "string",
                    "format": "uuid"
                  },
                  "pickup": {
                    "type": "object",
                    "required": [
                      "latitude",
                      "longitude"
                    ],
                    "properties": {
                      "latitude": {
                        "type": "number",
                        "example": 5.316667
                      },
                      "longitude": {
                        "type": "number",
                        "example": -4.033333
                      },
                      "address": {
                        "type": "string",
                        "example": "Plateau, Abidjan"
                      }
                    }
                  },
                  "dropoff": {
                    "type": "object",
                    "required": [
                      "latitude",
                      "longitude"
                    ],
                    "properties": {
                      "latitude": {
                        "type": "number",
                        "example": 5.316667
                      },
                      "longitude": {
                        "type": "number",
                        "example": -4.033333
                      },
                      "address": {
                        "type": "string",
                        "example": "Plateau, Abidjan"
                      }
                    }
                  },
                  "optionCodes": {
                    "type": "array",
                    "items": {
                      "type": "string"
                    }
                  }
                },
                "example": {
                  "categoryCode": "ECO",
                  "pickup": {
                    "latitude": 5.316667,
                    "longitude": -4.033333,
                    "address": "Plateau, Abidjan"
                  },
                  "dropoff": {
                    "latitude": 5.348,
                    "longitude": -3.986,
                    "address": "Cocody, Abidjan"
                  }
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/rides": {
      "post": {
        "summary": "Créer une course",
        "tags": [
          "04 - Client · Course VTC"
        ],
        "description": "Crée `rides` en `requested`. Dispatch auto ou via `/dispatch/rides/:id/start`.",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "description": "Utiliser `quoteId` retourné par `/rides/estimate` ou envoyer pickup/dropoff directement.",
                "properties": {
                  "quoteId": {
                    "type": "string",
                    "format": "uuid"
                  },
                  "categoryCode": {
                    "type": "string",
                    "example": "ECO"
                  },
                  "pickup": {
                    "type": "object",
                    "required": [
                      "latitude",
                      "longitude"
                    ],
                    "properties": {
                      "latitude": {
                        "type": "number",
                        "example": 5.316667
                      },
                      "longitude": {
                        "type": "number",
                        "example": -4.033333
                      },
                      "address": {
                        "type": "string",
                        "example": "Plateau, Abidjan"
                      }
                    }
                  },
                  "dropoff": {
                    "type": "object",
                    "required": [
                      "latitude",
                      "longitude"
                    ],
                    "properties": {
                      "latitude": {
                        "type": "number",
                        "example": 5.316667
                      },
                      "longitude": {
                        "type": "number",
                        "example": -4.033333
                      },
                      "address": {
                        "type": "string",
                        "example": "Plateau, Abidjan"
                      }
                    }
                  }
                },
                "example": {
                  "categoryCode": "ECO",
                  "pickup": {
                    "latitude": 5.316667,
                    "longitude": -4.033333,
                    "address": "Plateau, Abidjan"
                  },
                  "dropoff": {
                    "latitude": 5.348,
                    "longitude": -3.986,
                    "address": "Cocody, Abidjan"
                  }
                }
              }
            }
          },
          "description": "Utiliser `quoteId` retourné par `/rides/estimate` ou envoyer pickup/dropoff directement."
        },
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "201": {
            "description": "Course créée (`status: requested`)",
            "content": {
              "application/json": {
                "schema": {
                  "description": "Course créée (`status: requested`)"
                }
              }
            }
          },
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      },
      "get": {
        "summary": "Lister mes courses",
        "tags": [
          "04 - Client · Course VTC"
        ],
        "parameters": [
          {
            "schema": {
              "type": "integer",
              "minimum": 1,
              "default": 1,
              "example": 1
            },
            "in": "query",
            "name": "page",
            "required": false,
            "description": "Numéro de page (1-based)"
          },
          {
            "schema": {
              "type": "integer",
              "minimum": 1,
              "maximum": 100,
              "default": 20,
              "example": 20
            },
            "in": "query",
            "name": "limit",
            "required": false,
            "description": "Nombre d’éléments par page (max 100)"
          }
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Liste paginée des courses",
            "content": {
              "application/json": {
                "schema": {
                  "description": "Liste paginée des courses",
                  "content": {
                    "application/json": {
                      "example": {
                        "status": "ok",
                        "rides": [],
                        "pagination": {
                          "page": 1,
                          "limit": 20,
                          "total": 0,
                          "hasMore": false
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/rides/{id}": {
      "get": {
        "summary": "Détail d’une course",
        "tags": [
          "04 - Client · Course VTC"
        ],
        "parameters": [
          {
            "schema": {
              "type": "string",
              "format": "uuid"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/rides/{id}/events": {
      "get": {
        "summary": "GET Course VTC — rides · :id · events",
        "tags": [
          "04 - Client · Course VTC"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/rides/{id}/cancel": {
      "post": {
        "summary": "Annuler une course",
        "tags": [
          "04 - Client · Course VTC"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/rides/{id}/accept": {
      "post": {
        "summary": "Transition course (chauffeur)",
        "tags": [
          "06 - Chauffeur"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/rides/{id}/arrived": {
      "post": {
        "summary": "Transition course (chauffeur)",
        "tags": [
          "06 - Chauffeur"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/rides/{id}/start": {
      "post": {
        "summary": "Transition course (chauffeur)",
        "tags": [
          "06 - Chauffeur"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/rides/{id}/complete": {
      "post": {
        "summary": "Transition course (chauffeur)",
        "tags": [
          "06 - Chauffeur"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/rides/{id}/share": {
      "post": {
        "summary": "POST Course VTC — rides · :id · share",
        "tags": [
          "04 - Client · Course VTC"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/deliveries/estimate": {
      "post": {
        "summary": "POST Livraison — deliveries · estimate",
        "tags": [
          "07 - Livraison & autres services"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/deliveries": {
      "post": {
        "summary": "POST Livraison — deliveries",
        "tags": [
          "07 - Livraison & autres services"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      },
      "get": {
        "summary": "GET Livraison — deliveries",
        "tags": [
          "07 - Livraison & autres services"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "parameters": [
          {
            "schema": {
              "type": "integer",
              "minimum": 1,
              "default": 1,
              "example": 1
            },
            "in": "query",
            "name": "page",
            "required": false,
            "description": "Numéro de page (1-based)"
          },
          {
            "schema": {
              "type": "integer",
              "minimum": 1,
              "maximum": 100,
              "default": 20,
              "example": 20
            },
            "in": "query",
            "name": "limit",
            "required": false,
            "description": "Nombre d’éléments par page (max 100)"
          }
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/deliveries/{id}": {
      "get": {
        "summary": "GET Livraison — deliveries · :id",
        "tags": [
          "07 - Livraison & autres services"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/deliveries/{id}/events": {
      "get": {
        "summary": "GET Livraison — deliveries · :id · events",
        "tags": [
          "07 - Livraison & autres services"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/deliveries/{id}/cancel": {
      "post": {
        "summary": "POST Livraison — deliveries · :id · cancel",
        "tags": [
          "07 - Livraison & autres services"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/deliveries/{id}/accept": {
      "post": {
        "summary": "POST Livraison — deliveries · :id · accept",
        "tags": [
          "07 - Livraison & autres services"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/deliveries/{id}/pickup": {
      "post": {
        "summary": "POST Livraison — deliveries · :id · pickup",
        "tags": [
          "07 - Livraison & autres services"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/deliveries/{id}/deliver": {
      "post": {
        "summary": "POST Livraison — deliveries · :id · deliver",
        "tags": [
          "07 - Livraison & autres services"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/deliveries/{id}/proof": {
      "post": {
        "summary": "POST Livraison — deliveries · :id · proof",
        "tags": [
          "07 - Livraison & autres services"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/freights/estimate": {
      "post": {
        "summary": "POST Fret — freights · estimate",
        "tags": [
          "07 - Livraison & autres services"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/freights": {
      "post": {
        "summary": "POST Fret — freights",
        "tags": [
          "07 - Livraison & autres services"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      },
      "get": {
        "summary": "GET Fret — freights",
        "tags": [
          "07 - Livraison & autres services"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/freights/{id}": {
      "get": {
        "summary": "GET Fret — freights · :id",
        "tags": [
          "07 - Livraison & autres services"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/freights/{id}/cancel": {
      "post": {
        "summary": "POST Fret — freights · :id · cancel",
        "tags": [
          "07 - Livraison & autres services"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/freights/{id}/quotes": {
      "get": {
        "summary": "GET Fret — freights · :id · quotes",
        "tags": [
          "07 - Livraison & autres services"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      },
      "post": {
        "summary": "POST Fret — freights · :id · quotes",
        "tags": [
          "07 - Livraison & autres services"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/freights/{id}/quotes/{quoteId}/accept": {
      "post": {
        "summary": "POST Fret — freights · :id · quotes · :quoteId · accept",
        "tags": [
          "07 - Livraison & autres services"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          },
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "quoteId",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/freights/{id}/pickup": {
      "post": {
        "summary": "POST Fret — freights · :id · pickup",
        "tags": [
          "07 - Livraison & autres services"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/freights/{id}/deliver": {
      "post": {
        "summary": "POST Fret — freights · :id · deliver",
        "tags": [
          "07 - Livraison & autres services"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/freights/{id}/proof": {
      "post": {
        "summary": "POST Fret — freights · :id · proof",
        "tags": [
          "07 - Livraison & autres services"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/rental/offers": {
      "get": {
        "summary": "GET rental · offers",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      },
      "post": {
        "summary": "POST rental · offers",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/rental/offers/{id}": {
      "patch": {
        "summary": "PATCH rental · offers · :id",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/rentals/estimate": {
      "post": {
        "summary": "POST Location — rentals · estimate",
        "tags": [
          "07 - Livraison & autres services"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/rentals": {
      "post": {
        "summary": "POST Location — rentals",
        "tags": [
          "07 - Livraison & autres services"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      },
      "get": {
        "summary": "GET Location — rentals",
        "tags": [
          "07 - Livraison & autres services"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/rentals/{id}": {
      "get": {
        "summary": "GET Location — rentals · :id",
        "tags": [
          "07 - Livraison & autres services"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/rentals/{id}/cancel": {
      "post": {
        "summary": "POST Location — rentals · :id · cancel",
        "tags": [
          "07 - Livraison & autres services"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/rentals/{id}/start": {
      "post": {
        "summary": "POST Location — rentals · :id · start",
        "tags": [
          "07 - Livraison & autres services"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/rentals/{id}/complete": {
      "post": {
        "summary": "POST Location — rentals · :id · complete",
        "tags": [
          "07 - Livraison & autres services"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/rentals/{id}/contract": {
      "get": {
        "summary": "GET Location — rentals · :id · contract",
        "tags": [
          "07 - Livraison & autres services"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/dispatch/config/defaults": {
      "get": {
        "summary": "Defaults dispatch (fallback code)",
        "tags": [
          "05 - Dispatch",
          "10 - Admin"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/dispatch/rides/{rideId}/start": {
      "post": {
        "summary": "Démarrer dispatch RIDE",
        "tags": [
          "05 - Dispatch"
        ],
        "description": "Vagues 2→4→6→8 km · offre 120 s · intervalle vague 120 s.",
        "parameters": [
          {
            "schema": {
              "type": "string",
              "format": "uuid"
            },
            "in": "path",
            "name": "rideId",
            "required": true
          }
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/dispatch/deliveries/{deliveryId}/start": {
      "post": {
        "summary": "Démarrer dispatch DELIVERY_CARGO",
        "tags": [
          "05 - Dispatch"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "deliveryId",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/dispatch/{serviceType}/{orderId}/retry": {
      "post": {
        "summary": "Relancer un dispatch",
        "tags": [
          "05 - Dispatch"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "serviceType",
            "required": true
          },
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "orderId",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/dispatch/{serviceType}/{orderId}/status": {
      "get": {
        "summary": "Statut dispatch (vague, rayon, offre)",
        "tags": [
          "05 - Dispatch"
        ],
        "description": "`serviceType` : `RIDE` ou `DELIVERY_CARGO`.",
        "parameters": [
          {
            "schema": {
              "type": "string",
              "enum": [
                "RIDE",
                "DELIVERY_CARGO"
              ]
            },
            "in": "path",
            "name": "serviceType",
            "required": true
          },
          {
            "schema": {
              "type": "string",
              "format": "uuid"
            },
            "in": "path",
            "name": "orderId",
            "required": true
          }
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/dispatch/{serviceType}/{orderId}/logs": {
      "get": {
        "summary": "Journal dispatch (audit / debug)",
        "tags": [
          "05 - Dispatch"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "serviceType",
            "required": true
          },
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "orderId",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/dispatch/offers/{offerId}/received": {
      "post": {
        "summary": "Accuser réception offre",
        "tags": [
          "05 - Dispatch",
          "06 - Chauffeur"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "offerId",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/dispatch/offers/{offerId}/accept": {
      "post": {
        "summary": "Accepter offre dispatch",
        "tags": [
          "05 - Dispatch",
          "06 - Chauffeur"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "offerId",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/dispatch/offers/{offerId}/reject": {
      "post": {
        "summary": "Refuser offre dispatch",
        "tags": [
          "05 - Dispatch",
          "06 - Chauffeur"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "offerId",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/locations/driver": {
      "post": {
        "summary": "Mettre à jour position GPS chauffeur",
        "tags": [
          "06 - Chauffeur"
        ],
        "description": "Haute fréquence. Alimente le dispatch et les sockets.",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "latitude",
                  "longitude"
                ],
                "properties": {
                  "latitude": {
                    "type": "number",
                    "example": 5.32
                  },
                  "longitude": {
                    "type": "number",
                    "example": -4.02
                  },
                  "heading": {
                    "type": "number",
                    "example": 180
                  },
                  "speedKmh": {
                    "type": "number",
                    "example": 35
                  },
                  "accuracyM": {
                    "type": "number",
                    "example": 8
                  }
                }
              }
            }
          }
        },
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/locations/orders/{serviceType}/{orderId}": {
      "get": {
        "summary": "Position chauffeur commande",
        "tags": [
          "06 - Chauffeur",
          "04 - Client · Course VTC"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "serviceType",
            "required": true
          },
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "orderId",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/locations/drivers/{driverId}/latest": {
      "get": {
        "summary": "GET Localisation — locations · drivers · :driverId · latest",
        "tags": [
          "06 - Chauffeur"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "driverId",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/map-feedback": {
      "post": {
        "summary": "POST map-feedback",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/wallets/me": {
      "get": {
        "summary": "GET Finance — wallets · me",
        "tags": [
          "09 - Finance & support"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/wallets/me/ledger": {
      "get": {
        "summary": "GET Finance — wallets · me · ledger",
        "tags": [
          "09 - Finance & support"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/wallets/me/recharge": {
      "post": {
        "summary": "POST Finance — wallets · me · recharge",
        "tags": [
          "09 - Finance & support"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/wallets/recharge-batches": {
      "post": {
        "summary": "POST Finance — wallets · recharge-batches",
        "tags": [
          "09 - Finance & support"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      },
      "get": {
        "summary": "GET Finance — wallets · recharge-batches",
        "tags": [
          "09 - Finance & support"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/wallets/recharge-batches/{id}": {
      "get": {
        "summary": "GET Finance — wallets · recharge-batches · :id",
        "tags": [
          "09 - Finance & support"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/wallets/recharges/me": {
      "get": {
        "summary": "GET Finance — wallets · recharges · me",
        "tags": [
          "09 - Finance & support"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/payment-methods/me": {
      "get": {
        "summary": "GET Finance — payment-methods · me",
        "tags": [
          "09 - Finance & support"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      },
      "post": {
        "summary": "POST Finance — payment-methods · me",
        "tags": [
          "09 - Finance & support"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/payments/initiate": {
      "post": {
        "summary": "POST Finance — payments · initiate",
        "tags": [
          "09 - Finance & support"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/payments/webhooks/paydunya": {
      "post": {
        "summary": "POST Finance — payments · webhooks · paydunya",
        "tags": [
          "09 - Finance & support"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/payments/webhooks/sms": {
      "post": {
        "summary": "POST Finance — payments · webhooks · sms",
        "tags": [
          "09 - Finance & support"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/commissions/orders/{serviceType}/{orderId}": {
      "get": {
        "summary": "GET commissions · orders · :serviceType · :orderId",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "serviceType",
            "required": true
          },
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "orderId",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/earnings/driver/me": {
      "get": {
        "summary": "GET Finance — earnings · driver · me",
        "tags": [
          "09 - Finance & support"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/withdrawals": {
      "post": {
        "summary": "POST Finance — withdrawals",
        "tags": [
          "09 - Finance & support"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      },
      "get": {
        "summary": "GET Finance — withdrawals",
        "tags": [
          "09 - Finance & support"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/receipts/{id}": {
      "get": {
        "summary": "GET receipts · :id",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/invoices": {
      "get": {
        "summary": "GET Finance — invoices",
        "tags": [
          "09 - Finance & support"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/invoices/{id}": {
      "get": {
        "summary": "GET Finance — invoices · :id",
        "tags": [
          "09 - Finance & support"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/payouts": {
      "get": {
        "summary": "GET Finance — payouts",
        "tags": [
          "09 - Finance & support"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/payouts/{id}": {
      "get": {
        "summary": "GET Finance — payouts · :id",
        "tags": [
          "09 - Finance & support"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/cash-reconciliations": {
      "get": {
        "summary": "GET cash-reconciliations",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      },
      "post": {
        "summary": "POST cash-reconciliations",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/cash-reconciliations/{id}": {
      "get": {
        "summary": "GET cash-reconciliations · :id",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/notifications": {
      "get": {
        "summary": "GET Support — notifications",
        "tags": [
          "09 - Finance & support"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "parameters": [
          {
            "schema": {
              "type": "integer",
              "minimum": 1,
              "default": 1,
              "example": 1
            },
            "in": "query",
            "name": "page",
            "required": false,
            "description": "Numéro de page (1-based)"
          },
          {
            "schema": {
              "type": "integer",
              "minimum": 1,
              "maximum": 100,
              "default": 20,
              "example": 20
            },
            "in": "query",
            "name": "limit",
            "required": false,
            "description": "Nombre d’éléments par page (max 100)"
          }
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/notifications/unread-count": {
      "get": {
        "summary": "GET Support — notifications · unread-count",
        "tags": [
          "09 - Finance & support"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/notifications/{id}/read": {
      "patch": {
        "summary": "PATCH Support — notifications · :id · read",
        "tags": [
          "09 - Finance & support"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/notifications/read-all": {
      "patch": {
        "summary": "PATCH Support — notifications · read-all",
        "tags": [
          "09 - Finance & support"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/notifications/test": {
      "post": {
        "summary": "POST Support — notifications · test",
        "tags": [
          "09 - Finance & support"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/notification-templates": {
      "get": {
        "summary": "GET notification-templates",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      },
      "post": {
        "summary": "POST notification-templates",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/support/tickets": {
      "get": {
        "summary": "GET Support — support · tickets",
        "tags": [
          "09 - Finance & support"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      },
      "post": {
        "summary": "POST Support — support · tickets",
        "tags": [
          "09 - Finance & support"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/support/tickets/{id}": {
      "get": {
        "summary": "GET Support — support · tickets · :id",
        "tags": [
          "09 - Finance & support"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/support/tickets/{id}/messages": {
      "post": {
        "summary": "POST Support — support · tickets · :id · messages",
        "tags": [
          "09 - Finance & support"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/sos": {
      "post": {
        "summary": "POST sos",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/sos/{id}": {
      "get": {
        "summary": "GET sos · :id",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/disputes": {
      "post": {
        "summary": "POST Support — disputes",
        "tags": [
          "09 - Finance & support"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      },
      "get": {
        "summary": "GET Support — disputes",
        "tags": [
          "09 - Finance & support"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/disputes/{id}": {
      "get": {
        "summary": "GET Support — disputes · :id",
        "tags": [
          "09 - Finance & support"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/chat/conversations": {
      "get": {
        "summary": "GET Support — chat · conversations",
        "tags": [
          "09 - Finance & support"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/chat/conversations/{id}/messages": {
      "get": {
        "summary": "GET Support — chat · conversations · :id · messages",
        "tags": [
          "09 - Finance & support"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      },
      "post": {
        "summary": "POST Support — chat · conversations · :id · messages",
        "tags": [
          "09 - Finance & support"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/calls/logs": {
      "post": {
        "summary": "POST calls · logs",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/message-channels": {
      "get": {
        "summary": "GET message-channels",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/message-channels/{id}/messages": {
      "get": {
        "summary": "GET message-channels · :id · messages",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/message-channels/{id}/read": {
      "patch": {
        "summary": "PATCH message-channels · :id · read",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/business-accounts/me": {
      "get": {
        "summary": "GET business-accounts · me",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/business-accounts": {
      "post": {
        "summary": "POST business-accounts",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/business-accounts/{id}": {
      "get": {
        "summary": "GET business-accounts · :id",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      },
      "patch": {
        "summary": "PATCH business-accounts · :id",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/business-accounts/{id}/members": {
      "get": {
        "summary": "GET business-accounts · :id · members",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      },
      "post": {
        "summary": "POST business-accounts · :id · members",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/business-accounts/{id}/members/{memberId}": {
      "patch": {
        "summary": "PATCH business-accounts · :id · members · :memberId",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          },
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "memberId",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      },
      "delete": {
        "summary": "DELETE business-accounts · :id · members · :memberId",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          },
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "memberId",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/ratings": {
      "post": {
        "summary": "POST Support — ratings",
        "tags": [
          "09 - Finance & support"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/ratings/me": {
      "get": {
        "summary": "GET Support — ratings · me",
        "tags": [
          "09 - Finance & support"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/scores/me": {
      "get": {
        "summary": "GET scores · me",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/training/modules": {
      "get": {
        "summary": "GET training · modules",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/training/progress/me": {
      "get": {
        "summary": "GET training · progress · me",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/training/modules/{id}/start": {
      "post": {
        "summary": "POST training · modules · :id · start",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/training/modules/{id}/complete": {
      "post": {
        "summary": "POST training · modules · :id · complete",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/drivers/me/goals": {
      "get": {
        "summary": "GET Chauffeur — drivers · me · goals",
        "tags": [
          "06 - Chauffeur"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/app-banners": {
      "get": {
        "summary": "GET app-banners",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/campaigns": {
      "get": {
        "summary": "GET campaigns",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/referrals": {
      "post": {
        "summary": "POST referrals",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/referrals/me": {
      "get": {
        "summary": "GET referrals · me",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/promotions/validate": {
      "post": {
        "summary": "POST promotions · validate",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/promotions/redeem": {
      "post": {
        "summary": "POST promotions · redeem",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/uploads/signed-url": {
      "post": {
        "summary": "POST uploads · signed-url",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/uploads/complete": {
      "post": {
        "summary": "POST uploads · complete",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/uploads/{id}": {
      "get": {
        "summary": "GET uploads · :id",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      },
      "delete": {
        "summary": "DELETE uploads · :id",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/uploads/{id}/download-url": {
      "get": {
        "summary": "GET uploads · :id · download-url",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/zones": {
      "get": {
        "summary": "GET zones",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/zones/hot": {
      "get": {
        "summary": "GET zones · hot",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/zones/heatmap": {
      "get": {
        "summary": "GET zones · heatmap",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/zones/{id}": {
      "get": {
        "summary": "GET zones · :id",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/zones/{id}/demand": {
      "get": {
        "summary": "GET zones · :id · demand",
        "tags": [
          "99 - Autres modules"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/admin/catalog/{resource}": {
      "get": {
        "summary": "GET Admin — admin · catalog · :resource",
        "tags": [
          "10 - Admin"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "resource",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      },
      "post": {
        "summary": "POST Admin — admin · catalog · :resource",
        "tags": [
          "10 - Admin"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "resource",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/admin/catalog/{resource}/{id}": {
      "patch": {
        "summary": "PATCH Admin — admin · catalog · :resource · :id",
        "tags": [
          "10 - Admin"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "resource",
            "required": true
          },
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      },
      "delete": {
        "summary": "DELETE Admin — admin · catalog · :resource · :id",
        "tags": [
          "10 - Admin"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "resource",
            "required": true
          },
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/admin/catalog/cache/refresh": {
      "post": {
        "summary": "POST Admin — admin · catalog · cache · refresh",
        "tags": [
          "10 - Admin"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/admin/dashboard": {
      "get": {
        "summary": "Dashboard admin KPIs (maquette complète)",
        "tags": [
          "10 - Admin"
        ],
        "description": "Query: `franchiseId`, `cityId` ou `countryCode`+`citySlug`, `date`, `limit`. Réponse: `dashboard.summary` (courses, flux 7j, répartition, réseau, chauffeurs, KYC, users), `finance`, `recentActivity`, `alerts`. Doc front: `docs/ADMIN-DASHBOARD-FRONTEND.md`.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/admin/dashboard/recent-activity": {
      "get": {
        "summary": "Activité récente (table courses)",
        "tags": [
          "10 - Admin"
        ],
        "description": "Mêmes filtres que dashboard. Polling léger pour la table du bas.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/admin/live-map": {
      "get": {
        "summary": "Carte live chauffeurs / commandes",
        "tags": [
          "10 - Admin"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/admin/live-orders": {
      "get": {
        "summary": "GET Admin — admin · live-orders",
        "tags": [
          "10 - Admin"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/admin/live-drivers": {
      "get": {
        "summary": "GET Admin — admin · live-drivers",
        "tags": [
          "10 - Admin"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/admin/users": {
      "get": {
        "summary": "GET Admin — admin · users",
        "tags": [
          "10 - Admin"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/admin/drivers": {
      "get": {
        "summary": "GET Admin — admin · drivers",
        "tags": [
          "10 - Admin"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/admin/partners": {
      "get": {
        "summary": "GET Admin — admin · partners",
        "tags": [
          "10 - Admin"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/admin/vehicles": {
      "get": {
        "summary": "GET Admin — admin · vehicles",
        "tags": [
          "10 - Admin"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/admin/orders": {
      "get": {
        "summary": "GET Admin — admin · orders",
        "tags": [
          "10 - Admin"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/admin/kyc/documents": {
      "get": {
        "summary": "GET Admin — admin · kyc · documents",
        "tags": [
          "10 - Admin"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/admin/kyc/documents/{id}/approve": {
      "post": {
        "summary": "POST Admin — admin · kyc · documents · :id · approve",
        "tags": [
          "10 - Admin"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/admin/kyc/documents/{id}/reject": {
      "post": {
        "summary": "POST Admin — admin · kyc · documents · :id · reject",
        "tags": [
          "10 - Admin"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/admin/approval-requests": {
      "get": {
        "summary": "GET Admin — admin · approval-requests",
        "tags": [
          "10 - Admin"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/admin/approval-requests/{id}/approve": {
      "post": {
        "summary": "POST Admin — admin · approval-requests · :id · approve",
        "tags": [
          "10 - Admin"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/admin/approval-requests/{id}/reject": {
      "post": {
        "summary": "POST Admin — admin · approval-requests · :id · reject",
        "tags": [
          "10 - Admin"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/admin/pricing-rules": {
      "get": {
        "summary": "GET Admin — admin · pricing-rules",
        "tags": [
          "10 - Admin"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      },
      "post": {
        "summary": "POST Admin — admin · pricing-rules",
        "tags": [
          "10 - Admin"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/admin/pricing-rules/{id}": {
      "patch": {
        "summary": "PATCH Admin — admin · pricing-rules · :id",
        "tags": [
          "10 - Admin"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/admin/commission-rules": {
      "get": {
        "summary": "GET Admin — admin · commission-rules",
        "tags": [
          "10 - Admin"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      },
      "post": {
        "summary": "POST Admin — admin · commission-rules",
        "tags": [
          "10 - Admin"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/admin/commission-rules/{id}": {
      "patch": {
        "summary": "PATCH Admin — admin · commission-rules · :id",
        "tags": [
          "10 - Admin"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/admin/settlement-runs": {
      "get": {
        "summary": "GET Admin — admin · settlement-runs",
        "tags": [
          "10 - Admin"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      },
      "post": {
        "summary": "POST Admin — admin · settlement-runs",
        "tags": [
          "10 - Admin"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/admin/settlement-runs/{id}": {
      "patch": {
        "summary": "PATCH Admin — admin · settlement-runs · :id",
        "tags": [
          "10 - Admin"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/admin/settlement-runs/{id}/approve": {
      "post": {
        "summary": "POST Admin — admin · settlement-runs · :id · approve",
        "tags": [
          "10 - Admin"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/admin/withdrawals": {
      "get": {
        "summary": "GET Admin — admin · withdrawals",
        "tags": [
          "10 - Admin"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/admin/withdrawals/{id}/approve": {
      "post": {
        "summary": "POST Admin — admin · withdrawals · :id · approve",
        "tags": [
          "10 - Admin"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/admin/withdrawals/{id}/reject": {
      "post": {
        "summary": "POST Admin — admin · withdrawals · :id · reject",
        "tags": [
          "10 - Admin"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/admin/roles": {
      "get": {
        "summary": "GET Admin — admin · roles",
        "tags": [
          "10 - Admin"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      },
      "post": {
        "summary": "POST Admin — admin · roles",
        "tags": [
          "10 - Admin"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/admin/roles/{id}": {
      "patch": {
        "summary": "PATCH Admin — admin · roles · :id",
        "tags": [
          "10 - Admin"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/admin/permissions": {
      "get": {
        "summary": "GET Admin — admin · permissions",
        "tags": [
          "10 - Admin"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/admin/roles/{id}/permissions": {
      "get": {
        "summary": "GET Admin — admin · roles · :id · permissions",
        "tags": [
          "10 - Admin"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      },
      "post": {
        "summary": "POST Admin — admin · roles · :id · permissions",
        "tags": [
          "10 - Admin"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/admin/users/{id}/roles": {
      "get": {
        "summary": "GET Admin — admin · users · :id · roles",
        "tags": [
          "10 - Admin"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      },
      "post": {
        "summary": "POST Admin — admin · users · :id · roles",
        "tags": [
          "10 - Admin"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/admin/users/{id}/roles/{roleId}": {
      "delete": {
        "summary": "DELETE Admin — admin · users · :id · roles · :roleId",
        "tags": [
          "10 - Admin"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          },
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "roleId",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/admin/promotions": {
      "get": {
        "summary": "GET Admin — admin · promotions",
        "tags": [
          "10 - Admin"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      },
      "post": {
        "summary": "POST Admin — admin · promotions",
        "tags": [
          "10 - Admin"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/admin/promotions/{id}": {
      "patch": {
        "summary": "PATCH Admin — admin · promotions · :id",
        "tags": [
          "10 - Admin"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/admin/payouts": {
      "get": {
        "summary": "GET Admin — admin · payouts",
        "tags": [
          "10 - Admin"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/admin/payouts/{id}/approve": {
      "post": {
        "summary": "POST Admin — admin · payouts · :id · approve",
        "tags": [
          "10 - Admin"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/admin/payouts/{id}/reject": {
      "post": {
        "summary": "POST Admin — admin · payouts · :id · reject",
        "tags": [
          "10 - Admin"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/admin/cash-reconciliations": {
      "get": {
        "summary": "GET Admin — admin · cash-reconciliations",
        "tags": [
          "10 - Admin"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/admin/cash-reconciliations/{id}/review": {
      "post": {
        "summary": "POST Admin — admin · cash-reconciliations · :id · review",
        "tags": [
          "10 - Admin"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "id",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/admin/gps-devices": {
      "get": {
        "summary": "GET Admin — admin · gps-devices",
        "tags": [
          "10 - Admin"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/admin/gps-access-log": {
      "get": {
        "summary": "GET Admin — admin · gps-access-log",
        "tags": [
          "10 - Admin"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/admin/audit-log": {
      "get": {
        "summary": "GET Admin — admin · audit-log",
        "tags": [
          "10 - Admin"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/admin/system-settings": {
      "get": {
        "summary": "GET Admin — admin · system-settings",
        "tags": [
          "10 - Admin"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/admin/dispatch-config": {
      "get": {
        "summary": "Lire config dispatch (global + pays)",
        "tags": [
          "10 - Admin"
        ],
        "description": "Query `countryCode=CI` pour la vue fusionnée.",
        "parameters": [
          {
            "schema": {
              "type": "string",
              "example": "CI"
            },
            "in": "query",
            "name": "countryCode",
            "required": false,
            "description": "Code ISO pays (CI, SN, BF, ML)"
          }
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      },
      "put": {
        "summary": "Remplacer document dispatch.config",
        "tags": [
          "10 - Admin"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/admin/dispatch-config/countries/{countryCode}": {
      "patch": {
        "summary": "Patch override dispatch par pays",
        "tags": [
          "10 - Admin"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "countryCode",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/admin/system-settings/{key}": {
      "patch": {
        "summary": "PATCH Admin — admin · system-settings · :key",
        "tags": [
          "10 - Admin"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "schema": {
              "type": "string"
            },
            "in": "path",
            "name": "key",
            "required": true
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/admin/idempotency-keys": {
      "get": {
        "summary": "GET Admin — admin · idempotency-keys",
        "tags": [
          "10 - Admin"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/admin/payment-webhooks": {
      "get": {
        "summary": "GET Admin — admin · payment-webhooks",
        "tags": [
          "10 - Admin"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/admin/reports/revenue": {
      "get": {
        "summary": "GET Admin — admin · reports · revenue",
        "tags": [
          "10 - Admin"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/admin/reports/orders": {
      "get": {
        "summary": "GET Admin — admin · reports · orders",
        "tags": [
          "10 - Admin"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/admin/reports/drivers": {
      "get": {
        "summary": "GET Admin — admin · reports · drivers",
        "tags": [
          "10 - Admin"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/admin/reports/partners": {
      "get": {
        "summary": "GET Admin — admin · reports · partners",
        "tags": [
          "10 - Admin"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/admin/reports/franchises": {
      "get": {
        "summary": "GET Admin — admin · reports · franchises",
        "tags": [
          "10 - Admin"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/admin/reports/finance": {
      "get": {
        "summary": "GET Admin — admin · reports · finance",
        "tags": [
          "10 - Admin"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1/admin/reports/export": {
      "get": {
        "summary": "GET Admin — admin · reports · export",
        "tags": [
          "10 - Admin"
        ],
        "description": "Voir le workflow en tête de documentation Swagger.",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "401": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Unauthorized"
                }
              }
            }
          },
          "403": {
            "description": "Default Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/responses/Forbidden"
                }
              }
            }
          }
        }
      }
    },
    "/v1": {
      "get": {
        "summary": "Version API v1",
        "tags": [
          "00 - Système"
        ],
        "security": [],
        "responses": {
          "200": {
            "description": "Default Response"
          }
        }
      }
    }
  },
  "servers": [
    {
      "url": "https://api.upjunoo-dev.tech",
      "description": "Environnement dev (server1 · api.upjunoo-dev.tech)"
    },
    {
      "url": "http://localhost:8080",
      "description": "Développement local"
    }
  ],
  "tags": [
    {
      "name": "00 - Système",
      "description": "Healthcheck, readiness (Postgres + Redis) et page d’accueil API."
    },
    {
      "name": "01 - Démarrage",
      "description": "Charger le catalogue pays/villes/services avant toute session. Commencez par `GET /v1/catalog/bootstrap`."
    },
    {
      "name": "02 - Auth",
      "description": "Inscription première connexion, login, OTP, refresh JWT. Après register → `session` + **Authorize**."
    },
    {
      "name": "03 - Profil",
      "description": "Profil utilisateur, préférences, adresses et appareils."
    },
    {
      "name": "04 - Client · Course VTC",
      "description": "Estimation, création et suivi de courses RIDE (ECO → PREMIUM)."
    },
    {
      "name": "05 - Dispatch",
      "description": "Moteur d’affectation chauffeur : vagues, offres, statuts. Couplé aux WebSockets `dispatch:`*."
    },
    {
      "name": "06 - Chauffeur",
      "description": "GPS, tableau de bord, offres dispatch, véhicule et KYC."
    },
    {
      "name": "07 - Livraison & autres services",
      "description": "DELIVERY_CARGO, freight, rental — même logique dispatch que RIDE."
    },
    {
      "name": "08 - Cartographie",
      "description": "Autocomplete, geocoding, config Mapbox/OSRM."
    },
    {
      "name": "09 - Finance & support",
      "description": "Portefeuille, paiements, notifications, chat, litiges."
    },
    {
      "name": "10 - Admin",
      "description": "Back-office : live map, utilisateurs, config dispatch multi-pays."
    },
    {
      "name": "99 - Autres modules",
      "description": "Endpoints exposés ; certaines actions retournent encore `501 not_implemented`."
    }
  ]
}
```

