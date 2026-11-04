# Release gates — retour au design classique

L'objectif du rollback est de **restituer fidèlement les animations et l'interface d'origine**, sans nouvelle refonte du moteur de visualisation.

## Contrôles statiques effectués

- L'HTML racine correspond exactement au blob `043fb1c6b2ecd3d607cea3ecbfffe617da89903b` de `main` avant la PR #5.
- Les blobs du JavaScript animé `app/public/assets/index-l76eMM6E.js` et du CSS `app/public/assets/index-C1vckX_Q.css` sont inchangés.
- Les scripts `style-switcher.js` et `alternate-style.css` étaient eux aussi inchangés. *(v5 : remplacés par `studio.css` et `skin.js`, les bundles restant intacts.)*
- Les **8 références absolues locales** (`src`/`href`) de `app/index.html` pointent vers des fichiers existants dans `app/public/`.
- `Dockerfile` fournit directement `app/index.html` et `app/public/` avec Nginx, port 80, sans Vite. `/healthz` est conservé.

## Habillage Studio v5

- `index-l76eMM6E.js` et `index-C1vckX_Q.css` restent bit à bit identiques ; `studio.css` est une couche par-dessus.
- Comparer `/?skin=classic` et `/?skin=studio` sur TCP, DNS et HTTPS, sur ordinateur et mobile, en clair et en sombre, et en RTL (arabe et hébreu).
- Vérifier que le canevas `.simulation` est identique dans les deux habillages (couleurs, police, timing).

## Validation encore nécessaire

- Build de l'image Docker sous Coolify et contrôle de l'état de santé.
- HTTP 200 et bonnes réponses MIME pour le HTML, JS, CSS, polices et manifest.
- Captures et animations réelles pour TCP, DNS, TLS/HTTPS sur desktop/mobile ; absence de déformations, sauts ou erreurs JS.
- Vérification du cache après rollback (`index.html` non mis en cache, assets inchangés).
- Vérification des licences : la version historique attribuée à Dilum Sanjaya reste soumise à ses propres droits. Le retour arrière ne vaut pas autorisation de redistribution.

Le laboratoire Vite/TypeScript reste dans le dépôt mais n'est **pas compilé dans l'image Docker**. Ses tests ne prouvent donc rien concernant l'interface classique restaurée.

Pas de GitHub Actions ni de Vercel.
