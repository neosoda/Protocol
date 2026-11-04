# Protocol Explorer / Network Observatory

Ce répertoire contient **deux expériences distinctes** :

- `/` : reproduction historique de Protocol Explorer (Dilum Sanjaya), issue de bundles compilés. **Licence/autorisation de redistribution non vérifiée.** Attribution originale conservée.
- `/observatory/` : laboratoire original en Vite + TypeScript ; catalogue de 14 scénarios modélisés, diagramme ladder, topologie logique, inspecteur à champs sélectionnables, moteur DOM-indépendant et thèmes clair/sombre.

## Démarrage

```bash
npm install
npm run dev
npm run typecheck
npm run test
npm run test:e2e
npm run build
```

Node.js 22 ou plus récent. `package-lock.json` historique non synchronisé : régénérer et versionner un lock vérifié avant utilisation de `npm ci`.

## Ce qui n'est pas encore acquis

Aucun test local, Playwright ni audit WCAG instrumenté attesté à ce stade. Les tests couvrant focus clavier, reprise, 18 captures et erreurs console sont **écrits mais non exécutés**. Scénarios de la nouvelle UI en français ; traductions de boutons dans 15 locales avec repli anglais. Les séquences sont **des modèles pédagogiques**, pas des captures. Aucune revendication offline/PWA.

Lire `../docs/RIGHTS_AND_ATTRIBUTIONS.md` (verrou publication), `../docs/RELEASE_GATES.md` (validation obligatoire) et `../PROJECT_HANDOFF.md` (suite).
