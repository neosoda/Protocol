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
- Tests Node : **non exécutés**.
- Playwright : **non exécuté**.
- Captures : **non produites**.
- Vérification du lockfile : **non réalisée**.
- Inspection statique des imports et des 14 ID uniques : effectuée pendant la PR #2.
- Focus : correctifs et scénarios Playwright ajoutés dans la branche de durcissement, **à exécuter**.

Ne remplacer ces statuts que par des résultats et des logs d'exécution vérifiables. Pas de CI GitHub Actions pour cette phase ; utiliser un terminal local.
