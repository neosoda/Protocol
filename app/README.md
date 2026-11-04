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

Seuls les quatre tests Node autonomes du garde-fou de build ont été exécutés et réussis. Aucun test métier local complet, Playwright ni audit WCAG instrumenté attesté à ce stade. Les tests couvrant focus clavier, reprise, 18 captures et erreurs console sont **écrits mais non exécutés**. Récits pédagogiques encore en français ; interface principale localisée en FR/EN et libellés partiels dans 13 autres locales avec repli anglais. Les séquences sont **des modèles pédagogiques**, pas des captures. Aucune revendication offline/PWA.

Lire `../docs/RIGHTS_AND_ATTRIBUTIONS.md` (verrou publication), `../docs/RELEASE_GATES.md` (validation obligatoire) et `../PROJECT_HANDOFF.md` (suite).

## Isolation du build moderne (PR #3)

Le serveur **de développement** conserve `/` et ses ressources historiques pour consultation locale. La commande **de production** `npm run build` ne compile que `/observatory/`, désactive la copie automatique de `public/` et lance `scripts/verify-build.mjs`. Le résultat de ce build n'a pas été vérifié dans l'environnement actuel (npm indisponible). La publication de l'historique reste interdite tant que ses droits ne sont pas clarifiés.

Les quatre tests autonomes du garde-fou ont été exécutés avec succès sur des copies identiques aux sources poussées. Cela ne valide ni TypeScript, ni les scénarios, ni l'accessibilité, ni les tests navigateur. Consulter `../PROJECT_HANDOFF.md`.

Le scénario SSH comporte maintenant 14 événements modélisés et l'exemple HTTP/1.1 annonce un `Content-Length` cohérent avec son corps. Les contrôles d'exactitude ont été écrits mais ne sont pas encore passés par le runner du dépôt. Les nouvelles progressions sont enregistrées par ID d'événement (reprise des anciens index acceptée).

## V3 / Signal & Structure

Branche `feat/observatory-v3-signal-structure` : feuilles de style refactorisées, nouvelle marque vectorielle, interface de recherche locale dans le catalogue, messages FR/EN avec repli anglais sur les 13 autres langues. Des tests E2E complémentaires existent mais **ne sont pas exécutés** dans l'environnement actuel. Voir `../docs/DESIGN_SYSTEM_NETWORK_OBSERVATORY.md` et le début du handoff.
