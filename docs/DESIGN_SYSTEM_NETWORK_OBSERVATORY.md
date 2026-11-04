# Network Observatory — design system v0.1

## Intention

Instrument pédagogique, pas cockpit décoratif. Une seule sélection de paquet doit expliquer **qui parle, à qui, à quel moment et pourquoi**. Le réseau reste le sujet principal ; la marque s'efface au profit de l'observation.

## Tokens

| Token | Clair | Sombre | Rôle |
|---|---|---|---|
| `--canvas` | `#F5F7FB` | `#0C1424` | Fond |
| `--surface` | `#FFFFFF` | `#142033` | Panneaux |
| `--surface-alt` | `#EFF3FA` | `#1B2940` | États et encarts |
| `--ink` | `#152238` | `#F3F7FF` | Texte principal |
| `--muted` | `#4B5871` | `#AEBBD0` | Texte secondaire |
| `--line` | `#CBD5E4` | `#43536B` | Séparateurs |
| `--brand` | `#2859DE` | `#81A1FF` | Sélection / focus |
| `--teal` | `#087C83` | `#61D3D6` | Réponse / retour |
| `--amber` | `#9D4A12` | `#F5B16D` | Alerte signifiante |

Typographie : `system-ui` pour l'interface, `ui-monospace` uniquement pour identifiants, adresses, ports, octets et horodatages. Pas de dépendance aux polices héritées. Espacement : échelle 4/8/12/16/24/32 ; rayons : 8/12/16 ; ombres : seulement pour distinguer surfaces superposées ; motion : transitions de 140 ms et respect strict de `prefers-reduced-motion`.

## Composants et règles

- **Barre d'instrumentation** : marque originale à deux trajets convergents ; titre, mode, langue et thème explicites.
- **Catalogue** : catégories et protocoles présentés en liste dense avec durée *estimée*, objectif précis et CTA direct. Pas de durée scientifiquement mesurée.
- **Simulation** : topologie et séquence visibles côte à côte sur grand écran, empilées sur mobile ; sélection identique partout.
- **Événement** : numéro, direction (flèche + texte), nom, intention. Couleur jamais seule pour identifier le sens.
- **Inspecteur** : hiérarchie par couche ; distinction « données modélisées » vs « octets d'exemple ». Ne jamais représenter un champ comme une capture Wireshark réelle.
- **Contrôles** : vrais boutons avec état désactivé et focus visible ; vitesse étiquetée ; pause pendant changement de protocole.
- **Thèmes** : sémantique stable, contrastes à mesurer dans le navigateur, aucune opacité qui compromet le texte.

## Breakpoints et critères de test

- `<= 680px` : panneaux séquentiels, boutons tactiles au moins 44px, absence de défilement horizontal de la page.
- `681–1050px` : catalogue fluide et panneaux empilés.
- `>= 1051px` : topologie et séquence côte à côte, inspecteur sous les vues.
- Cibles : captures 390/768/1440 px, FR/EN/AR, clair/sombre, focus clavier ; évaluations **à effectuer**, pas présumées conformes.

## Choix retenus et limites

Démarrage prudent en page distincte `/observatory/` afin de conserver le produit historique disponible pour comparer les 14 protocoles et 15 langues. La nouvelle interface est un **prototype fonctionnel de migration**, pas encore remplaçant de production. Les traductions du récit pédagogique et les captures réseau réelles restent à approfondir.
