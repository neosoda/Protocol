# Network Observatory — critères de validation et livraison

**État actuel : alpha de migration. Aucun déploiement ni redistribution n'est autorisé tant que les critères suivants ne sont pas clôturés.**

## Vérifications techniques obligatoires

1. Installer les dépendances sur une machine disposant du réseau, avec Node.js >= 22.
2. Régénérer et committer `app/package-lock.json` après `npm --prefix app install`.
3. Vérifier `npm --prefix app ci`.
4. Exécuter `npm --prefix app run typecheck`, `test`, `build`, `test:e2e` (Chromium Playwright préalablement installé).
5. Exécuter et documenter les vérifications en **dev et build de production** sur `/observatory/`.
6. Vérifier la navigation clavier, la gestion du focus, la restitution lecteur d'écran, le RTL, le contraste WCAG 2.2 AA et `prefers-reduced-motion`.
7. Examiner les 18 captures ciblées (390/768/1440 × clair/sombre × FR/EN/AR), absence de scroll horizontal et erreurs console.
8. Compléter la validation RFC des 14 protocoles, y compris simplifications et représentation des octets.

## Verrou juridique — bloquant à lui seul

Lire `docs/RIGHTS_AND_ATTRIBUTIONS.md`. L'application historique, ses bundles, traductions, styles et autres ressources potentiellement dérivées du Protocol Explorer de Dilum Sanjaya doivent être **explicitement autorisés** ou **totalement exclus de la distribution**. Le code nouvellement écrit ne légitime pas les composants historiques.

Une fusion Git dans `main` n'est **pas** une autorisation de publication. Conserver les attributions existantes tant que les ressources restent dans l'arbre. Éviter toute publication automatique depuis `main` avant régularisation du contenu déployé.

## Journal réel

- Compilation TypeScript : **non exécutée**.
- Tests Node métier du catalogue : **non exécutés**. Quatre tests autonomes du garde-fou de build ont été exécutés et réussis.
- Playwright : **non exécuté**.
- Captures : **non produites**.
- Vérification du lockfile : **non réalisée**.
- Inspection statique des imports et des 14 ID uniques : effectuée pendant la PR #2.
- Focus : correctifs et scénarios Playwright ajoutés dans la branche de durcissement, **à exécuter**.

Ne remplacer ces statuts que par des résultats et des logs d'exécution vérifiables. Pas de CI GitHub Actions pour cette phase ; utiliser un terminal local.

## Stabilisation PR #3 — contrôle provisoire du 04/11/2026

**Correction de livraison poussée, non validée en build :** la configuration Vite exclut maintenant l'entrée historique et désactive la copie de `app/public/` en production. L'icône originale de l'Observatory est importée par `app/observatory/index.html`. Le script `app/scripts/verify-build.mjs` échoue si `dist` contient une entrée racine historique, des fichiers inattendus ou plusieurs bundles JavaScript.

**Preuve réellement obtenue :** les quatre tests indépendants de `verify-build` passent sur une copie strictement identique aux blobs de la PR #3 (SHA Git vérifiés, Node 22.16.0). Cela **ne prouve pas** que Vite a produit un artefact conforme. `npm view vite version` échoue avec `EAI_AGAIN` sur `registry.npmjs.org`, et `git ls-remote` échoue sur la résolution de `github.com` : impossible de cloner ou d'installer la suite complète dans cet environnement.

En production, l'URL racine `/` **ne doit plus servir le site historique** ; vérifier cette propriété sur un vrai build avant une éventuelle fusion. Les fichiers historiques demeurent dans le dépôt et restent soumis à leurs droits ; l'absence de ces fichiers dans une distribution à vérifier ne constitue pas une licence pour le reste.

**État de décision :** `npm ci`, `typecheck`, tests métier, build, Playwright, captures et conformité restent **NON VÉRIFIÉS**. Lockfile **NON synchronisé**. PR #3 **ouverte en brouillon**, sans fusion ni publication. Les captures doivent être examinées et conservées comme preuves avant toute déclaration de qualité.

## Lot suivant du 4 novembre — données et accessibilité

Les libellés de panneaux, les rôles de topologie et les messages de l'inspecteur disposent d'une version FR/EN complète pour 69 clés UI, avec repli des autres langues. Des contrôles **statiques** ont vérifié les clés, la longueur HTTP et 14 identifiants SSH ; nouveaux tests d'invariants et E2E ajoutés **mais non exécutés**. L'absence de données capturées et les simplifications RFC restent explicites.

**Aucune évolution des critères de fusion :** lockfile et validations npm/Vite/Playwright/production encore bloqués ; droits historiques non résolus. PR #3 ouverte en brouillon, aucune fusion ni publication.

## V3 Signal & Structure — points supplémentaires à vérifier

- Recherche par protocole/catégorie, état vide, effacement et focus après interaction.
- 78 libellés FR/EN vérifiés statiquement, mais pas en navigateur ni par lecteur d'écran.
- Remplacement complet de la feuille CSS : inspecter les régressions éventuelles sur boutons, cartes, émetteur/récepteur, ladder, HEX, modes, thèmes, RTL et largeur 390 px.
- Logo src/public cohérent ; `vercel.json` garde `ignoreCommand` renvoyant 0 jusqu'à déblocage juridique.
- **Aucune validation npm/Playwright ou WCAG attestée.** La PR #3 fusionnée reste historiquement non testée ; la PR V3 doit rester non fusionnée.
