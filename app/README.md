# Protocol Explorer / Network Observatory

Ce répertoire contient **deux expériences distinctes** :

- `/` : **nouvelle application moderne originale V4 Workbench**, qui remplace le HTML historique dans le projet courant. L'ancienne version reste dans l'historique Git, et des ressources héritées peuvent encore exister sous `app/public/` en développement (non distribuées).
- `/observatory/` : chemin de compatibilité en dev et rewrite Vercel du laboratoire original en Vite + TypeScript ; catalogue de 14 scénarios modélisés, diagramme ladder, topologie logique, inspecteur à champs sélectionnables, moteur DOM-indépendant et thèmes clair/sombre.

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

Le serveur **de développement** sert le laboratoire moderne à `/` ainsi qu'à `/observatory/`. La commande `npm run build` ne compile que l'entrée moderne `/`, désactive la copie automatique de `public/` et lance `scripts/verify-build.mjs`. Le résultat de ce build n'a pas été vérifié dans l'environnement actuel (npm indisponible). La publication de l'historique reste interdite tant que ses droits ne sont pas clarifiés.

Les quatre tests autonomes du garde-fou ont été exécutés avec succès sur des copies identiques aux sources poussées. Cela ne valide ni TypeScript, ni les scénarios, ni l'accessibilité, ni les tests navigateur. Consulter `../PROJECT_HANDOFF.md`.

Le scénario SSH comporte maintenant 14 événements modélisés et l'exemple HTTP/1.1 annonce un `Content-Length` cohérent avec son corps. Les contrôles d'exactitude ont été écrits mais ne sont pas encore passés par le runner du dépôt. Les nouvelles progressions sont enregistrées par ID d'événement (reprise des anciens index acceptée).

## V3 / Signal & Structure

Branche `feat/observatory-v3-signal-structure` : feuilles de style refactorisées, nouvelle marque vectorielle, interface de recherche locale dans le catalogue, messages FR/EN avec repli anglais sur les 13 autres langues. Des tests E2E complémentaires existent mais **ne sont pas exécutés** dans l'environnement actuel. Voir `../docs/DESIGN_SYSTEM_NETWORK_OBSERVATORY.md` et le début du handoff.

## V4 Workbench — changement structurel

La V4 introduit une barre latérale de navigation, un grand moniteur de TCP en SVG original, un catalogue indexé et un laboratoire en **diagramme de séquence principal + topologie et inspecteur latéraux**. Nouveau monogramme N/O, palette ivoire/corail/encre, menu mobile. Voir `../docs/DESIGN_SYSTEM_NETWORK_OBSERVATORY.md`.

**Statut :** sources poussées, pas de build local complet ; `package-lock.json` doit être régénéré. Les previews Vercel sont désormais autorisées avec gates TypeScript + Node + Vite, mais la production reste bloquée. N'interprétez pas une fusion Git comme un déploiement du site.

**Preuve partielle V4 :** 5/5 tests autonomes du nouveau `verify-build` ont réussi sous Node, avec correspondance stricte des SHA de blobs GitHub. Il ne s'agit pas d'un build Vite ni de tests Playwright. PR [#5](https://github.com/neosoda/Protocol/pull/5) ouverte en brouillon.
