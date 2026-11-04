# Déploiement Coolify — design classique restauré

La refonte V4 a été annulée pour retrouver les **animations d'origine**. Le service est redevenu un **site statique Nginx** : aucune compilation Vite, installation npm, base de données, variable ni volume requis.

## Application Coolify

| Paramètre | Valeur |
|---|---|
| Source | `https://github.com/neosoda/Protocol` |
| Branche | `main` après fusion du rollback |
| Build Pack | **Dockerfile** |
| Base Directory / Build Context | `/` |
| Dockerfile Location | `Dockerfile` |
| Ports Exposes | `80` |
| Healthcheck | `GET /healthz` via le Dockerfile |
| Variables et volumes | Aucun nécessaire |

Le `Dockerfile` utilise `nginx:stable-alpine`, copie le fichier `app/index.html` historique et l'intégralité de `app/public/` dans `/usr/share/nginx/html/`. Il conserve les mêmes bundles JS/CSS que la version initiale, **sans recompilation**. `.dockerignore` n'exclut plus `app/public/`.

## Routes

- `/` : page historique et ses animations.
- `/assets/*` : JS/CSS, animations, traductions et typographies historiques.
- `/favicon.ico`, `/site.webmanifest`, etc. : fichiers statiques de `app/public/`.
- `/observatory/` : redirection 308 vers `/`.
- `/healthz` : réponse HTTP 200.

Le proxy Coolify s'occupe du domaine et du HTTPS. La configuration Nginx ne doit pas réécrire les liens statiques ni transformer les bundles.

## Vérifications après déploiement

1. Dans Coolify, vérifier que l'application suit bien la branche `main` et qu'un nouveau déploiement est en statut **Healthy** ; aucun déploiement n'a été lancé depuis ChatGPT.
2. Faire un rechargement complet du navigateur ; la racine doit retrouver l'ancienne présentation et non le rail V4.
3. Dans l'onglet Réseau, vérifier HTTP 200 pour `/assets/index-l76eMM6E.js` et `/assets/index-C1vckX_Q.css`, ainsi que l'absence d'erreurs de chargement.
4. Tester plusieurs animations originales (TCP, DNS, TLS/HTTPS), desktop et mobile.
5. Confirmer les droits de publication du contenu historique avec son auteur si nécessaire : voir `RIGHTS_AND_ATTRIBUTIONS.md`.

**QA connue :** le blob historique de l'HTML et les bundles JS/CSS ont des SHA identiques à ceux d'avant PR #5 ; les 8 références statiques absolues repérées dans l'HTML existent. Aucun build Docker ni test des animations dans un vrai navigateur n'a pu être exécuté ici.
