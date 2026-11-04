# PROJECT HANDOFF — Network Observatory (2026-11-04)

## Références Git

- Dépôt : `neosoda/Protocol`
- `main` au départ : `cebc6049d34d7856ddfe5eec967b6c7ba5816de3` (PR #1 fusionnée).
- Branche de continuation : `feat/network-observatory-v2-consolidation`
- PR : [#2](https://github.com/neosoda/Protocol/pull/2), **en brouillon, ne pas fusionner automatiquement**.
- Nouvelle application : `/observatory/`. Historique : `/`.

## Acquis confirmés par inspection des sources et commits (pas par navigateur)

1. L'architecture Vite/TypeScript, le catalogue original à 14 protocoles et le moteur indépendant du DOM de la PR #1 restent en place.
2. Le diagramme de séquence est désormais un **ladder** : participants, lignes de vie, flèches chronologiques, boutons de sélection et événement actif. Code : `app/src/visualizations/sequence.ts`.
3. La topologie distingue graphiquement les rôles, émission/réception et trajet de l'événement. Il s'agit **d'un chemin logique modélisé**, pas de liens réseau réellement détectés. Code : `app/src/visualizations/topology.ts`.
4. Inspecteur : sélection de champs par couche, explication contextuelle et surlignage d'octets **seulement lorsqu'une plage dans l'exemple textuel UTF-8 est explicitement définie et dans ses limites**. Première correspondance : « GET » dans l'exemple HTTP/1.1. Pas d'en-têtes binaires inventés.
5. TLS 1.3 : séparation des étapes EncryptedExtensions, Certificate/CertificateVerify, Finished serveur et client. HTTPS : attente du Finished client avant la requête. Sources : `docs/PROTOCOL_REFERENCES.md`.
6. Tests `app/tests/protocol-invariants.test.ts` ajoutés ; E2E actualisés, avec parcours des contrôles, reprise, RTL et matrice de **18 captures prévues** (3 tailles × 2 thèmes × 3 langues).

## Validations / statuts rigoureux

| Contrôle | Statut |
|---|---|
| Commit `main` et PR #1 | Vérifiés par GitHub |
| Branche V2 et commits de code | Poussés sur GitHub ; imports TypeScript relatifs vérifiés statiquement (aucun fichier manquant), 14 IDs uniques |
| Lecture du catalogue, fichiers sources, droit et handoff | Effectuée |
| Revue RFC TCP/DHCP/TLS/HTTP | Ciblée ; non exhaustive |
| Installation `npm install` et génération `package-lock.json` | **BLOQUÉES** : accès DNS/registry indisponible dans l'environnement d'exécution ; lock actuel obsolète |
| Typecheck, tests unitaires, build, Playwright | **NON exécutés** : aucune copie exécutable du dépôt ni dépendances installables localement |
| Captures 390/768/1440 FR/EN/AR et thèmes | **Non produites** ; scripts écrits seulement |
| Contrastes, clavier, lecteur d'écran, responsive, performance | Non vérifiés en navigateur |
| Traductions des récits (15 langues) | À faire ; interface partiellement localisée seulement |
| Rights & redistributabilité de l'historique | **P0 bloquant**, documentation inchangée, autorisation non confirmée |

## Étapes de reprise prioritaires

1. Dans un clone local, Node 22+ et npm opérationnels : `npm --prefix app install`, **committer le package-lock régénéré**, puis `npm --prefix app ci`.
2. Exécuter `npm --prefix app run typecheck`, `test`, `build`, puis installer Chromium et lancer `test:e2e`. Corriger **tout** échec ; ne pas utiliser GitHub Actions.
3. Valider `/observatory/` en dev et après `vite preview`. Vérifier console, URL de base, sans scroll horizontal ; FR/EN/AR, 390/768/1440 px, modes et thèmes.
4. Tester l'accessibilité clavier et lecteurs d'écran, focus des champs re-rendus, réductions de mouvement, contrastes AA. Vérifier en particulier les libellés encore en français dans les 15 locales.
5. Compléter les réponses et causations DNS/SMTP/IMAP/FTP/SSH ; revue RFC exhaustive et tests d'invariants.
6. Traiter le **P0 juridique** : obtenir une permission explicite pour les ressources historiques ou les retirer de tout livrable distribué ; ne jamais supprimer silencieusement leur attribution.

## Reproduction locale attendue

```bash
npm --prefix app install
npm --prefix app ci
npm --prefix app run typecheck
npm --prefix app run test
npm --prefix app run build
npx --prefix app playwright install chromium
npm --prefix app run test:e2e
npm --prefix app run dev
```

Ne déclarer aucun succès sans logs réels. Conserver la PR V2 en **draft** jusqu'à preuves de qualité et clarification des droits. Les modules TypeScript ajoutés ne suffisent pas à garantir la parité avec le site historique.

## Références

- `docs/AUDIT_2026-11-04.md`
- `docs/DESIGN_SYSTEM_NETWORK_OBSERVATORY.md`
- `docs/PROTOCOL_REFERENCES.md`
- `docs/RIGHTS_AND_ATTRIBUTIONS.md`
