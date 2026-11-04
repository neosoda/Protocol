# PROJECT HANDOFF — Protocol Explorer / Network Observatory

**Base vérifiée :** `main` @ `4daf177d22bd1c5c83a9a3d342e7e98a8bbb275d` (04/11/2026).
**Branche :** `feat/network-observatory-foundation`.
**Ne pas fusionner automatiquement.**

## Objectif

Remplacer progressivement la reproduction historique, sous réserve de droits, par une application originale Vite + TypeScript (« Network Observatory »), pédagogique et maintenable.

## Documents de référence

- `docs/AUDIT_2026-11-04.md` : risques, preuves, priorités, validations attendues.
- `docs/RIGHTS_AND_ATTRIBUTIONS.md` : **verrou P0 de redistribution**.
- `docs/DESIGN_SYSTEM_NETWORK_OBSERVATORY.md` : direction UX et tokens.

## Décisions

1. Pas de modification des bundles tiers historiques ni suppression de leur attribution.
2. Nouveau parcours parallèle `/observatory/` ; root historique conservé tant qu'aucune parité n'est prouvée.
3. Une unique machine à états pour les événements ; vues topologie, séquence et inspection dérivées du même index.
4. Scénarios **modélisés**, pas trafic réel ; hex uniquement sur des octets d'exemple réellement fournis.
5. Pas de revendication offline/PWA ou WCAG AA avant vérification.

## Statuts et suites

- [x] Inspection de l'arbre et documentation ; risques juridiques et techniques documentés.
- [x] Direction et tokens du design system définis.
- [ ] Confirmation des droits avec Dilum Sanjaya ou retrait complet des éléments non autorisés avant diffusion.
- [ ] Comparaison navigateur du produit historique par protocole, langue et action.
- [ ] Scénarios complets et vérifiés techniquement pour les 14 protocoles (références RFC et tests par champ).
- [ ] Traductions pédagogiques intégrales dans les 15 langues, RTL compris, avec relecture.
- [ ] Captures avant/après à 390, 768, 1440 px, FR/EN/AR, clair/sombre.
- [ ] Tests moteur, `tsc`, build, Playwright, accessibilité clavier/contrastes, console et CSP en local.
- [ ] Vérifier manifest/icônes, URLs OG, PWA/offline avant tout changement de revendication.
- [ ] Revue des dépendances et licences avant une PR non draft ou un déploiement.

## Procédure reproductible (à exécuter)

```bash
npm --prefix app install
npm --prefix app run typecheck
npm --prefix app run test
npm --prefix app run build
npm --prefix app run dev
```

Inspecter ensuite `/observatory/` sur `http://localhost:5173` et comparer avec `/`.

**Remarque :** les tests et captures ne peuvent être considérés « OK » qu'après un journal réel de leur exécution. Ce document doit être mis à jour à chaque lot.
