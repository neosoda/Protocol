<div align="center">

# 🌐 Protocol Explorer

<p align="center">
  <strong>Comprenez le fonctionnement d'Internet, paquet par paquet.</strong><br>
  Visualiseur réseau interactif et pédagogique avec décodage des trames au niveau octet, animations bidirectionnelles et double vue (topologie & diagramme de séquence).
</p>

[![GitHub stars](https://img.shields.io/github/stars/neosoda/Protocol?style=for-the-badge&logo=github&logoColor=white&label=Stars&color=2563EB)](https://github.com/neosoda/Protocol/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev/)
[![Offline First](https://img.shields.io/badge/Offline-100%25%20Client-10B981?style=for-the-badge&logo=pwa&logoColor=white)](#)
[![i18n](https://img.shields.io/badge/i18n-15%20Langues%20(dont%20RTL)-8B5CF6?style=for-the-badge)](#-support-multilingue)

<br />

<img src="docs/preview-desktop.png" alt="Aperçu Protocol Explorer" width="100%" style="border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.15);" />

<br /><br />

[**Fonctionnalités**](#-fonctionnalités-clés) · [**Protocoles couverts**](#-14-protocoles-détaillés) · [**Moteur de simulation**](#-moteur-de-simulation) · [**Démarrage rapide**](#-démarrage-rapide) · [**Déploiement**](#-déploiement) · [**Architecture**](#-architecture)

</div>

---

## 💡 Présentation

**Protocol Explorer** est une plateforme web interactive conçue pour explorer et maîtriser les protocoles fondamentaux d'Internet. Plutôt que de simples diagrammes statiques ou des résumés abstraits, l'application simule **la circulation réelle des paquets** entre les équipements (client, passerelle, DNS, routeurs et serveurs distants) avec une décomposition octet par octet des en-têtes et des payloads.

Elle intègre un **double moteur de rendu** (Vue Topologie Réseau & Vue Séquence RFC), un **inspecteur de paquets temps réel** et une bascule vers un nouveau design immersif **Cyber-Glass**.

---

## ✨ Fonctionnalités clés

| | Fonctionnalité | Description |
| :---: | :--- | :--- |
| 📦 | **Inspection octet par octet** | Chaque trame réseau est décortiquée champ par champ (adresses IP, ports, flags TCP, TTL, checksums, payload applicatif). |
| 🔀 | **Double vue d'observation** | Basculez instantanément entre la **Topologie Réseau** (animation des flux physiques/logiques) et le **Diagramme de Séquence** (Ladder diagram chronologique). |
| ⏯️ | **Contrôle dynamique du temps** | Lecture automatique, pause, avancement pas à pas (*Step Next / Prev*), réinitialisation et réglage de la vitesse (`0.5x` à `2.0x`). |
| 🎨 | **Mode Cyber-Glass** | Switch interactif entre le thème d'origine et le thème modernisé *Cyber-Glass* (effets de flou d'arrière-plan, bordures subtiles et accents néon). |
| 🌍 | **Internationalisation native (15 langues)** | Traduction intégrale des scénarios et de l'interface en français, anglais, espagnol, allemand, chinois, japonais, arabe, hébreu (avec support RTL complet), etc. |
| ⚡ | **100% Client-Side & Offline** | Aucune dépendance externe ni télémétrie. Fonctionne intégralement hors ligne une fois chargé. |

---

## 🛰️ 14 Protocoles détaillés

L'application couvre **14 protocoles incontournables** organisés en 3 grandes familles :

```
Protocol Explorer
├── 📡 Réseau & Transport (Core 4 + Infra)
│   ├── IP      (v4 / v6, routage, TTL, fragmentation)
│   ├── TCP     (3-way handshake SYN/ACK, fenêtrage, acquittements, FIN)
│   ├── UDP     (datagrammes non connectés, streaming temps réel)
│   ├── ICMP    (Echo Request/Reply, Traceroute, Unreachable)
│   ├── DNS     (résolution récursive UDP/53, enregistrements A/AAAA/CNAME)
│   └── DHCP    (cycle DORA : Discover, Offer, Request, Ack UDP/67-68)
├── 🌐 Web & Applications
│   ├── HTTP    (requêtes GET/POST, headers RFC, statuts 200/301/404)
│   ├── HTTPS   (chiffrement applicatif sur canal sécurisé TLS)
│   ├── SMTP    (acheminement d'emails : EHLO, MAIL FROM, RCPT TO, DATA)
│   ├── POP3    (relève de boîte : USER, PASS, STAT, LIST, RETR, DELE)
│   ├── IMAP    (synchronisation bidirectionnelle, dossiers, flags TCP/143)
│   └── FTP     (séparation canal de commande TCP/21 et flux données actif/passif)
└── 🔐 Sécurité & Chiffrement
    ├── SSH     (échange post-quantique sntrup761 + X25519, known_hosts)
    └── TLS/SSL (TLS 1.3 Handshake, Client/Server Hello, échange ECDHE, Finish)
```

<details>
<summary><strong>🔍 Cliquez pour voir le détail des scénarios simulés</strong></summary>

<br>

### 1. Réseau et Transport
- **IP (Internet Protocol)** : Analyse de la construction des paquets IPv4 et IPv6, routage par bond (*hop-by-hop*), décrémentation du TTL et gestion de la fragmentation.
- **TCP (Transmission Control Protocol)** : Établissement de connexion en 3 étapes (*SYN -> SYN-ACK -> ACK*), suivi rigoureux des numéros de séquence (`Seq`) et d'acquittement (`Ack`), contrôle de flux par fenêtre glissante, et terminaison propre (`FIN/ACK` ou `RST`).
- **UDP (User Datagram Protocol)** : Envoi direct de paquets sans négociation préalable, idéal pour comprendre les compromis entre rapidité et fiabilité.
- **ICMP (Internet Control Message Protocol)** : Diagnostic réseau avec Ping (Echo 8 / Reply 0) et simulation de découverte de route (*traceroute*) via expiration du TTL.
- **DNS (Domain Name System)** : Cycle complet d'interrogation du résolveur local jusqu'aux serveurs faisant autorité, dissection des paquets de questions/réponses.
- **DHCP (Dynamic Host Configuration Protocol)** : Attribution dynamique d'adresse IP au démarrage d'une machine via le protocole DORA (*Discover, Offer, Request, Acknowledge*).

### 2. Web et Messagerie
- **HTTP / HTTPS** : Dialogue client-serveur standardisé, headers de cache, négociation de contenu, cookies et bascule vers l'encapsulation TLS sécurisée.
- **SMTP** : Dialogue textuel RFC 5321 pour l'envoi de courriels entre le client de messagerie (MUA) et le serveur de transfert (MTA).
- **POP3 & IMAP** : Comparatif visuel direct entre le téléchargement destructif/simple (POP3) et le modèle de synchronisation d'état persistant (IMAP).
- **FTP** : Mise en évidence de l'architecture historique à double port (port 21 de commande et port dynamique pour le transfert des fichiers).

### 3. Cryptographie et Sécurité
- **SSH (Secure Shell)** : Négociation d'algorithmes hybrides modernes, calcul de secret partagé et ouverture de canaux virtuels interactifs multiplexés.
- **TLS 1.3** : Simplification du handshake en 1 seul aller-retour (*1-RTT*), dérivation des clés de session symétriques (AES-GCM / ChaCha20) et chiffrement de la charge utile.

</details>

---

## 🕹️ Moteur de simulation

Le moteur de simulation reproduit fidèlement la topologie d'un réseau informatique :

```
[ Laptop Client ] <---> [ Routeur Local ] <---> [ Nuage Internet ] <---> [ Serveur Distant / DNS ]
```

### Modes de visualisation
1. **Vue Réseau (Network View)** : Visualisation spatiale des paquets se déplaçant le long des liens physiques et logiques avec signalétique couleur par protocole.
2. **Vue Séquence (Ladder Diagram)** : Représentation chronologique temporelle de haut en bas, idéale pour l'apprentissage académique et le débogage réseau.

### Inspecteur de paquets
En cliquant sur n'importe quel événement ou paquet dans la timeline :
- Décodage brut hexadécimal / ASCII.
- Découpage structuré : Couche Liaison (Ethernet), Couche Réseau (IP), Couche Transport (TCP/UDP), Couche Applicative.
- Explication contextuelle du rôle de chaque bit et fanion (*flags* SYN, ACK, PSH, FIN...).

---

## 🌍 Support multilingue

L'application intègre nativement 15 langues avec détection automatique et bascule manuelle :

| Code | Langue | Direction | Code | Langue | Direction |
| :---: | :--- | :---: | :---: | :--- | :---: |
| `fr` | Français | LTR | `en` | English | LTR |
| `es` | Español | LTR | `de` | Deutsch | LTR |
| `pt` | Português | LTR | `tr` | Türkçe | LTR |
| `uk` | Українська | LTR | `id` | Bahasa Indonesia | LTR |
| `ja` | 日本語 | LTR | `ko` | 한국어 | LTR |
| `zh-CN`| 简体中文 | LTR | `zh-TW`| 繁體中文 | LTR |
| `hi` | हिन्दी | LTR | `ar` | العربية | **RTL** |
| `he` | עברית | **RTL** | | | |

---

## 🚀 Démarrage rapide

### Prérequis
- [Node.js](https://nodejs.org/) (version 18 ou supérieure recommandée)
- `npm` ou `pnpm`

### Installation & Lancement

```bash
# 1. Cloner le dépôt
git clone https://github.com/neosoda/Protocol.git
cd Protocol

# 2. Installer les dépendances
npm --prefix app install
# ou directement : cd app && npm install

# 3. Démarrer le serveur de développement local
npm run dev
# ou : cd app && npm run dev
```

L'application sera accessible immédiatement sur `http://localhost:5173`.

### Commandes disponibles

| Commande | Action |
| :--- | :--- |
| `npm run dev` | Lance le serveur de développement Vite avec rechargement à chaud (HMR). |
| `npm run build` | Compile l'application pour la production dans le dossier `app/dist/`. |
| `npm run preview` | Prévisualise localement le build de production. |

---

## 🌐 Déploiement

### Déploiement Vercel
Le fichier [`vercel.json`](vercel.json) inclus à la racine configure automatiquement le build :
```bash
npx vercel
```

### Déploiement Netlify / Static Hosting
Spécifiez simplement :
- **Base directory** : `app`
- **Build command** : `npm run build`
- **Publish directory** : `app/dist`

### Déploiement Docker (Nginx)
Un conteneur léger Nginx peut servir directement le dossier `app/dist/` :
```dockerfile
FROM nginx:alpine
COPY app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## 🏗️ Architecture

```
Protocol/
├── app/                      # Application web Vite
│   ├── index.html            # Entrée principale de l'application
│   ├── package.json          # Configuration et dépendances de l'app
│   ├── public/               # Ressources statiques
│   │   ├── assets/           # Bundles compilés, traductions i18n & polices Iosevka
│   │   │   ├── alternate-style.css   # Thème moderne Cyber-Glass
│   │   │   ├── style-switcher.js     # Script de bascule dynamique de thème
│   │   │   └── [lang].js             # Modules de traduction (fr, en, es, ar, etc.)
│   │   ├── favicon.ico
│   │   ├── og.png
│   │   └── site.webmanifest
│   └── dist/                 # Build de production (généré)
├── docs/                     # Documentation et captures d'écran
│   ├── preview-desktop.png   # Capture d'écran HD desktop
│   └── preview-mobile.png    # Capture d'écran HD mobile
├── package.json              # Runner racine pour scripts npm
├── vercel.json               # Configuration de déploiement Vercel
├── .gitignore                # Exclusion des artefacts temporaires et logs
└── README.md                 # Documentation principale
```

---

## 🤝 Contribution

Les contributions, signalements de coquilles ou suggestions d'améliorations sont les bienvenus !

1. Forkez le projet (`https://github.com/neosoda/Protocol/fork`).
2. Créez votre branche thématique (`git checkout -b feature/nouveau-protocole`).
3. Committez vos modifications (`git commit -m 'feat: ajout protocole QUIC/HTTP3'`).
4. Poussez votre branche (`git push origin feature/nouveau-protocole`).
5. Ouvrez une **Pull Request**.

---

## 📄 Licence

Ce projet est distribué sous licence **MIT**. Consultez le fichier [LICENSE](LICENSE) pour plus de détails.

---

<div align="center">
  Développé et maintenu avec soin par <a href="https://github.com/neosoda"><strong>Neosoda</strong></a>.
</div>
