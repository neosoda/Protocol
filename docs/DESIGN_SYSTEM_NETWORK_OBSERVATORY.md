# Protocol.techsentinel.fr — Identité visuelle

## Nom et signature

Nom affiché : **Protocol.techsentinel.fr** (Protocol en premier plan, .techsentinel.fr plus discret). Adresse : https://protocol.techsentinel.fr/.

Signature : « Les protocoles, paquet par paquet » / “Network protocols, packet by packet”.

Les identifiants machine `network-observatory`, les clés de progression dans localStorage et le canal `postMessage` de Sentinel Campus restent inchangés afin de préserver les intégrations existantes.

## Logo

Le monogramme combine **trois nœuds reliés par une route**, **deux couches superposées** et **un arc d'observation**, dans l'esprit d'un laboratoire réseau.

- Source vectorielle : [`app/public/favicon.svg`](../app/public/favicon.svg).
- En-tête de l'application : `mark` dans `app/src/views/icons.ts`, géométrie identique.
- Illustration horizontale : [`protocol-brand.svg`](protocol-brand.svg).
- Ne pas déformer le symbole ni utiliser de pictogramme réseau générique.

## Palette

| Rôle | Teinte | Hex |
| --- | --- | --- |
| Fond sombre, base du logo | Bleu nuit | `#0B1026` |
| Accent sombre et trajet des paquets | Cyan électrique | `#00E5FF` |
| Données / activité | Turquoise | `#14C8A6` |
| Couches et sécurité | Violet | `#8B5CF6` |
| Fond clair | Blanc froid | `#F8FAFF` |

Le texte et les boutons en thème clair utilisent un cyan assombri `#006C80` afin de conserver le contraste. Les pertes et informations de sécurité ne dépendent pas uniquement de la couleur.

## UI et intégration

- Police **Inter Variable** auto-hébergée et monospace système pour octets et champs réseau.
- Contours fins, panneaux structurés, accents mesurés ; priorité à la lecture et aux animations.
- **Moteur de simulation, paquets, topologies, caméra et intégration Campus inchangés.**
- Compatible thème clair/sombre, mobile et `prefers-reduced-motion`.
- Génération des actifs PNG (icônes et aperçu social) via `cd app && node scripts/brand-assets.mjs` avec un navigateur Playwright Chromium.

Voir [les contrôles de publication](RELEASE_GATES.md).
