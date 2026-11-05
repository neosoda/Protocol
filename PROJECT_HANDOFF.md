# PROJECT HANDOFF — Network Observatory v6 (2026-11-04)

## État

Branche `main`. L’application servie à `/` est **entièrement écrite pour ce projet** : moteur de lecture, 14 leçons bilingues (FR/EN), paquets encodés octet par octet, carte réseau animée, diagramme de séquence, inspecteur, icônes et image de partage. Plus aucun fichier précompilé ni ressource d’un autre site dans l’arbre.

- Entrée : `app/index.html` → `app/src/main.ts` (Vite).
- Langues : français et anglais uniquement (choix du propriétaire).
- Ancien laboratoire `/observatory/` supprimé ; l’URL redirige vers `/`.
- Docker : build Node 22 (typecheck, tests, build) puis Nginx. Voir `docs/DEPLOY_COOLIFY.md`.

## Mise en scène (v6.1)

- **Équipements illustrés** en volume (projection oblique), dessinés dans `app/src/views/devices.ts` : ordinateur, box, nuage, serveurs (badge DNS ou courrier), téléphone, point d'accès Wi-Fi. Diodes qui clignotent à l'envoi, rebond et onde à l'arrivée.
- **Caméra** : la scène s'ouvre zoomée sur l'émetteur, les équipements apparaissent quand un paquet les atteint et la vue s'élargit en douceur (`TopologyView.reveal`).
- **Paquets en étiquettes** : protocole, message, ports ; cadenas pour le chiffré ; chute barrée pour une perte.
- **Journal des paquets** (`app/src/views/log.ts`) qui se remplit en direct, avec numéros de séquence relatifs et résumé par protocole (`app/src/views/summary.ts`).
- **Séquence** : flèches dont la pente suit le nombre de sauts, libellés le long des flèches, horodatage simulé.
- Vue par défaut : Réseau.

## Vérifié

- `npm run typecheck`, `npm test` (21 tests), `npm run build` + contrôle d’artefact : OK en local.
- Navigateur (serveur Vite) : ordinateur 1440 × 900 et mobile 375 × 812, clair et sombre ; TCP (perte et retransmission), DNS, DHCP (diffusion), TLS 1.3, HTTP (lien champ ↔ octets) ; pas d’erreur console, pas de défilement horizontal.

## Non vérifié

- Build de l’image Docker (Docker absent du poste) et déploiement Coolify.
- Parcours complet de chaque leçon dans les deux langues ; Safari et Firefox.
- Audit d’accessibilité outillé (contrastes mesurés, lecteur d’écran).

## Suite possible

- Tests de bout en bout Playwright (`app/tests/e2e/`, configuration présente).
- Leçons supplémentaires (ARP, IPv6, QUIC/HTTP3, WebSocket) avec les mêmes encodeurs.

## V7 — Lot 0 (branche `feat/v7-lot0-stabilization`, 2026-11-05)

Base : `main` @ `a0b5524e91bc452812556e890b275820434813b0`.

Implémenté sur cette branche : recherche FR/EN insensible aux accents et filtrage par catégorie pour les 14 leçons ; désélection corrigée dans l'inspecteur HEX ; contrôles E2E couvrant recherche, paquets perdus TCP, correspondance champs/octets et mouvement réel ; script local de capture visuelle en six configurations et cinq protocoles.

**Validations restantes / blocages :** aucun test npm, typecheck, build, Playwright ou Docker ni capture baseline V7 n'a été exécuté dans cet environnement ; l'accès réseau sortant à GitHub depuis le conteneur est indisponible. Ne pas fusionner avant d'exécuter et réussir les contrôles de `docs/RELEASE_GATES.md` et d'inspecter les animations sans réduction du mouvement.

**Reprise :** lancer les commandes documentées, corriger les échecs, comparer captures avant/après TCP, DNS, DHCP, HTTP et TLS sur desktop/tablette/mobile, puis fusionner la PR si tous les critères passent. Ensuite, lot 1 UX/UI puis lot 2 moteur de simulation déterministe avec paquets réellement reconstruits. Déploiement Coolify : non déclenché.
