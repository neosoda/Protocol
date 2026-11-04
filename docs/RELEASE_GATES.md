# Network Observatory — release gates V4 Workbench (2026-11-04)

**État : code V4 développé, tests de compilation et d'acceptation encore à valider. Ne pas confondre fusion Git et publication.**

## Entrée et distribution

- Nouvelle entrée root `app/index.html` (application moderne originale), remplaçant les 163 Ko de HTML historique.
- `app/vite.config.ts` construit **seulement** `dist/index.html` et refuse de copier `app/public` pour le build.
- `app/scripts/verify-build.mjs` n'accepte qu'un HTML racine reconnu, les artefacts Vite CSS/JS/SVG, et exactement **un JS moderne**. Il rejette le site historique et les artefacts inattendus.
- Vercel : `/observatory/` réécrit vers `/index.html`. `VERCEL_ENV=preview` autorisé ; **production interdite** par `ignoreCommand` jusqu'à acceptation.

## Vérifications nécessaires, sans GitHub Actions

1. Depuis la racine : `npm --prefix app install`, committer `app/package-lock.json` puis `npm --prefix app ci`.
2. `npm --prefix app run typecheck`, `npm --prefix app run test`, `npm --prefix app run build`. Vercel preview impose ces commandes, sans garantie qu'une preview ait été déclenchée.
3. Tester `/` et `/observatory/` en dev et preview ; vérifier `dist` et absence des bundles tiers.
4. Exécuter `npm --prefix app run test:e2e` avec Chromium ; examiner les 18 captures 390/768/1440 × FR/EN/AR × clair/sombre.
5. Clavier, focus sur menu mobile, recherche, navigation du ladder, lecteur d'écran, zoom 200 %, RTL, reduced motion, contrastes WCAG 2.2 AA.
6. Revue des droits : aucune réutilisation non autorisée de la reproduction historique et de ses ressources.
7. Seulement après preuves, envisager une fusion V4 et débloquer explicitement les builds de production.

## Réalisé vs non vérifié

**Vérifié statiquement :** 85 clés de traduction FR/EN complètes, nouvelle structure rail/moniteur/workbench, HTML root moderne, CSS avec accolades équilibrées, tests de build et E2E ajoutés.

**Non exécuté :** npm ci, typecheck, tests Node du catalogue, Vite, Playwright, visual QA et audits WCAG. Le registre npm reste inaccessible depuis le runtime local. Ces validations ne doivent jamais être annoncées comme réussies par anticipation.

## Statut juridique

L'ancien `app/index.html` a été remplacé, mais des assets historiques peuvent demeurer dans `app/public/` et l'historique Git. Ne pas présumer qu'ils sont libres de droits. Le contrôle Vite exclut `public/` du build, mais une vraie revue de distribution reste nécessaire.
