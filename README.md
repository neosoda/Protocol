<div align="center">

<img src="app/public/observatory-mark.svg" width="72" height="72" alt="Network Observatory">

# Network Observatory
### Comprendre les échanges Internet, événement par événement.

Laboratoire interactif des protocoles réseau, avec deux vues synchronisées, contrôle pas à pas et inspection pédagogique.

**14 protocoles modélisés** · **Vite + TypeScript** · **UI claire/sombre** · **Sans backend**

[Découvrir le laboratoire](#nouvelle-expérience--network-observatory) · [Installation](#installation) · [Limites-et-droits](#limites-et-droits)

</div>

---

> **Attention — statut alpha de migration.** Cette branche propose un nouveau laboratoire écrit de manière indépendante sous `/observatory/`. La page historique `/` contient des éléments reproduits depuis le site de Dilum Sanjaya ; **leurs droits de redistribution ne sont pas confirmés**. Ne pas publier ou redistribuer ces éléments sans clarification juridique ou remplacement original.

## Nouvelle expérience — Network Observatory

Un outil dédié à la compréhension du réseau : un événement sélectionné pilote **simultanément** la topologie, la séquence des messages, la progression et l'inspecteur.

- **Découverte** : événement expliqué et premier champ contextualisé, sans octets inutiles.
- **Expert** : champs modélisés par couche et, lorsque disponible, exemple de texte encodé en UTF-8/hexadécimal.
- **Contrôles** : lecture/pause, précédent/suivant, vitesse 0,5×–2×, reset et sélection directe.
- **Progression locale** : dernier protocole et dernier événement mémorisés dans le navigateur, si le stockage est disponible.
- **Interface** : thèmes clair/sombre, adaptation responsive, contrôles natifs au clavier, direction RTL pour arabe et hébreu.

Les **14 protocoles** représentés sont : IP, TCP, UDP, ICMP, DNS, DHCP, HTTP, HTTPS, SMTP, POP3, IMAP, FTP, SSH et TLS 1.3. Chaque scénario est **une abstraction pédagogique construite**, non une capture pcap ni du trafic réseau.

> La nouvelle interface propose un sélecteur de 15 langues pour ses libellés (avec traductions partielles et repli anglais). Les **descriptions des scénarios restent en français** à ce stade : la parité multilingue intégrale n'est pas acquise. La version historique reste conservée pour comparaison.

## Installation

Node.js **22+** conseillé. Depuis la racine du dépôt :

```bash
npm --prefix app install
npm run dev
```

- `http://localhost:5173/observatory/` : laboratoire nouveau, en TypeScript.
- `http://localhost:5173/` : version historique conservée à titre de référence interne.

```bash
npm --prefix app run typecheck
npm --prefix app run test
npm --prefix app run test:e2e
npm run build
npm run preview
```

**État de validation :** ces commandes sont fournies pour reproduire les vérifications, mais **aucune réussite de compilation, test moteur ou Playwright n'est revendiquée ici. Les tests Playwright sont écrits mais n'ont pas été exécutés ; installer Chromium avec `npx --prefix app playwright install chromium`**. Le fichier `app/package-lock.json` précède le nouveau socle : le régénérer avec `npm --prefix app install`, puis le versionner et vérifier `npm ci` avant fusion.

## Structure

```text
app/
├── index.html                 # application historique (bundles compilés)
├── observatory/index.html     # nouvelle entrée Vite
├── src/
│   ├── protocols/             # catalogue original, données et types
│   ├── engine/                # machine à états sans dépendance DOM
│   ├── i18n/                  # UI et direction RTL
│   ├── ui/                    # tokens et styles responsive
│   └── main.ts                # contrôles et vues synchronisées
├── tests/                     # tests de données, navigation et localisation
└── vite.config.ts             # build multi-pages
docs/
├── AUDIT_2026-11-04.md
├── DESIGN_SYSTEM_NETWORK_OBSERVATORY.md
└── RIGHTS_AND_ATTRIBUTIONS.md
PROJECT_HANDOFF.md             # décisions et suite
```

## Limites et droits

La version historique est explicitement une « reproduction fidèle » de [Protocol Explorer par Dilum Sanjaya](https://protocol-explorer-alpha.vercel.app/) et contient son attribution. La licence MIT marquée © 2026 Neosoda **ne couvre pas nécessairement ces éléments tiers**. Voir [droits et attributions](docs/RIGHTS_AND_ATTRIBUTIONS.md).

Le manifest historique n'établit pas l'offline, aucune preuve de service worker n'est fournie, et certaines anciennes métadonnées renvoient à l'application d'origine. **Pas de promesse « PWA/offline »**, de fidélité d'octets capturés, ni de conformité WCAG AA ou de tests « 100 % » avant campagne dédiée.

L'implémentation nouvelle est originale au niveau du code ajouté dans cette branche. Son existence n'autorise pas à redistribuer les ressources historiques.

## Suite

L'[audit priorisé](docs/AUDIT_2026-11-04.md), le [design system](docs/DESIGN_SYSTEM_NETWORK_OBSERVATORY.md) et le [handoff](PROJECT_HANDOFF.md) suivent la migration sans masquer les risques.

**Licence :** [MIT](LICENSE) pour les contributions originales dont Neosoda possède les droits ; toute œuvre tierce reste soumise à ses propres droits.

---
<small>Network Observatory · Neosoda · référence historique et attribution conservées : Dilum Sanjaya.</small>
