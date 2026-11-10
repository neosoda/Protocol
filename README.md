**Langue / Language :** 🇫🇷 **Français** · [🇬🇧 English](README.en.md)

# Network Observatory

**Comprendre les protocoles réseau, paquet par paquet.**

Network Observatory est un laboratoire pédagogique interactif et bilingue (français / anglais). Ses **17 leçons animées** montrent comment les machines communiquent : trajet des paquets, échanges entre équipements et contenu des protocoles, jusqu'aux octets.

![Aperçu de Network Observatory](docs/preview-desktop.png)

## Ce que propose le laboratoire

- **Carte du réseau animée** : visualisation des équipements, des sauts, des diffusions et des pertes de paquets.
- **Diagramme de séquence synchronisé** : chaque échange apparaît au rythme de la simulation.
- **Inspecteur de paquets** : champs décodés, représentation hexadécimale et correspondance interactive entre les deux.
- **Exploration à son rythme** : lecture, pause, pas à pas, vitesse réglable, raccourcis clavier, progression conservée, thèmes clair et sombre.
- **Interface bilingue et responsive** : français et anglais, sur ordinateur comme sur mobile.

## Les 17 leçons

| Domaine | Protocoles |
| --- | --- |
| Fondamentaux | IPv4, ICMP, UDP, TCP |
| Routage dynamique | **RIPv2, OSPFv2, BGP-4** |
| Services réseau | DHCP, DNS |
| Web et sécurité | HTTP, TLS 1.3, HTTPS |
| Messagerie | SMTP, POP3, IMAP |
| Accès distant et transfert | SSH, FTP |

Les trois laboratoires de routage détaillent notamment la **convergence RIP**, les **Hello, LSA et calculs SPF d'OSPF**, ainsi que les **sessions et annonces BGP**. Un [cours de routage avec exercices](docs/LESSONS_ROUTING.md) complète les animations.

Les topologies sont conçues pour expliquer le protocole étudié : pas d'équipement « cœur de réseau » ajouté sans nécessité pédagogique.

## Des paquets construits, pas de simples illustrations

Le moteur construit les paquets **champ par champ**, avec des longueurs, sommes de contrôle et numéros de séquence cohérents. Des tests couvrent notamment IPv4, TCP, UDP, ICMP, DNS, DHCP, TLS, SSH, RIP, OSPF et BGP.

**Périmètre :** les scénarios sont déterministes et volontairement simplifiés pour l'enseignement. Il ne s'agit **ni de captures réseau réelles ni d'un émulateur de routage** : les tables de routage et l'algorithme SPF ne sont pas recalculés en temps réel à partir d'une topologie modifiable.

## Lancer le projet

**Prérequis :** Node.js 22 ou supérieur.

```bash
cd app
npm ci
npm run dev
```

Ouvrir ensuite [http://localhost:5173](http://localhost:5173).

### Vérifier les changements

```bash
cd app
npm run typecheck
npm test
npm run build
```

Les tests navigateur sont séparés : `npm run test:e2e` (nécessite les navigateurs Playwright).

**Technologies :** TypeScript, Vite, SVG, sans framework d'interface ni dépendance d'exécution côté application. Le code est dans [`app/`](app/README.md).

## Déploiement et intégration

- **Coolify / Docker :** utiliser le [Dockerfile](Dockerfile) à la racine, avec le port **80**. La construction exécute les contrôles TypeScript, les tests et la compilation avant de produire une image Nginx. Voir le [guide de déploiement](docs/DEPLOY_COOLIFY.md).
- **Sentinel Campus :** un mode `iframe` accepte un scénario, une langue et un thème, avec des échanges `postMessage` filtrés par origine. Voir le [contrat d'intégration](docs/EMBED_CAMPUS.md).

## Documentation

- [Architecture de l'application et ajout d'une leçon](app/README.md)
- [Cours de routage : RIP, OSPF et BGP](docs/LESSONS_ROUTING.md)
- [Références RFC des protocoles](docs/PROTOCOL_REFERENCES.md)
- [Contrôles avant publication](docs/RELEASE_GATES.md)
- [Licences et attributions](docs/RIGHTS_AND_ATTRIBUTIONS.md)

## Licence et crédits

Projet © 2026 **Neosoda**, publié sous licence [MIT](LICENSE). La police **Inter** est distribuée sous SIL Open Font License 1.1 ; détails et attributions dans [`docs/RIGHTS_AND_ATTRIBUTIONS.md`](docs/RIGHTS_AND_ATTRIBUTIONS.md).
