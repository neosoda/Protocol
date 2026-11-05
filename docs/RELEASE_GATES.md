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

## V7 — baseline des animations et contrôles E2E

La baseline V7 doit être **capturée et examinée localement avant fusion**. Dans un premier terminal :

```bash
cd app
npm ci
npm run dev -- --host 127.0.0.1 --port 5199
```

Dans un second terminal :

```bash
cd app
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm run baseline:capture
```

Le script capture TCP (perte/retransmission), DNS, DHCP (diffusion), HTTP (inspection) et TLS aux formats desktop 1440×900, tablette 768×1024, mobile 390×844, en clair et sombre. Les images et SHA-256 vont dans `docs/baselines/v7/`. Ces captures sont des **états statiques** avec mouvements réduits, pas une validation complète de l'animation.

Examiner séparément, en mouvement normal, les trajectoires et effets SVG, proportions et illustrations, mouvements de caméra et synchronisation réseau/séquence/inspecteur. Le test `motion.spec.ts` vérifie que les paquets se déplacent encore en lecture normale.

Aucune validation V7 n'est annoncée réussie sans exécution réelle. Les captures restent **à produire**.
