# Contrôles avant mise en production

## Automatiques (bloquants dans l’image Docker)

- `npm run typecheck` : TypeScript strict, sans erreur.
- `npm test` : sommes de contrôle IP/TCP/UDP/ICMP, numéros TCP, DNS, DHCP, TLS, SSH, chemins des topologies, textes FR/EN complets, horloge de lecture, contrôle de l’artefact.
- `npm run build` puis `scripts/verify-build.mjs` : un seul bundle JS, uniquement les fichiers attendus.

## Manuels

- Parcourir au moins TCP, DNS, DHCP (diffusion), TLS 1.3 (chiffré) et UDP (perte) : animation fluide, carte, séquence et inspecteur synchronisés.
- Ordinateur (1440 × 900) et mobile (375 × 812), thèmes clair et sombre, français et anglais.
- Pas de défilement horizontal de la page, pas d’erreur dans la console.
- Clavier : Espace, ← →, 1 2 3, Échap ; focus visible.
- `prefers-reduced-motion` : les étapes s’affichent sans animation.
