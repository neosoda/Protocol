<div align="center">

<img src="app/public/observatory-mark.svg" width="72" height="72" alt="Network Observatory">

# Network Observatory
### Comprendre les échanges Internet, événement par événement.

Laboratoire interactif des protocoles réseau : topologie logique, diagramme de séquence à lignes de vie, contrôle pas à pas et inspection pédagogique.

**14 protocoles modélisés** · **Vite + TypeScript** · **UI claire/sombre** · **Sans backend**

[Découvrir le laboratoire](#nouvelle-expérience--network-observatory) · [Installation](#installation) · [Limites-et-droits](#limites-et-droits)

</div>

---

> **Attention — statut alpha de migration.** Cette branche propose un nouveau laboratoire écrit de manière indépendante sous `/observatory/`. La page historique `/` contient des éléments reproduits depuis le site de Dilum Sanjaya ; **leurs droits de redistribution ne sont pas confirmés**. Ne pas publier ou redistribuer ces éléments sans clarification juridique ou remplacement original.

## Nouvelle expérience — Network Observatory

Un outil dédié à la compréhension du réseau : un événement sélectionné pilote **simultanément** la topologie, la séquence des messages, la progression et l'inspecteur.

- **Découverte** : événement expliqué et premier champ contextualisé, sans octets inutiles.
- **Expert** : champs par couche sélectionnables, explications ciblées, exemples HEX/ASCII UTF-8 lorsque disponibles, et surlignage de plages uniquement si la correspondance est vérifiable.
- **Contrôles** : lecture/pause, précédent/suivant, vitesse 0,5×–2×, reset et sélection directe.
- **Progression locale** : dernier protocole et dernier événement mémorisés dans le navigateur, si le stockage est disponible.
- **Interface** : thèmes clair/sombre, adaptation responsive, contrôles natifs au clavier, direction RTL pour arabe et hébreu.

Les diagrammes sont des **vues d'un scénario logique modélisé** : ils n'affichent ni capture réelle ni topologie physique déduite. Les données de simulation sont communes aux deux modes.

Les **14 protocoles** représentés sont : IP, TCP, UDP, ICMP, DNS, DHCP, HTTP, HTTPS, SMTP, POP3, IMAP, FTP, SSH et TLS 1.3. Chaque scénario est **une abstraction pédagogique construite**, non une capture pcap ni du trafic réseau.

> La nouvelle interface propose un sélecteur de 15 langues pour ses libellés (avec traductions partielles et repli anglais). Les **descriptions des scénarios restent en français** à ce stade : la parité multilingue intégrale n'est pas acquise. La version historique reste conservée pour comparaison.

## Installation

Node.js **22+** conseillé. Depuis la racine du dépôt :

```bash
npm --prefix app install
npm --prefix app run dev
```

- `http://localhost:5173/observatory/` : laboratoire nouveau, en TypeScript.
- `http://localhost:5173/` : version historique conservée à titre de référence interne.

```bash
npm --prefix app run typecheck
npm --prefix app run test
npm --prefix app run test:e2e
npm --prefix app run build
npm --prefix app run preview
```

**État de validation (04/11/2026) :** les nouveaux tests unitaires et Playwright sont **rédigés mais non exécutés** ; aucun résultat de build, typecheck ou capture navigateur n'est revendiqué. Le verrou npm est toujours ouvert : le `app/package-lock.json` historique n'est **pas synchronisé** avec les dépendances du socle TypeScript. Exécuter `npm --prefix app install`, versionner le lock puis vérifier `npm --prefix app ci` dans un environnement disposant de npm et du réseau. Aucun workflow GitHub Actions n'est requis.\n
### Séparation de la distribution

En développement, la version historique reste accessible localement à la racine pour comparaison. **Le build de production Vite n'embarque intentionnellement que `/observatory/`** : `app/public/` est exclu et un contrôle automatique (`app/scripts/verify-build.mjs`) rejette les artefacts suspects. Ce comportement est **implémenté mais pas encore vérifié par un build réel**, faute d'accès à npm. Il ne régularise pas les droits du contenu historique déjà présent dans le dépôt.

**Validation partielle réelle (04/11/2026) :** 4/4 tests autonomes du garde-fou réussis sous Node 22.16.0 sur des copies identiques aux fichiers GitHub ; les tests métier, le build Vite et Playwright ne sont toujours pas exécutés. La PR #3 reste ouverte. Voir `PROJECT_HANDOFF.md` pour les SHA, les blocages réseau et le plan de reprise.

## Structure

```text
app/
├── index.html                 # application historique (bundles compilés)
├── observatory/index.html     # nouvelle entrée Vite
├── src/
│   ├── protocols/             # catalogue original, données et types
│   ├── engine/                # machine à états sans dépendance DOM
│   ├── inspector/             # champs sélectionnables, HEX des exemples
│   ├── visualizations/        # ladder / topologie logique
│   ├── i18n/                  # UI et direction RTL
│   ├── ui/                    # tokens et styles responsive
│   └── main.ts                # contrôles et vues synchronisées
├── tests/                     # tests de données, navigation et localisation
└── vite.config.ts             # build multi-pages
docs/
├── AUDIT_2026-11-04.md
├── DESIGN_SYSTEM_NETWORK_OBSERVATORY.md
├── RIGHTS_AND_ATTRIBUTIONS.md
└── PROTOCOL_REFERENCES.md
PROJECT_HANDOFF.md             # décisions et suite
```

## Limites et droits

La version historique est explicitement une « reproduction fidèle » de [Protocol Explorer par Dilum Sanjaya](https://protocol-explorer-alpha.vercel.app/) et contient son attribution. La licence MIT marquée © 2026 Neosoda **ne couvre pas nécessairement ces éléments tiers**. Voir [droits et attributions](docs/RIGHTS_AND_ATTRIBUTIONS.md).

Le manifest historique n'établit pas l'offline, aucune preuve de service worker n'est fournie, et certaines anciennes métadonnées renvoient à l'application d'origine. **Pas de promesse « PWA/offline »**, de fidélité d'octets capturés, ni de conformité WCAG AA ou de tests « 100 % » avant campagne dédiée.

L'implémentation nouvelle est originale au niveau du code ajouté dans cette branche. Son existence n'autorise pas à redistribuer les ressources historiques.

## Suite

L'[audit priorisé](docs/AUDIT_2026-11-04.md), le [design system](docs/DESIGN_SYSTEM_NETWORK_OBSERVATORY.md), les [références RFC](docs/PROTOCOL_REFERENCES.md), les [conditions de livraison](docs/RELEASE_GATES.md) et le [handoff](PROJECT_HANDOFF.md) documentent les acquis et les vérifications restant à faire sans masquer les risques.

**Licence :** [MIT](LICENSE) pour les contributions originales dont Neosoda possède les droits ; toute œuvre tierce reste soumise à ses propres droits.

---
<small>Network Observatory · Neosoda · référence historique et attribution conservées : Dilum Sanjaya.</small>
