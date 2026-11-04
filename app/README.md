# Protocol Explorer — deux bases conservées

**Application utilisée par Coolify :** `app/index.html` + `app/public/`, rendus tels quels par Nginx. Ils ont été restaurés exactement depuis le commit antérieur à la refonte V4, afin de retrouver les animations et l'ergonomie d'origine.

**Expérience expérimentale non déployée :** `app/observatory/index.html` + `app/src/`, laboratoire Vite/TypeScript V3. Ce socle reste disponible pour un travail séparé mais ne doit **pas** remplacer les animations historiques sans tests de comparaison.

## Déploiement principal

Coolify : stratégie Dockerfile, contexte `/`, port interne **80**. Le Dockerfile copie `app/index.html` et `app/public/` dans Nginx ; **aucune compilation front-end** ne modifie les fichiers.

## Développement du laboratoire expérimental

```bash
cd app
npm ci
npm run dev
npm run typecheck
npm test
npm run build
```

Le build Vite expérimental n'est **pas** celui de l'image Docker Coolify. Les tests et captures de ce laboratoire ne certifient pas le rendu classique servi en production.

**Réserve juridique :** les fichiers historiques sont attribués à Dilum Sanjaya ; leurs droits de redistribution ne sont pas démontrés par la licence du dépôt. Voir `../docs/RIGHTS_AND_ATTRIBUTIONS.md`.
