# Protocol Explorer — design classique restauré

> **Retour au rendu et aux animations d'origine.** La refonte Workbench V4 a été annulée : l'accueil, le moteur d'animation, les styles et les interactions proviennent de la version historique sauvegardée avant la PR #5. **Coolify est conservé**, sans Vercel et sans GitHub Actions.

## État actuel

Le site servi à `/` reprend **exactement** l'ancien `app/index.html` et les fichiers statiques correspondants (`app/public/assets/` : JS animé, CSS, traductions et typographies). Les paquets animés, les cartes protocoles et les vues ont donc leur comportement de référence ; ils ne sont plus remplacés par le laboratoire simplifié de la V4.

Le code expérimental Vite/TypeScript de Network Observatory reste dans `app/src/` et `app/observatory/` pour la recherche et l'évolution future, mais il **n'est pas déployé** par le Dockerfile de production.

## Coolify

- Dépôt : `https://github.com/neosoda/Protocol`
- Branche : `main` après fusion du rollback.
- Stratégie : **Dockerfile** depuis la racine du dépôt.
- Contexte : `/`, emplacement : `Dockerfile`, port exposé : **80**.
- Nginx fournit le HTML et les bundles existants, sans Vite ni serveur Node.
- Santé : `GET /healthz` ; `/observatory/` redirige vers `/`.

Voir le [guide Coolify](docs/DEPLOY_COOLIFY.md). **La fusion Git ne garantit pas le redéploiement de Coolify** : vérifier l'instance et ses logs. Le build Docker et les animations dans un vrai navigateur ne sont pas attestés ici.

## Reprise des améliorations

Conserver les animations d'origine comme *référence non négociable*. Toute future modification doit passer par une comparaison avant/après sur plusieurs protocoles, sur ordinateur et mobile, sans remplacer les animations par des maquettes simplifiées. Consulter le [handoff](PROJECT_HANDOFF.md).

## Origine et droits

La version historique contient l'attribution à [Dilum Sanjaya](https://protocol-explorer-alpha.vercel.app/). Sa présence dans le dépôt ne confirme **pas** les droits de redistribution ou une licence pour les bundles tiers. Il faut clarifier ce point avant toute publication autorisée : [droits et attributions](docs/RIGHTS_AND_ATTRIBUTIONS.md). La licence propre au projet ne couvre que ses contributions originales.
