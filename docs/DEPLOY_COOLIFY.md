# Network Observatory — déploiement sur Coolify

Le projet V4 est une application statique Vite : une étape Node compile et teste, puis un conteneur Nginx sert uniquement les fichiers produits. **Pas de serveur Node ni de base de données à maintenir en production.**

## Configuration Coolify

Créer une Application liée au dépôt Git `https://github.com/neosoda/Protocol`.

| Paramètre | Valeur |
|---|---|
| Branche de test | `feat/observatory-v4-workbench` (PR #5 non fusionnée) |
| Build strategy | **Dockerfile** |
| Base Directory / build context | `/` (racine Git) |
| Dockerfile Location | `Dockerfile` |
| Ports Exposes | `80` |
| Domaine | À renseigner dans Coolify |
| Santé | Docker HEALTHCHECK sur `/healthz` |
| Variables / volumes | Aucune nécessité pour ce site statique |

Coolify gère le proxy, le domaine, HTTPS et le cycle de vie du conteneur. Utiliser d'abord **une application de test distincte** de la production ; ne pas changer immédiatement la branche ou le domaine de production. Aucun GitHub Actions ni service Vercel requis.

## Fonctionnement

- `/` sert l'application V4 originale ;
- `/observatory` et `/observatory/` redirigent vers `/` (HTTP 308) ;
- `/assets/*` est servi avec cache immuable (noms versionnés par Vite) ;
- `/healthz` renvoie HTTP 200 pour vérifier Nginx.

Le Dockerfile enchaîne `npm install`, `npm run typecheck`, `npm run test`, `npm run build`. **Une erreur stoppe la construction de l'image.** Le build Vite applique `scripts/verify-build.mjs`, qui refuse les artefacts historiques ; la phase runtime copie uniquement `app/dist/`. Le dossier historique `app/public/` est exclu du contexte Docker par `.dockerignore`.

**Dette à régler :** `app/package-lock.json` est obsolète, d'où l'utilisation transitoire de `npm install`. Il faut régénérer ce lockfile, le versionner, puis passer à `npm ci` pour obtenir des builds reproductibles.

## Critères de déploiement réel

Le nouveau Dockerfile n'a **pas été testé par une compilation complète** dans cet environnement : dépendances npm, tests TypeScript, build Vite, Playwright et rendu visuel restent à vérifier. Avant de basculer une instance publique, tester les écrans 390/768/1440, FR/EN/AR, clair/sombre, clavier et contraste. Vérifier l'absence d'assets historiques dans l'image finale et résoudre leurs droits (voir `docs/RIGHTS_AND_ATTRIBUTIONS.md`).

Une fois les gates validés, fusionner la PR #5 puis pointer l'application de production Coolify sur `main`. **Aucun déploiement Coolify n'est effectué par cette PR.**
