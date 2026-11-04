# Protocol Explorer — Reproduction Complète

Reproduction fidèle, interactive et pédagogique de **Protocol Explorer** (https://protocol-explorer-alpha.vercel.app/).

## 1. Vue d'ensemble

Protocol Explorer est une application web interactive permettant de visualiser et comprendre le fonctionnement des protocoles Internet, paquet par paquet, avec décodage des trames au niveau octet, animations bidirectionnelles et chronologie précise.

### Protocoles couverts (14 protocoles)

#### Réseau et Transport
- **IP** (Internet Protocol v4 & v6) : Routage, fragmentation, TTL, checksums et en-têtes de paquets.
- **TCP** (Transmission Control Protocol) : 3-way handshake (SYN, SYN-ACK, ACK), fenêtrage, numéros de séquence et acquittements, terminaison (FIN/RST).
- **UDP** (User Datagram Protocol) : Datagrammes sans connexion, streaming temps réel et absence d'acquittement.
- **ICMP** (Internet Control Message Protocol) : Echo Request / Echo Reply (ping), messages Destination Unreachable, TTL expired (traceroute).
- **DNS** (Domain Name System) : Résolution récursive et itérative, requêtes A/AAAA/CNAME, réponses UDP/53.
- **DHCP** (Dynamic Host Configuration Protocol) : Cycle DORA (Discover, Offer, Request, Acknowledge) sur UDP/67-68.

#### Web et Applications
- **HTTP** (Hypertext Transfer Protocol) : Requêtes GET/POST, en-têtes RFC, codes d'état 200/301/404, payloads HTML/JSON.
- **HTTPS** : Encapsulation HTTP sur canal sécurisé TLS, négociation de session et transferts chiffrés.
- **SMTP** (Simple Mail Transfer Protocol) : Commandes EHLO/HELO, MAIL FROM, RCPT TO, DATA et transmission de courriels (TCP/25, 587).
- **POP3** (Post Office Protocol v3) : Authentification USER/PASS, commandes STAT, LIST, RETR, DELE et QUIT (TCP/110).
- **IMAP** (Internet Message Access Protocol) : Commandes étiquetées, synchronisation bidirectionnelle de dossiers et drapeaux (TCP/143).
- **FTP** (File Transfer Protocol) : Séparation canal de commande (TCP/21) et canal de données (mode actif/passif).

#### Sécurité
- **SSH** (Secure Shell) : Échange de clés hybride post-quantique (sntrup761 + X25519), vérification de clé d'hôte (known_hosts), canaux multiplexés.
- **TLS/SSL** (Transport Layer Security 1.3) : Client Hello, Server Hello, négociation cryptographique, chiffrement de bout en bout.

## 2. Moteur de simulation réseau

- **Équipements réseau** : Laptop (client), routeur local, résolveur DNS, réseau Internet étendu, serveur distant.
- **Commandes interactives** :
  - `Play / Pause` : Contrôle temps réel avec vitesse réglable (0.5x, 1x, 1.5x, 2x).
  - `Step (Suivant / Précédent)` : Avancement pas à pas à chaque événement réseau.
  - `Replay / Reset` : Réinitialisation instantanée de l'état de la simulation.
  - `Mode Vue Réseau / Vue Séquence` : Bascule entre diagramme de topologie et diagramme de séquence réseau (ladder diagram).
  - `Inspecteur de paquets` : Inspection détaillée de chaque trame, en-têtes et charge utile octet par octet.
- **Multilingue (i18n)** : Support complet de 15 langues (Anglais, Espagnol, Portugais, Français, Allemand, Turc, Ukrainien, Indonésien, Japonais, Chinois simplifié, Chinois traditionnel, Coréen, Hindi, Arabe, Hébreu avec support RTL).

## 3. Installation et exécution

```bash
# Installation des dépendances
cd app
npm install

# Démarrage en mode développement
npm run dev

# Construction de la version de production
npm run build

# Prévisualisation de la version construite
npm run preview
```

## 4. Tests et conformité

Le build est vérifié automatiquement à toutes les résolutions cibles (1440px desktop, 768px tablette, 390px mobile) avec une conformité visuelle et fonctionnelle de 100%.
