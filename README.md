# openapi-templates

Système de templating YAML pour écrire des contrats OpenAPI 3.1 en ne spécialisant
que le nécessaire. Trois types d'API : **`exposed`** (exposée par mon SI),
**`called`** (définie par moi, exposée par le partenaire), **`events`** (webhooks
poussés vers les partenaires).

Le socle factorise headers communs, codes d'erreur, `StandardErrorObject`,
pagination/tri (page-based, 0-based). Un projet ne fournit que `info`, `servers`,
`tags`, ses `paths` et ses réponses `2xx`, ses `schemas`.

👉 Spécification détaillée : [`SPEC.md`](./SPEC.md).

## Installation & build

```bash
npm install
npm run build                       # construit tous les projets → build/
npm run build:one orders-exposed    # un seul projet
npm run lint                        # valide les sorties (Redocly)
```

## Arborescence

```
templates/core/       # couche 1 — commun à tous
templates/profiles/   # couche 2 — exposed | called | events
projects/<nom>/       # couche 3 — un dossier par API
build/                # sorties générées : <nom>.openapi.yaml
tools/build.mjs       # moteur d'assemblage
```

## Démarrer un nouveau projet

1. Créer `projects/<mon-api>/api.yaml` :

   ```yaml
   type: exposed          # exposed | called | events
   info:
     title: Mon API
     version: 1.0.0
   servers:
     - url: https://api.mon-si.fr/mon-api/v1
   tags:
     - name: ma-ressource
   ```

2. Ajouter ses routes dans `projects/<mon-api>/paths/*.yaml` — ne déclarer que les
   réponses `2xx` (le reste est injecté) :

   ```yaml
   /ma-ressource:
     get:
       tags: [ma-ressource]
       operationId: listRessource
       x-paginated: '#/components/schemas/MaRessource'   # → 200 Page<MaRessource> + page/size/sort
       responses:
         '200': ~
   ```

3. Ajouter ses schémas dans `projects/<mon-api>/schemas/*.yaml` (map de schémas,
   fusionnée dans `components.schemas`).

4. `npm run build:one <mon-api>` → `build/<mon-api>.openapi.yaml`.

Voir les trois projets d'exemple : `orders-exposed`, `partner-payments-called`,
`orders-events`.

## Macros disponibles

| Macro | Effet |
|-------|-------|
| `x-paginated: '#/components/schemas/Item'` | `200` renvoyant `PageOf<Item>` + params `page/size/sort`. |
| `x-errors: [409]` | Ajoute des codes d'erreur à l'opération. |
| `x-no-errors: [429]` | Retire un code d'erreur hérité. |
| `x-event: nom.event` | (events) marqueur documentaire du type d'event. |
