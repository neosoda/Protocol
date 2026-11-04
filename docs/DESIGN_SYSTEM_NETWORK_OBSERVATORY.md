# Network Observatory — Signal & Structure

Design system V3 · 4 novembre 2026 · travail en branche `feat/observatory-v3-signal-structure`.

## Positionnement

Un **laboratoire d'observation des protocoles** : la rigueur des outils d'ingénierie réseau, la clarté de la pédagogie, la chaleur mesurée d'un produit éditorial. L'interface doit permettre d'identifier en moins de quelques secondes **l'émetteur, le destinataire, le sens, l'étape active et le champ sélectionné**.

L'identité n'imite ni Wireshark, ni un tableau de bord cyber avec néons, ni une interface SaaS générique. Les données de simulation sont modélisées et jamais présentées comme un chemin découvert ou un dump réel.

## Marque

**Signature :** « Observer. Comprendre. Transmettre. »

Le monogramme représente **deux trajets de signal convergeant vers un point d'observation**. Deux lignes géométriques, trois points, aucun dessin pseudo-technique décoratif. Version vectorielle originale : `app/src/assets/observatory-mark.svg`, reprise dans `app/public/observatory-mark.svg` pour le mode développement. Le pictogramme fonctionne à 24, 40 et 64 px ; la version sur fond sombre est conservée pour une visibilité constante.

Logotype typographique : NETWORK / OBSERVATORY, sans effet chrome ni gradient. Sous-titre pédagogique discret. Mot de liaison / en turquoise.

## Couleurs sémantiques

| Token CSS | Mode clair | Mode sombre | Usage |
|---|---|---|---|
| `--canvas` | `#F3F5F8` | `#101B2D` | Fond global |
| `--surface` | `#FFFFFF` | `#17263C` | Cartes, contrôle, panneaux |
| `--surface-alt` | `#F7F9FC` | `#1D2D44` | Surfaces subordonnées |
| `--ink` | `#101B2D` | `#F4F7FF` | Texte principal |
| `--muted` | `#51627A` | `#B0C0D4` | Légendes |
| `--line` | `#D5DEEA` | `#34455E` | Séparateurs |
| `--brand` | `#345AC5` | `#A5B8FF` | Texte interactif, focus, émetteur |
| `--signal` | `#5279E8` | `#7C9AFF` | Accent identitaire discret |
| `--teal` | `#0B7577` | `#5ADDD4` | Récepteur, retour |
| `--amber` | `#9E5718` | `#FFC486` | Alerte sémantique uniquement |

Les couleurs servent à **renforcer** des états libellés par du texte. Aucune information ne doit dépendre uniquement d'un changement de teinte. Ces valeurs n'établissent pas à elles seules la conformité WCAG ; contrastes et états doivent être mesurés en navigateur.

## Typographie et proportions

- UI : `Avenir Next`, `Segoe UI`, `system-ui` sans téléchargement externe.
- Données réseau et numéros : `IBM Plex Mono` si présent localement, puis `Cascadia Code`, `Consolas`, `ui-monospace`.
- Titres 2,35–4,2 rem avec `clamp`, corps 15 px, description 0,88–1,09 rem.
- Échelle de rythme 4 / 8 / 12 / 16 / 22 / 32 / 48 / 72 px ; lignes de vie non interrompues.
- Rayons de panneaux 14 px, boutons 9 px. Pas de neumorphisme, glassmorphism, blobs dégradés ni cartes uniformément flottantes.
- Ombres faibles seulement pour hiérarchiser une surface réellement surélevée.

## Écrans et parcours

### 1. Découverte / catalogue

Introduction éditoriale et un **mini-échange TCP correct** (SYN → SYN/ACK → ACK), avec un statut explicite de modèle. Recherche immédiate par nom, catégorie, résumé et identifiant : filtrage local, compteur de résultats, état vide, bouton d'effacement, focus conservé. Catégories masquées si aucun protocole correspondant.

Cartes sobres : nom technique identifiable, objectif contextualisé, durée indicative, raccourci d'ouverture. Aucune statistique inventée, aucune fausse donnée télémétrique.

### 2. Laboratoire

L'ordre de lecture est constant : **titre / objectif → transport → topologie et séquence → inspecteur**. Les boutons de contrôle ont une cible minimale de 44 px et des états désactivés. Le même index dans le moteur alimente toutes les vues.

Desktop : topologie et ladder côte à côte. Mobile : panneaux empilés et transport sur plusieurs lignes. La topologie identifie textuellement émetteur/récepteur ; les flèches du ladder expriment la direction logique sans inverser la chronologie sous RTL.

### 3. Inspection

Liste de champs par couche ; contenu et texte explicatif distincts des octets de l'exemple construit. Les octets HEX/ASCII conservent un défilement **local au panneau**, jamais un scroll horizontal de la page. Surlignage seulement pour les plages documentées.

## Accessibilité et interaction

- Clavier : tabulation native, focus visible 3 px, flèches/Home/End sur ladder, retour du focus après re-rendu.
- Réduction du mouvement : `prefers-reduced-motion` neutralise animations et translations.
- Direction RTL : interface hébreu/arabe ; valeurs techniques et graphe gardent leur ordre LTR.
- Inputs lisibles et boutons de taille tactile ; titres hiérarchisés et régions nommées.
- Pas de contraste ou de lecteur d'écran annoncé conforme tant que des tests réels ne sont pas produits.

## QA et critères avant fusion V3

**Non attestés dans l'environnement actuel :** `npm ci` (lockfile obsolète), `typecheck`, tests métier, build, Playwright, captures 390/768/1440 clair/sombre FR/EN/AR, contrôles axe/lecteur d'écran, vérification du build isolé et des licences. Les fichiers de test ont été enrichis, mais ne constituent pas des preuves d'exécution.

N'ajouter ni dépendance UI inutile, ni compilation historique au livrable. Vercel est bloqué via `ignoreCommand` tant que la barrière juridique demeure ouverte. Voir `docs/RIGHTS_AND_ATTRIBUTIONS.md` et `docs/RELEASE_GATES.md`.
