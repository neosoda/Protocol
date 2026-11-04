# Network Observatory — déploiement sur Coolify

Le projet V4 est une application statique Vite : une étape Node compile et teste, puis un conteneur Nginx sert uniquement les fichiers produits. **Pas de serveur Node ni de base de données à maintenir en production.**

## Configuration Coolify

Créer une Application liée au dépôt Git `https://github.com/neosoda/Protocol`.

| Paramètre | Valeur |
|---|---|
| Branche | `main` |
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
- `/observatory` et `/observatory/` redirigent vers `/` (HTTP 308). La cible relative conserve le HTTPS du proxy Coolify ;
- `/assets/*` est servi avec cache immuable (noms versionnés par Vite) ;
- `/healthz` renvoie HTTP 200 pour vérifier Nginx.

Le Dockerfile enchaîne `npm ci --include=dev`, `npm run typecheck`, `npm run test` et `npm run build`. **Une erreur stoppe la construction de l'image.** Le build Vite applique `scripts/verify-build.mjs`, qui refuse les artefacts historiques. La phase runtime copie `app/dist/`. Le dossier historique `app/public/` est exclu du contexte Docker par `.dockerignore`.

## Critères de déploiement réel

Vérifier que `/healthz` et `/` répondent sur le domaine public et que `/observatory/` redirige vers la racine du même domaine en HTTPS. Avant de basculer une instance publique, tester les écrans 390/768/1440, FR/EN/AR, clair/sombre, clavier et contraste. Vérifier l'absence d'assets historiques dans l'image finale et résoudre leurs droits (voir `docs/RIGHTS_AND_ATTRIBUTIONS.md`).
