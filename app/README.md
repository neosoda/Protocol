# Network Observatory — application

Vite + TypeScript, sans framework ni dépendance d’exécution.

## Structure

| Dossier | Rôle |
|---|---|
| `src/model.ts` | Types : scénario, topologie, événement, paquet, couche, champ. Les textes sont bilingues (`{ fr, en }`). |
| `src/packets/` | Encodeurs d’octets. `bytes.ts` (écriture des champs, somme de contrôle RFC 1071), `net.ts` (IPv4, TCP, UDP, ICMP, `TcpFlow` qui tient les numéros de séquence), `app.ts` (DNS, DHCP, NTP, TLS 1.3, SSH, protocoles texte), `routing.ts` (OSPFv2, RIPv2, BGP-4). |
| `src/scenarios/` | Les 17 leçons, regroupées par catégorie. `kit.ts` fournit adresses et topologies communes. |
| `src/engine/player.ts` | Horloge de lecture : chaque événement a un départ, une arrivée et une pause de lecture. |
| `src/views/` | Carte réseau (SVG animé), diagramme de séquence, inspecteur octets ↔ champs, icônes. |
| `src/i18n.ts` | Libellés de l’interface en français et en anglais. |
| `src/ui/styles.css` | Thèmes clair et sombre, mise en page responsive, animations. |
| `public/` | Favicon, icônes, image de partage, manifeste, police Inter. |
| `scripts/` | `verify-build.mjs` (contrôle de l’artefact), `brand-assets.mjs` (génère icônes PNG et `og.png`). |

## Ajouter une leçon

1. Décrire la topologie (nœuds positionnés sur un plan de 1000 × 520, liens).
2. Construire chaque paquet avec les encodeurs : par exemple `flow.send(0, ['PSH', 'ACK'], [lines('http', …)])`.
3. Dessiner uniquement les équipements nécessaires (routeur de transit, point d’accès, serveur, etc.) ; ne pas insérer de cœur de réseau générique.
4. Rédiger titre et explication en français et en anglais.
5. Ajouter le scénario dans `src/scenarios/index.ts`. Les tests vérifient chemins, traductions, sommes de contrôle et bornes des champs.

## Commandes

```bash
npm run dev
npm run typecheck
npm test
npm run build
PW_CHANNEL=msedge node scripts/brand-assets.mjs   # régénérer icônes et og.png
```
