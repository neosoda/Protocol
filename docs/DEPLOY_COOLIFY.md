# Déploiement Coolify

## Application

| Paramètre | Valeur |
|---|---|
| Source | `https://github.com/neosoda/Protocol` |
| Branche | `main` |
| Build Pack | **Dockerfile** |
| Base Directory / Build Context | `/` |
| Dockerfile Location | `Dockerfile` |
| Ports Exposes | `80` |
| Healthcheck | `GET /healthz` (défini dans le Dockerfile) |
| Variables et volumes | Aucun |

## Ce que fait l’image

1. **Étape `build`** (`node:22-alpine`) : `npm ci`, copie des deux README nécessaires aux tests de marque, puis `npm run typecheck`, `npm test` et `npm run build`. Un échec de test ou de type arrête le déploiement. `scripts/verify-build.mjs` refuse tout fichier inattendu dans `dist/`.
2. **Étape finale** (`nginx:stable-alpine`) : copie `app/dist/` et `deploy/nginx.conf`, vérifie la configuration.

## Routes

- `/` : l’application. Les ancres `#/tcp`, `#/dns`… ouvrent une leçon.
- `/assets/*` : JS et CSS versionnés, cache d’un an.
- `/fonts/*` : police Inter, cache de 30 jours.
- `/observatory/` : redirection 308 vers `/`.
- `/healthz` : réponse 200.

## Après un déploiement

1. Statut **Healthy** dans Coolify.
2. Rechargement complet du navigateur : la page affiche « Protocol.techsentinel.fr ».
3. Lancer une leçon (TCP, DNS, TLS 1.3) sur ordinateur et sur mobile.
