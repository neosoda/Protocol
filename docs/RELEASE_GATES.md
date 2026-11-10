# Contrôles avant mise en production

## Automatiques (bloquants dans l’image Docker)

- `npm run typecheck` : TypeScript strict, sans erreur.
- `npm test` : sommes de contrôle IP/TCP/UDP/ICMP/OSPF, checksum Fletcher des LSA, formats RIP/BGP, numéros TCP, DNS, DHCP, TLS, SSH, chemins des topologies, textes FR/EN complets, horloge de lecture, contrôle de l’artefact.
- `npm run build` puis `scripts/verify-build.mjs` : un seul bundle JS, uniquement les fichiers attendus.

## Manuels

- Parcourir RIPv2 (annonce puis métrique 16), OSPFv2 (Hello/DBD/LSR/LSU/LSAck + SPF), BGP-4 (SYN/OPEN/KEEPALIVE/UPDATE/WITHDRAW) avec le journal, la carte, la vue séquence, les champs et les octets. Vérifier la topologie sans « cœur » arbitraire, les routeurs Ethernet et les changements de taille de la caméra.
- Parcourir au moins TCP, DNS, DHCP (diffusion), TLS 1.3 (chiffré) et UDP (perte) : animation fluide, carte, séquence et inspecteur synchronisés.
- Vérifier RIP, OSPF et BGP en lecture normale (pas seulement en reduced-motion) ; ne pas valider une animation uniquement sur les tests statiques.
- Ordinateur (1440 × 900) et mobile (375 × 812), thèmes clair et sombre, français et anglais.
- Pas de défilement horizontal de la page, pas d’erreur dans la console.
- Clavier : Espace, ← →, 1 2 3, Échap ; focus visible.
- `prefers-reduced-motion` : les étapes s’affichent sans animation.
