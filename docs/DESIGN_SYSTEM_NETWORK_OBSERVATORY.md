# Network Observatory — Workbench V4

**Une vraie refonte UX/UI, pas une V3 recolorée.** Direction : carnet de laboratoire et instrument de traces réseau. 4 novembre 2026. Branche : `feat/observatory-v4-workbench`.

## Identité

- **Monogramme original N/O** : N en ivoire, O corail, sur fond encre foncée. Assets `app/src/assets/observatory-mark.svg` et `app/public/observatory-mark.svg`.
- **Matières** : papier ivoire pour la consultation, encre sombre pour la navigation et le moniteur, corail pour l'interaction, bleu profond pour la réponse. Pas de carte SaaS au dégradé générique, pas d'illustration décorative aléatoire.
- **Typographies** : interface système « Avenir Next / Segoe UI », données en Cascadia Code/Consolas/monospace. L'échelle typographique sépare les titres éditoriaux des événements et des octets.

| Token | Clair | Sombre | Utilité |
|---|---|---|---|
| `--canvas` | `#F4F0E8` | `#10131D` | Fond |
| `--surface` | `#FFFDF9` | `#1A2030` | Surface |
| `--ink` | `#202436` | `#F5F2EB` | Texte |
| `--brand` | `#B74129` | `#FF967B` | Action, étape sélectionnée |
| `--teal` | `#445CBE` | `#AABAFF` | Réponse, réception |
| `--muted` | `#61687A` | `#B5B8C4` | Légendes |
| `--line` | `#D5CFC5` | `#394153` | Séparateurs |

### Architecture de lecture

**Avant (V3)** : bandeau horizontal, introduction, cartes, deux panneaux de même importance puis inspecteur en dessous. La structure ressemblait au produit précédent.

**Maintenant (V4)** : rail gauche **persistant** (14 cours, progression, langues/thème). Accueil « Le réseau, à découvert. », moniteur TCP sur fond quadrillé, catalogue numéroté. Dans l'atelier, **la séquence est l'instrument principal** ; la topologie et l'inspecteur forment un volet de travail latéral. Le message actif est mis à jour depuis l'unique état de la timeline.

```text
┌──────────────┬─────────────────────────────────────────────┐
│ N/O          │ CARNET DE RÉSEAU 001 / 014                  │
│ Catalogue    │ TITRE IMMENSE       MONITEUR TCP SVG         │
│ Réseau       ├─────────────────────────────────────────────┤
│ Web          │ INDEX PAR CATÉGORIE / RECHERCHE              │
│ Sécurité     │ 01 — 02 — 03 ...                            │
│ Langue/Mode  │                                             │
├──────────────┼─────────────────────────────────────────────┤
│ N/O          │ EXPÉRIENCE / OBJECTIF / TRANSPORT           │
│ TCP actif    │ MESSAGE EN COURS                             │
│ ...          │ ┌─────────────────┬───────────────────────┐  │
│              │ │ SÉQUENCE       │ TOPOLOGIE             │  │
│              │ │ CHRONOLOGIQUE  ├───────────────────────┤  │
│              │ │ GRAND FORMAT   │ CHAMPS + HEX          │  │
│              │ └─────────────────┴───────────────────────┘  │
└──────────────┴─────────────────────────────────────────────┘
```

**Responsive :** à partir de 900 px et moins, le rail devient un en-tête avec menu déployable ; à 1120 px la disposition de l'atelier se réorganise ; à 680 px le ladder précède les panneaux topologie et inspecteur en colonnes empilées. Cibles tactiles de 44 px minimum, défilement horizontal des octets confiné à l'inspecteur.

### Principes de conception

- Toujours signifier émetteur/récepteur par **texte + graphisme**, pas seulement par couleur.
- Flèches du ladder dans l'ordre technique LTR, même si l'interface est arabe/hébraïque.
- L'exemple TCP du moniteur est explicitement une **modélisation pédagogique**, pas une capture.
- Préserver les IDs de tests et les commandes clavier : flèches, Home, End, reprise, pause en arrière-plan, focus visible.
- Panneaux non décoratifs : titre, hiérarchie, trace, explication, octets UTF-8 uniquement quand la source les définit.

### Livraison et validation

La V4 remplace l'ancien HTML `app/index.html` par le **vrai point d'entrée moderne**. Vite ne compile que la racine, ne copie pas le répertoire `public/`, et le script `verify-build.mjs` rejette les artefacts historiques. Coolify autorise les **previews uniquement** si typecheck, tests Node et build passent ; le déploiement de production reste soumis à validation. Les droits du contenu tiers historiques restent à vérifier.

**Aucun rendu navigateur ni audit WCAG 2.2 AA attesté dans cet environnement.** Les contrôles statiques ont vérifié 85 clés i18n FR/EN sans doublons, la structure de l'écran et les entrées de build ; les tests E2E V4 ont été écrits, pas exécutés. Contrôler les captures FR/EN/AR à 390, 768, 1440 px, clair/sombre, avant fusion.

## Déploiement opérationnel

La V4 se prépare pour Coolify, via `Dockerfile` multi-stage et Nginx sur le port interne 80 ; voir [DEPLOY_COOLIFY.md](DEPLOY_COOLIFY.md). Aucune nécessité de Vercel, de GitHub Actions, de Docker Compose ou d'un serveur Node en production.
