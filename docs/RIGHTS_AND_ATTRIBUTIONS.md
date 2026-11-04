# Droits, provenance et attribution — verrou de publication

La base historique qui figurait **avant V4** dans `app/index.html` était présentée dans `app/README.md` comme une reproduction du [Protocol Explorer de Dilum Sanjaya](https://protocol-explorer-alpha.vercel.app/). Le HTML présente aussi son nom et des liens vers son compte public.

La seule licence MIT présente dans ce dépôt mentionne « Copyright (c) 2026 Neosoda ». **Elle ne prouve pas une licence couvrant le code, les textes, scénarios, traductions, images, polices ou ressources de l'auteur original.**

## Règles de travail

- Préserver l'attribution existante tant que les éléments historiques demeurent dans l'arbre.
- Ne pas interpréter l'accessibilité publique d'un site comme une autorisation de copier son contenu.
- Ne pas republier ou reconditionner les bundles historiques en prétendant qu'ils sont des sources originales.
- L'expérience `/observatory/` est implémentée séparément avec son propre code, ses propres formulations et son habillage ; sa présence **ne régularise pas** la redistribution des assets historiques.
- Les noms des protocoles et les faits techniques des RFC sont utilisables comme objets d'étude ; les expressions, graphismes et supports tiers doivent être originaux ou autorisés.

## Décision requise avant redistribution

1. Obtenir de l'auteur une permission explicite, datée et vérifiable précisant les droits et l'attribution exigée, **ou**
2. Remplacer intégralement le contenu tiers par du contenu nouvellement conçu, retirer de la version distribuée les ressources historiques non autorisées, puis revoir le périmètre du projet et sa licence.
3. Vérifier individuellement les licences des polices, captures, icônes et dépendances conservées.

**Statut : BLOQUANT / permission non confirmée.** Aucune fusion ou publication ne doit être interprétée comme une levée de ce verrou.

## V4 — suppression de l'entrée historique distribuable

La branche `feat/observatory-v4-workbench` remplace l'ancien HTML racine historique par un nouveau document original, et Vite compile uniquement cette entrée. Les fichiers de `app/public/` ne sont plus copiés en production et le garde-fou vérifie les artefacts. **Cela ne vaut pas licence** pour les fichiers historiques encore dans le dépôt, les commits antérieurs ou toute partie du contenu qui serait dérivée d'un tiers. Aucune annonce de redistribution autorisée n'est faite tant que l'audit n'est pas conclu.

La preview Vercel est autorisée uniquement avec la compilation, les tests Node et le garde-fou, tandis que la production reste bloquée. Ne jamais déployer une build contenant un bundle historique.
