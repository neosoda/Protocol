# PROJECT HANDOFF — Network Observatory v6 (2026-11-04)

## État

Branche `feat/original-v6`. L’application servie à `/` est **entièrement écrite pour ce projet** : moteur de lecture, 14 leçons bilingues (FR/EN), paquets encodés octet par octet, carte réseau animée, diagramme de séquence, inspecteur, icônes et image de partage. Plus aucun fichier précompilé ni ressource d’un autre site dans l’arbre.

- Entrée : `app/index.html` → `app/src/main.ts` (Vite).
- Langues : français et anglais uniquement (choix du propriétaire).
- Ancien laboratoire `/observatory/` supprimé ; l’URL redirige vers `/`.
- Docker : build Node 22 (typecheck, tests, build) puis Nginx. Voir `docs/DEPLOY_COOLIFY.md`.

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
