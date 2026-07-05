# Templates du socle

Couches assemblées par `tools/build.mjs` (voir `../SPEC.md`) :

- **`core/`** — couche 1, commune à tous les types : squelette OpenAPI, headers de
  requête/réponse, catalogue d'erreurs, `StandardErrorObject`, pagination/tri.
- **`profiles/`** — couche 2, une par type : `exposed`, `called`, `events`.

Un projet (couche 3, dans `../projects/<nom>/`) ne fournit que : `type`, `info`,
`servers`, `tags`, ses `paths` et ses réponses `2xx`, ses `schemas`.

## Ce que le build injecte automatiquement

| Élément | Règle |
|---------|-------|
| Headers de requête communs | `X-Request-Id`, `X-Correlation-Id`, `X-Institution-Id`, `X-User-Id`, `X-UserContext-Id` sur chaque opération. |
| `X-Processing-Route-Id` | requête : `called` + `events`. Réponse : tous. |
| `Idempotency-Key` | obligatoire POST/PATCH, optionnel PUT/DELETE. |
| Headers de réponse | écho (optionnels) + `X-Processing-Route-Id` sur chaque réponse. |
| Erreurs | `ERRORS_ALWAYS` partout ; `404` si param de path ; `409` si écriture ; `415`/`422` si `requestBody`. |
| Pagination/tri | via macro `x-paginated`. |
| Headers d'event | `events` : `X-Event-Id/Type/Version` + livraison + traçabilité d'origine. |

## Macros (extensions `x-*`)

- `x-paginated: '#/components/schemas/Item'` → `200` renvoyant `PageOf<Item>` + `page/size/sort`.
- `x-errors: [409]` / `x-no-errors: [429]` → ajuste le catalogue d'erreurs de l'opération.
- `x-event: nom.event` → (events) marqueur documentaire du type d'event.

## Build

```bash
npm install
npm run build                       # tous les projets → ../build/
npm run build:one orders-exposed    # un seul projet
```
