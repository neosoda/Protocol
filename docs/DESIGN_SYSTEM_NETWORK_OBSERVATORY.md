# Network Observatory — système visuel

## Marque

Le monogramme montre **deux trajets de signal qui convergent vers un point d’observation** : deux lignes, trois points, sur fond encre `#101B2D`. Source : `app/public/favicon.svg`, repris en ligne dans `app/src/views/icons.ts`. Signature : « Les protocoles d’Internet, paquet par paquet ».

## Couleurs

Jetons définis dans `app/src/ui/styles.css`, en clair et en sombre.

| Rôle | Jeton | Usage |
|---|---|---|
| Fond, surfaces | `--bg`, `--surface`, `--sunken`, `--hover` | Page, panneaux, zones en creux, survol |
| Texte | `--text`, `--text-2`, `--text-3` | Principal, secondaire, légendes |
| Accent | `--accent`, `--accent-soft`, `--ring` | Actions, sélection, focus |
| Tons de paquet | `--tone-control`, `--tone-data`, `--tone-secure`, `--tone-alert`, `--tone-broadcast` | Contrôle (bleu), données (vert), chiffré (violet), perte ou danger (orange), diffusion (cyan) |
| Couches | `--l0` … `--l5` | Une couleur par couche dans l’inspecteur et le dump hexadécimal |

La couleur double toujours une information écrite : libellé du paquet, cadenas des paquets chiffrés, croix et mention « Perdu en route ».

## Typographie

- Interface : Inter (variable, auto-hébergée).
- Données (adresses, octets, champs, libellés de paquets) : police monospace du système (`ui-monospace`, Cascadia Code, SF Mono, Consolas).

## Mouvement

- Le paquet suit le chemin de la topologie avec une courbe d’accélération douce ; une traînée de la couleur du ton se dessine derrière lui.
- À l’arrivée, le nœud destinataire pulse ; l’émetteur respire pendant l’envoi.
- La flèche du diagramme de séquence se trace au même rythme que le paquet.
- Panneaux et cartes entrent avec un léger glissement ; les boutons répondent par un ressort à l’appui.
- `prefers-reduced-motion` : plus d’animation, chaque étape s’affiche directement à l’arrivée.

## Mise en page

- Large (≥ 1280 px) : leçons | scène (carte, séquence, transport) | inspecteur.
- Moyen : la liste des leçons devient un tiroir.
- Étroit (< 900 px) : tout s’empile ; la carte garde un ratio 16:9, la séquence défile.
