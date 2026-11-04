# PROJECT HANDOFF — Network Observatory (2026-11-04)

## Plateforme confirmée : Coolify — 04/11/2026

**Le site est hébergé par Coolify personnel, pas par Vercel.** Les travaux précédents qui supposaient Vercel étaient mal orientés. Cette section prévaut sur les mentions historiques plus bas.

- PR [#5](https://github.com/neosoda/Protocol/pull/5), branche `feat/observatory-v4-workbench`, **en brouillon, non fusionnée**.
- `vercel.json` supprimé. Ajout de `Dockerfile` multi-stage Node 22/Nginx, `.dockerignore` (exclusion `app/public` historique), `deploy/nginx.conf` (port interne **80**, route `/`, redirection de `/observatory/` vers `/`, endpoint `/healthz`).
- Build Docker : `npm install`, `npm run typecheck`, `npm run test`, `npm run build`. Installation non reproductible tant que `app/package-lock.json` n'est pas synchronisé ; passer à `npm ci` ensuite.
- [Guide de déploiement Coolify](docs/DEPLOY_COOLIFY.md) : stratégie Dockerfile, contexte **/**, chemin **Dockerfile**, Ports Exposes **80**, d'abord dans une application de test distincte.
- Aucun déploiement automatique, ni accès à l'instance Coolify, ni exécution de la compilation complète ou de Playwright depuis cet environnement. Les droits historiques et la QA restent ouverts.

## ÉTAT ACTUEL — V4 Workbench — 4 novembre 2026

**Pourquoi le design restait identique sur le site :** la V3 avait été fusionnée sur GitHub, mais `/` était encore l'ancien `app/index.html` (163 633 caractères), tandis que le laboratoire moderne était uniquement sous `/observatory/`. Le `vercel.json` ignorait tous les builds. La V3 ne modifiait en outre pas assez la structure.

**Nouvelle branche :** `feat/observatory-v4-workbench`, créée depuis le `main` après PR #4. **Ne pas fusionner automatiquement.**

### Changements effectués (sur GitHub)

- `app/index.html` réécrit comme **entrée moderne** ; Vite compile uniquement `dist/index.html`, avec `publicDir: false`. Les anciens bundles historiques ne doivent plus se retrouver dans une sortie de production.
- `app/scripts/verify-build.mjs` et 5 tests Node réécrits : racine moderne obligatoire, un seul bundle JS et aucun fichier inattendu.
- Nouvelle interface V4 **structurelle** : rail latéral permanent avec accès aux 14 protocoles, tiroir mobile, accueil éditorial avec moniteur TCP SVG original, catalogue indexé, chronologie principale, topologie et inspecteur empilés à droite, message actif synchronisé.
- `app/src/ui/styles.css` intégralement refondu en palette ivoire, encre, corail et bleu. Nouvel emblème vectoriel N/O, distinct de la V3.
- **85 clés FR/EN vérifiées statiquement** (aucun doublon, aucune clé manquante). 2 scénarios E2E ajoutés sur l'entrée racine et le menu mobile.
- `vercel.json` laisse **la production bloquée** (`VERCEL_ENV=production` → code 0) mais autorise les seules **previews** (`VERCEL_ENV=preview` → code 1), avec installation, typecheck, tests Node et build anti-legacy. Une preview réelle dépend de la connexion Vercel et de la réussite des tests.
- La route `/observatory/` reste accessible en dev et par rewrite Vercel vers `/`.

### Preuve nouvelle du garde-fou

**5/5 tests Node réussis** sur une copie locale dont les deux blobs correspondent exactement aux fichiers GitHub : `f15df0c124ac76df3917a3050e54c23af2d2fcc2` (verifier), `e6c4af565d89bcfdaf7309edd19d3d6fc53fadd6` (tests). Les tests app complets et le build Vite restent non exécutés.

### Validation et risques

**Non exécutés en local sur cette branche :** `npm ci` (lockfile obsolète), TypeScript complet, Node métier, Vite, Playwright, screenshots, WCAG 2.2 AA. DNS vers le registre npm indisponible. Les vérifications du DOM et des dictionnaires sont **statiques** ; elles ne prouvent pas le rendu.

L'ancien contenu tiers se trouve encore dans l'historique Git et des ressources historiques peuvent rester dans `app/public`, **non recopié au build**. La licence de ces ressources n'est pas établie. Ne pas réactiver la production ni redistribuer l'historique.

### Priorité suivante

1. Vérifier si Vercel publie une preview ; consulter son build et corriger tout échec réel.
2. Sur un poste avec npm, régénérer et committer `app/package-lock.json`, puis `npm ci`, typecheck, tests, build et Playwright.
3. Capturer et examiner visuellement 390/768/1440, FR/EN/AR, clair/sombre, clavier/RTL et contrastes.
4. Confirmer la sécurité des artefacts et les droits avant fusion et déploiement de production.

**Les sections suivantes relatent les étapes précédentes ; cette section V4 fait foi.**

## État actuel après fusion PR #4 — 04/11/2026

- **PR #4 « Signal & Structure » fusionnée dans `main`**, commit `5da7512c52ebefec763eb6a5248d1eb2a8db780a`. PR #3 fusionnée auparavant : `80dac1df1327a0c7dc9872806c27aa15824be8ad`.
- **Fusion Git uniquement** : l'identité visuelle, la recherche catalogue, le CSS refactorisé et les tests ajoutés se trouvent sur `main` ; aucune preuve de réussite TypeScript/Vite/Playwright ou de conformité WCAG 2.2 AA n'a été obtenue. Le lockfile n'est toujours pas synchronisé.
- **Publication toujours bloquée par défaut** : `vercel.json` contient `ignoreCommand` retournant 0, prévu pour ignorer les nouveaux builds Vercel. Cela ne garantit pas l'absence de déploiements tiers ni la suppression d'une ancienne publication.
- **Droits historiques non résolus** ; ne pas déclencher de redistribution ni supprimer la barrière de publication sans autorisation explicite ou suppression totale des ressources concernées.
- **Reprise prochaine** : partir du commit `main` le plus récent, installer/régénérer `app/package-lock.json` dans un environnement avec réseau npm, exécuter `npm ci`, `typecheck`, tests unitaires, `vite build` et Playwright, corriger les échecs constatés, revoir le rendu 390/768/1440 et l'accessibilité.
- Aucun GitHub Actions lancé volontairement lors de cette intervention.

**Les sections précédentes ci-dessous documentent l'historique avant fusion ; ce bloc fait foi pour l'état actuel.**

## V3 — Signal & Structure (reprise courante, 04/11/2026)

**PR #3 fusionnée dans `main`** par demande explicite : commit de fusion `80dac1df1327a0c7dc9872806c27aa15824be8ad`. La fusion a eu lieu malgré la non-validation de `npm ci`, TypeScript, build et E2E (blocage DNS). **Elle ne vaut ni certificat qualité ni autorisation de redistribution.**

**Protection** : `vercel.json` contient `ignoreCommand` qui retourne 0 et demande à Vercel de sauter les nouveaux builds. Cela ne désactive pas les déploiements déjà existants ni les autres hébergeurs. Le statut juridique concernant les ressources historiques reste P0.

**Branche actuelle :** `feat/observatory-v3-signal-structure`, issue du merge `80dac1d`. **PR [#4](https://github.com/neosoda/Protocol/pull/4) ouverte en brouillon : ne pas fusionner automatiquement.**

### Travaux V3 poussés

- Direction artistique originale **Signal & Structure** : logo vectoriel à deux trajets convergents, palette lumière/obscurité revue, typographie et hiérarchie scientifique sobres. Spécification `docs/DESIGN_SYSTEM_NETWORK_OBSERVATORY.md`.
- Feuille `app/src/ui/styles.css` **entièrement remplacée**, plutôt qu'un empilement d'overrides : tokens, application chrome, catalogue, recherche, instrument, laboratoire, topologie, ladder, inspection HEX, responsive et reduced motion.
- Catalogue filtrable par nom, identifiant, catégorie et résumé, avec statut live de résultats, zéro résultat, effacement sans perte de focus. Reprise conservée et simulation inchangée.
- Localisation FR/EN des nouveaux libellés, repli anglais des 13 autres locales ; nouvelles assertions E2E de recherche et de layout mobile.
- Métadonnée de thème et icône du développement harmonisées avec l'identité modernisée.

### État des vérifications

- Inspection **statique** : 78 clés i18n présentes en FR/EN, sans doublons ; 14 protocoles existants conservés ; syntaxe CSS équilibrée ; références sélecteurs/étiquettes examinées ; nouvelles suites E2E rédigées.
- Vérifications **non réalisées** : compilation TypeScript, tests npm métier, bundle Vite, Playwright, captures réelles, audit contrastes/lecteurs d'écran, parcours clavier et droits finaux. DNS `github.com`/`registry.npmjs.org` indisponible dans l'environnement d'exécution. Ne pas présenter une vérification statique comme un test fonctionnel.
- `app/package-lock.json` **non synchronisé**. Aucun GitHub Actions déclenché, aucun déploiement volontaire.
- **Attention :** les anciens paragraphes ci-dessous sont un historique de la PR #3 *avant fusion*, ils ne constituent plus le statut courant. Cette section V3 fait foi.

### Reprise prioritaire

1. Cloner la branche V3 sur machine avec npm accessible, `npm --prefix app install`, committer le lockfile, puis `npm --prefix app ci`.
2. `npm --prefix app run typecheck`, `test`, `build`, installer Chromium, puis `npm --prefix app run test:e2e`. Corriger chaque erreur réelle.
3. Tester à 390/768/1440, thèmes clair/sombre, FR/EN/AR, recherche et déroulement des 14 scénarios ; préserver les captures comme preuves. Vérifier l'absence de débordement et les contrastes.
4. Contrôler que les assets tiers ne sont pas inclus dans `app/dist` ; résoudre le point légal, puis autoriser uniquement une distribution effectivement légitime.
5. Poursuivre V3 par lots : ergonomie du ladder multi-participants, lecture guidée, i18n des récits, revue RFC et tests d'acceptation. Garder la PR V3 non fusionnée jusqu'aux preuves.

## Suite du 4 novembre 2026 — lot de consolidation après `8ef3caf`

**Dernière branche :** `fix/observatory-v2-hardening`. **Dernier commit du lot de code :** `e81fbb53a50f774aad0552e0bb85c10abbe65cf5`. PR [#3](https://github.com/neosoda/Protocol/pull/3) **ouverte, brouillon, non fusionnée**. `main` reste `9dbeea4877ec78ed40eb54d94350b346072db848`.

### Modifications effectivement poussées

1. `edddff73a01c2ff654cbf2eb391ced105f762da2` : 32 chaînes de navigation/inspector/diagrammes FR/EN ajoutées avec repli anglais sur les 13 autres locales ; test d'unicité/traduction des chaînes et test navigateur en anglais ajoutés.
2. `8caec1d5139ba79e1d1cc6b937334f9113fedd40` : correction immédiate de deux templates d'inspecteur pour évaluer correctement les libellés localisés.
3. `f78501c2f7d18a8921778a80820914127d95bf70` : HTTP/1.1 utilise désormais `Content-Length: 7` pour son corps texte de 7 octets ; SSH enrichi à **14 événements** (KEXINIT des deux pairs, deux NEWKEYS, SERVICE_REQUEST/ACCEPT, USERAUTH_SUCCESS, confirmation de canal) ; 2 tests d'invariants RFC ajoutés ; progression persistée par **ID d'événement** plutôt qu'index avec compatibilité des anciens entiers.
4. `e81fbb53a50f774aad0552e0bb85c10abbe65cf5` : labels de topologie émetteur/récepteur rendus dans le DOM (plus de texte français en pseudo-éléments CSS), accessibles et traduisibles, ainsi que les légendes, titres de panneaux et thème FR/EN ; E2E et tests de dictionnaire ajustés.

### Vérifications réellement effectuées, sans extrapolation

- **4/4 tests Node autonomes** du contrôle `verify-build` réexécutés localement sur les scripts identiques aux blobs GitHub — réussite.
- **Inspection programmatique des sources GitHub à ce commit** : **69 clés UI présentes dans `en` et `fr`**, aucun doublon ni clé manquante ; réponse HTTP `Content-Length: 7` = corps `Bonjour` (7 octets ASCII/UTF-8) ; **14 événements SSH consécutifs** ; vérification de l'absence d'étiquettes d'état statiques en CSS. **Ces contrôles sont statiques**, ils ne remplacent pas TypeScript ni les tests Node du catalogue.
- **Retest réseau** : `git ls-remote` échoue sur `github.com` ; `npm view vite` échoue sur `EAI_AGAIN registry.npmjs.org`. Dépendances npm non installables ici.
- **Toujours absents :** lockfile mis à jour, `npm ci`, typecheck du dépôt complet, tests d'invariants exécutés, build Vite, tests Playwright, captures, preview de production et audit WCAG 2.2 AA. Aucune CI GitHub Actions ni livraison n'a été déclenchée.
- **Verrou juridique inchangé** : droits de l'historique non établis, malgré l'exclusion désormais programmée du build moderne ; vérifier `dist` réellement avant une fusion.

### Ordre de reprise

1. Sur une machine avec accès Git + npm, installer, régénérer/versionner `app/package-lock.json`, faire `npm ci` puis `typecheck`, `test`, `build`, `test:e2e`.
2. Corriger **toute** compilation / assertion cassée ; inspecter `app/dist/` et vérifier que `/` ne redistribue aucun élément historique, puis valider `/observatory/` en preview.
3. Vérifier captures FR/EN/AR × 390/768/1440 × thèmes, navigation clavier, focus, contraste, lecteurs d'écran, reduced motion, compatibilité RTL et contrôle de reprise SSH après changement de scénario.
4. Conclure le verrou de redistribution et vérifier qu'un `main` fusionné ne déclenchera pas de publication non autorisée.
5. **Fusionner PR #3 seulement après ces critères**, puis ouvrir `feat/network-observatory-v3` avec une PR non fusionnée : focus précision SMTP/IMAP/FTP/DNS, traduction des récits, revue détaillée des 14 protocoles, enrichissement des tests et améliorations de visualisation.

## Reprise de stabilisation — 4 novembre 2026 (PR #3 en cours)

**État réel GitHub :** la PR #3 est toujours ouverte en brouillon. Les deux premiers commits de correction du lot initial ont été poussés :

- `997a90978c1205b3c7f268abf8984d59a219f005` : build Vite moderne seul (entrée `/observatory/`), `publicDir: false` en production pour exclure les bundles historiques, favicon moderne importé comme ressource, vérificateur des artefacts, navigation du ladder au clavier (flèches, Home, End), défilement interne du ladder et pause en onglet masqué ; test Playwright dédié ajouté.
- `693aa26310c927690067e0728c45c556c4563a00` : 4 tests Node du garde-fou de sortie, intégrés à `npm test`, contrôle du nombre de bundles JS pour rejeter un ajout accidentel de l'historique.

### Exécution constatée et portée exacte

- **Node.js 22.16.0, npm 10.9.2 disponibles** dans l'environnement de travail.
- **4/4 tests du seul garde-fou de build exécutés et réussis** avec `node --test` sur une copie locale des deux scripts ; l'identité octet pour octet des deux fichiers GitHub a été vérifiée via leurs SHA de blobs Git : `621fabd61df4786e7e61bea89e907ead9fb2a9d6` et `5922c09ed8d1b359cae8fff966e838623914399e`.
- **Bloquant environnement :** `git ls-remote https://github.com/neosoda/Protocol.git HEAD` → `Could not resolve host: github.com` ; `npm view vite version --fetch-retries=0 --fetch-timeout=4000` → `EAI_AGAIN registry.npmjs.org`. Le dépôt complet n'a pas pu être cloné/exécuté ici.
- **Toujours non exécutés sur le dépôt complet :** `npm install`, `npm ci`, TypeScript, tous les tests unitaires métier, build Vite, Playwright, captures 18 variantes, audit WCAG/contraste/lecteur d'écran et validation serveur preview. Ne pas extrapoler les 4 tests du garde-fou à toute l'application.
- **Toujours P0 :** `app/package-lock.json` désynchronisé, droits de l'application historique non établis. Le nouveau build est conçu pour exclure les artefacts historiques **mais son résultat n'a pas encore été inspecté**. L'ancien code reste dans le dépôt public et accessible en développement ; l'isolation du build ne résout pas la question des droits à elle seule.

**Décision : PR #3 laissée ouverte en brouillon, pas de fusion ; pas de branche ni de PR V3 créée tant que les conditions techniques de la fusion ne sont pas satisfaites. Aucun déploiement lancé et aucune GitHub Action exécutée.**

### Reprise prioritaire (machine disposant de l'accès npm/Git)

1. Cloner `fix/observatory-v2-hardening`, installer les dépendances avec `npm --prefix app install` ; examiner puis **versionner le nouveau `app/package-lock.json`**. Faire ensuite `npm --prefix app ci`.
2. Exécuter `npm --prefix app run typecheck`, `npm --prefix app run test`, `npm --prefix app run build`. Le build appelle `scripts/verify-build.mjs` et **doit échouer** si les ressources publiques historiques se retrouvent dans `app/dist/`.
3. Installer Chromium puis exécuter `npm --prefix app run test:e2e` ; conserver et examiner les captures FR/EN/AR × 390/768/1440 × clair/sombre et les journaux.
4. Vérifier en `vite preview` que seul `/observatory/` est distribué, que le logo se charge, que `/` ne distribue plus le site historique, et examiner l'arborescence `dist` et les erreurs console. Faire les contrôles WCAG clavier, RTL, contrastes, lecteurs d'écran et reduced motion.
5. Réexaminer les droits des éléments historiques, les risques d'hébergement/publication automatique et les références RFC. Mettre à jour les preuves sur PR #3. Fusionner dans `main` **uniquement si les critères techniques sont réellement établis et la publication non autorisée évitée**.
6. **Après la fusion seulement**, créer une branche `feat/network-observatory-v3`, approfondir traductions FR/EN, topologies, 14 scénarios et tests, puis ouvrir une nouvelle PR non fusionnée.

## Reprise après fusion PR #2

- `main` : `9dbeea4877ec78ed40eb54d94350b346072db848` — PR #2 **fusionnée sur instruction explicite du propriétaire**, sans exécution des tests ni autorisation de distribution.
- Nouvelle branche : `fix/observatory-v2-hardening`, issue de ce commit.
- Nouvelle PR : [#3](https://github.com/neosoda/Protocol/pull/3), **brouillon non fusionné** ; correctifs prêts pour validations locales.
- Critères de publication : `docs/RELEASE_GATES.md` (P0 droits historiques toujours bloquant).

### Travaux du lot durcissement

- Focus clavier conservé après réaffichage complet du mode, du thème et de la langue ; focus transféré au titre du laboratoire/catalogue lors du changement de page.
- Focus de l'inspecteur repositionné par **identifiant de champ**, et non par position DOM (les champs sont regroupés par couche).
- Typecheck élargi au code de test, à la configuration Vite et Playwright ; types Node inclus. Aucun résultat de typecheck revendiqué.
- Script `npm test` : chemins explicites pour éviter la dépendance à l'expansion des globs sur Windows.
- Tests Playwright ajoutés : focus, absence de débordement horizontal à 390 px, absence d'erreur console/page.
- **Bug de la matrice de captures corrigé** : le script d'initialisation ne doit plus réécraser la langue et le thème sélectionnés au rechargement ; des assertions HTML vérifient maintenant chaque couple.
- Documentation de lancement racine corrigée : commandes `npm --prefix app run ...`.

**Validation : modifications poussées et sources inspectées, mais npm / tsc / navigateur et screenshots toujours non exécutés dans l'environnement actuel faute d'accès npm/Git direct. Ne pas afficher « passé » dans la PR.**


## Références Git

- Dépôt : `neosoda/Protocol`
- `main` au départ : `cebc6049d34d7856ddfe5eec967b6c7ba5816de3` (PR #1 fusionnée).
- Branche de continuation : `feat/network-observatory-v2-consolidation`
- PR #2 : [fusionnée](https://github.com/neosoda/Protocol/pull/2) le 04/11/2026 ; la branche de suite est `fix/observatory-v2-hardening`.
- Nouvelle application : `/observatory/`. Historique : `/`.

## Acquis confirmés par inspection des sources et commits (pas par navigateur)

1. L'architecture Vite/TypeScript, le catalogue original à 14 protocoles et le moteur indépendant du DOM de la PR #1 restent en place.
2. Le diagramme de séquence est désormais un **ladder** : participants, lignes de vie, flèches chronologiques, boutons de sélection et événement actif. Code : `app/src/visualizations/sequence.ts`.
3. La topologie distingue graphiquement les rôles, émission/réception et trajet de l'événement. Il s'agit **d'un chemin logique modélisé**, pas de liens réseau réellement détectés. Code : `app/src/visualizations/topology.ts`.
4. Inspecteur : sélection de champs par couche, explication contextuelle et surlignage d'octets **seulement lorsqu'une plage dans l'exemple textuel UTF-8 est explicitement définie et dans ses limites**. Première correspondance : « GET » dans l'exemple HTTP/1.1. Pas d'en-têtes binaires inventés.
5. TLS 1.3 : séparation des étapes EncryptedExtensions, Certificate/CertificateVerify, Finished serveur et client. HTTPS : attente du Finished client avant la requête. Sources : `docs/PROTOCOL_REFERENCES.md`.
6. Tests `app/tests/protocol-invariants.test.ts` ajoutés ; E2E actualisés, avec parcours des contrôles, reprise, RTL et matrice de **18 captures prévues** (3 tailles × 2 thèmes × 3 langues).

## Validations / statuts rigoureux

| Contrôle | Statut |
|---|---|
| Commit `main` et PR #1 | Vérifiés par GitHub |
| Branche V2 et commits de code | Poussés sur GitHub ; imports TypeScript relatifs vérifiés statiquement (aucun fichier manquant), 14 IDs uniques |
| Lecture du catalogue, fichiers sources, droit et handoff | Effectuée |
| Revue RFC TCP/DHCP/TLS/HTTP | Ciblée ; non exhaustive |
| Installation `npm install` et génération `package-lock.json` | **BLOQUÉES** : accès DNS/registry indisponible dans l'environnement d'exécution ; lock actuel obsolète |
| Typecheck, tests unitaires, build, Playwright | **NON exécutés** : aucune copie exécutable du dépôt ni dépendances installables localement |
| Captures 390/768/1440 FR/EN/AR et thèmes | **Non produites** ; scripts écrits seulement |
| Contrastes, clavier, lecteur d'écran, responsive, performance | Non vérifiés en navigateur |
| Traductions des récits (15 langues) | À faire ; interface partiellement localisée seulement |
| Rights & redistributabilité de l'historique | **P0 bloquant**, documentation inchangée, autorisation non confirmée |

## Étapes de reprise prioritaires

1. Dans un clone local, Node 22+ et npm opérationnels : `npm --prefix app install`, **committer le package-lock régénéré**, puis `npm --prefix app ci`.
2. Exécuter `npm --prefix app run typecheck`, `test`, `build`, puis installer Chromium et lancer `test:e2e`. Corriger **tout** échec ; ne pas utiliser GitHub Actions.
3. Valider `/observatory/` en dev et après `vite preview`. Vérifier console, URL de base, sans scroll horizontal ; FR/EN/AR, 390/768/1440 px, modes et thèmes.
4. Tester l'accessibilité clavier et lecteurs d'écran, focus des champs re-rendus, réductions de mouvement, contrastes AA. Vérifier en particulier les libellés encore en français dans les 15 locales.
5. Compléter les réponses et causations DNS/SMTP/IMAP/FTP/SSH ; revue RFC exhaustive et tests d'invariants.
6. Traiter le **P0 juridique** : obtenir une permission explicite pour les ressources historiques ou les retirer de tout livrable distribué ; ne jamais supprimer silencieusement leur attribution.

## Reproduction locale attendue

```bash
npm --prefix app install
npm --prefix app ci
npm --prefix app run typecheck
npm --prefix app run test
npm --prefix app run build
npx --prefix app playwright install chromium
npm --prefix app run test:e2e
npm --prefix app run dev
```

Ne déclarer aucun succès sans logs réels. Ne pas publier/redistribuer l'historique non autorisé. Conserver la **PR de durcissement** en brouillon jusqu'aux tests reproductibles et au traitement des droits. Les modules TypeScript ajoutés ne suffisent pas à garantir la parité avec le site historique.

## Références

- `docs/AUDIT_2026-11-04.md`
- `docs/DESIGN_SYSTEM_NETWORK_OBSERVATORY.md`
- `docs/PROTOCOL_REFERENCES.md`
- `docs/RIGHTS_AND_ATTRIBUTIONS.md`
- `docs/RELEASE_GATES.md`
