import type { Category, NetworkEvent, PacketField, Participant, ProtocolScenario } from './model.ts';

const field = (layer: PacketField['layer'], name: string, value: string, explanation: string): PacketField =>
  ({ layer, name, value, explanation });
const event = (id: string, from: string, to: string, title: string, description: string, fields: PacketField[] = [], sample?: string): NetworkEvent =>
  ({ id, from, to, title, description, fields, ...(sample === undefined ? {} : { sample }) });
const node = (id: string, name: string, role: string): Participant => ({ id, name, role });
const workstation = node('client', 'Poste client', 'Origine des requêtes');
const router = node('router', 'Routeur', 'Passerelle réseau');
const server = node('server', 'Serveur', 'Service distant');
const resolver = node('resolver', 'Résolveur DNS', 'Résolution de noms');
const dhcp = node('dhcp', 'Serveur DHCP', 'Attribution d’adresse');
const mail = node('mail', 'Serveur de courrier', 'Messagerie');
const auth = node('auth', 'Serveur SSH', 'Accès distant');
const scenario = (
  id: string, name: string, category: Category, level: ProtocolScenario['level'],
  minutes: number, summary: string, objective: string, participants: Participant[], events: NetworkEvent[]
): ProtocolScenario => ({ id, name, category, level, minutes, summary, objective, modelled: true, participants, events });

export const catalog: readonly ProtocolScenario[] = [
  scenario('ip', 'IP', 'network', 'initial', 4, 'Acheminer un datagramme entre deux réseaux.', 'Comprendre l’adresse de destination et le TTL.',
    [workstation, router, server], [
      event('ip-1', 'client', 'router', 'Datagramme IPv4', 'Le poste envoie un datagramme vers une adresse hors de son sous-réseau.', [
        field('network', 'Source', '192.0.2.10', 'Adresse d’exemple réservée à la documentation.'),
        field('network', 'Destination', '203.0.113.20', 'Le routage regarde l’adresse de destination.'),
        field('network', 'TTL', '64', 'Chaque routeur traversé décrémente le TTL.')]),
      event('ip-2', 'router', 'server', 'Transmission', 'Le routeur choisit le prochain saut et décrémente le TTL.', [
        field('network', 'TTL', '63', 'Le TTL diminue de 1 au passage de ce routeur.')]),
      event('ip-3', 'server', 'client', 'Réponse possible', 'Une réponse IP forme un nouveau datagramme dans l’autre sens ; IP seul ne garantit pas la réponse.')
    ]),
  scenario('tcp', 'TCP', 'network', 'initial', 5, 'Établissement d’une connexion fiable.', 'Relier SYN, SYN-ACK, ACK aux numéros de séquence.',
    [workstation, server], [
      event('tcp-1', 'client', 'server', 'SYN', 'Le client propose une connexion avec un numéro de séquence initial fictif.', [
        field('transport', 'Flags', 'SYN', 'Demande de synchronisation des numéros de séquence.'),
        field('transport', 'SEQ', '1000', 'Numéro initial choisi pour cet exemple.')]),
      event('tcp-2', 'server', 'client', 'SYN, ACK', 'Le serveur accepte et acquitte le SYN (il consomme un numéro de séquence).', [
        field('transport', 'Flags', 'SYN, ACK', 'Synchronisation et acquittement.'),
        field('transport', 'SEQ', '5000', 'Numéro de séquence initial côté serveur.'),
        field('transport', 'ACK', '1001', '1000 + 1, car SYN consomme un numéro.')]),
      event('tcp-3', 'client', 'server', 'ACK', 'Le client acquitte le SYN du serveur : la connexion est établie.', [
        field('transport', 'SEQ', '1001', 'Suite du SYN du client.'),
        field('transport', 'ACK', '5001', '5000 + 1, car SYN consomme un numéro.')]),
      event('tcp-4', 'client', 'server', 'Données', 'Un segment contenant trois octets incrémente la prochaine séquence attendue de trois.', [
        field('transport', 'SEQ', '1001', 'Premier octet de données envoyé.'),
        field('transport', 'Longueur', '3 octets', 'La taille des données détermine le prochain ACK.')], 'ABC'),
      event('tcp-5', 'server', 'client', 'ACK des données', 'Le serveur confirme la réception des trois octets.', [
        field('transport', 'ACK', '1004', '1001 + 3 ; acquittement cumulatif.')])
    ]),
  scenario('udp', 'UDP', 'network', 'initial', 3, 'Datagrammes sans établissement de connexion.', 'Distinguer l’absence de connexion et les réponses applicatives.',
    [workstation, server], [
      event('udp-1', 'client', 'server', 'Datagramme', 'Un message est envoyé sans handshake UDP.', [
        field('transport', 'Port source', '53000', 'Port d’origine fictif.'),
        field('transport', 'Port destination', '9000', 'Désigne le service destinataire.')], 'ping'),
      event('udp-2', 'server', 'client', 'Réponse facultative', 'L’application peut répondre ; UDP ne prévoit ni ACK ni retransmission intégrée.', [], 'pong')
    ]),
  scenario('icmp', 'ICMP', 'network', 'initial', 4, 'Diagnostic avec echo request/reply.', 'Identifier les types ICMP et les limites du ping.',
    [workstation, router, server], [
      event('icmp-1', 'client', 'server', 'Echo Request', 'Le poste teste la joignabilité IP de la destination.', [
        field('network', 'Type ICMPv4', '8', 'Echo Request en ICMPv4.')]),
      event('icmp-2', 'server', 'client', 'Echo Reply', 'Si autorisé, l’hôte répond à la requête.', [
        field('network', 'Type ICMPv4', '0', 'Echo Reply en ICMPv4.')]),
      event('icmp-3', 'client', 'router', 'TTL limité', 'Un paquet avec un TTL de 1 expire sur le premier routeur.', [
        field('network', 'TTL', '1', 'Expire après décrémentation au premier routeur.')]),
      event('icmp-4', 'router', 'client', 'Time Exceeded', 'Le routeur peut renvoyer ICMP Time Exceeded (type 11).', [
        field('network', 'Type ICMPv4', '11', 'Annonce l’expiration du temps de vie.')])
    ]),
  scenario('dns', 'DNS', 'network', 'initial', 5, 'Associer un nom de domaine à une adresse.', 'Suivre une requête et distinguer cache, résolution et réponse.',
    [workstation, resolver, server], [
      event('dns-1', 'client', 'resolver', 'Question A', 'Le client demande une adresse IPv4 pour example.test.', [
        field('application', 'QNAME', 'example.test', 'Nom utilisé uniquement comme exemple.'),
        field('application', 'QTYPE', 'A', 'Recherche d’un enregistrement IPv4.'),
        field('transport', 'Transport', 'UDP / 53', 'Chemin classique ; DNS peut aussi utiliser TCP et des transports chiffrés.')]),
      event('dns-2', 'resolver', 'server', 'Résolution simulée', 'En absence de cache, le résolveur effectue d’autres requêtes ; ici la chaîne réelle est volontairement condensée.'),
      event('dns-3', 'server', 'resolver', 'Réponse A', 'Une réponse d’exemple contient une adresse réservée à la documentation.', [
        field('application', 'A', '203.0.113.20', 'Adresse d’exemple TEST-NET-3.')]),
      event('dns-4', 'resolver', 'client', 'Réponse au client', 'Le résolveur fournit le résultat et peut le conserver en cache selon le TTL DNS.')
    ]),
  scenario('dhcp', 'DHCP', 'network', 'initial', 5, 'Obtenir une configuration réseau automatiquement.', 'Reconnaître les quatre messages DORA.',
    [workstation, dhcp], [
      event('dhcp-1', 'client', 'dhcp', 'Discover', 'Un client sans adresse IPv4 cherche un serveur DHCP ; la découverte est généralement diffusée.', [
        field('transport', 'UDP', '68 → 67', 'Ports client et serveur DHCPv4.')]),
      event('dhcp-2', 'dhcp', 'client', 'Offer', 'Le serveur propose une adresse et des options de configuration.', [
        field('network', 'Adresse proposée', '192.0.2.42', 'Adresse pédagogique, non attribuée à un vrai hôte.')]),
      event('dhcp-3', 'client', 'dhcp', 'Request', 'Le client demande officiellement l’offre choisie.'),
      event('dhcp-4', 'dhcp', 'client', 'ACK', 'Le serveur confirme le bail et les paramètres réseau.')
    ]),
  scenario('http', 'HTTP', 'web', 'initial', 4, 'Dialogue HTTP/1.1 en clair, pour l’étude.', 'Lire une requête, une réponse et leurs en-têtes.',
    [workstation, server], [
      event('http-1', 'client', 'server', 'GET /', 'Le client demande la ressource racine sur une connexion TCP déjà ouverte.', [
        field('application', 'Méthode', 'GET', 'Lecture de la ressource.'),
        field('application', 'Host', 'example.test', 'Hôte HTTP demandé.')], 'GET / HTTP/1.1\r\nHost: example.test\r\n\r\n'),
      event('http-2', 'server', 'client', '200 OK', 'Le serveur retourne un statut et un petit corps texte fictif.', [
        field('application', 'Statut', '200', 'La requête a été traitée avec succès.'),
        field('application', 'Content-Type', 'text/plain', 'Indique le type du corps.')], 'HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\n\r\nBonjour')
    ]),
  scenario('https', 'HTTPS', 'web', 'intermediate', 5, 'HTTP protégé par une session TLS.', 'Distinguer HTTP du canal TLS qui le transporte.',
    [workstation, server], [
      event('https-1', 'client', 'server', 'ClientHello', 'Le client commence la négociation TLS 1.3.', [
        field('security', 'Protocole', 'TLS 1.3', 'Chiffrement et authentification du serveur.')]),
      event('https-2', 'server', 'client', 'ServerHello', 'Le serveur choisit les paramètres cryptographiques ; les messages suivants de négociation sont en grande partie chiffrés.'),
      event('https-3', 'client', 'server', 'Requête HTTP chiffrée', 'Après établissement des clés et fin du handshake, les données HTTP passent dans des enregistrements TLS chiffrés.'),
      event('https-4', 'server', 'client', 'Réponse chiffrée', 'Le contenu HTTP de la réponse n’est pas lisible sur le réseau sans les clés de session.')
    ]),
  scenario('smtp', 'SMTP', 'web', 'intermediate', 5, 'Soumettre un courrier à un serveur SMTP.', 'Ordonner EHLO, MAIL FROM, RCPT TO et DATA.',
    [workstation, mail], [
      event('smtp-1', 'mail', 'client', '220 Service prêt', 'Le serveur annonce qu’il est prêt à accepter une session.'),
      event('smtp-2', 'client', 'mail', 'EHLO', 'Le client se présente et demande les extensions SMTP.', [
        field('application', 'Commande', 'EHLO', 'Annonce l’identité du client SMTP.')], 'EHLO client.example.test\r\n'),
      event('smtp-3', 'client', 'mail', 'MAIL FROM', 'Définit l’adresse d’enveloppe de l’expéditeur, distincte du champ From du message.'),
      event('smtp-4', 'client', 'mail', 'RCPT TO', 'Déclare le destinataire de l’enveloppe.'),
      event('smtp-5', 'client', 'mail', 'DATA', 'Le client transmet les en-têtes et le corps, puis termine par <CRLF>.<CRLF> ; réponses intermédiaires omises.')
    ]),
  scenario('pop3', 'POP3', 'web', 'intermediate', 4, 'Consulter une boîte avec POP3.', 'Distinguer authentification, liste et récupération.',
    [workstation, mail], [
      event('pop3-1', 'mail', 'client', '+OK', 'Le serveur présente sa bannière POP3.'),
      event('pop3-2', 'client', 'mail', 'USER / PASS', 'Authentification simplifiée ; sur le réseau public préférer POP3S/TLS.'),
      event('pop3-3', 'client', 'mail', 'STAT / LIST', 'Le client demande combien de messages sont disponibles puis leurs tailles.'),
      event('pop3-4', 'client', 'mail', 'RETR 1', 'Le client récupère un message ; il ne sera pas automatiquement supprimé.'),
      event('pop3-5', 'client', 'mail', 'QUIT', 'Termine proprement la session ; DELE peut avoir marqué des messages pour suppression.')
    ]),
  scenario('imap', 'IMAP', 'web', 'intermediate', 5, 'Synchroniser une boîte avec IMAP.', 'Comprendre sélection de dossier et flags de messages.',
    [workstation, mail], [
      event('imap-1', 'mail', 'client', '* OK', 'Le serveur annonce IMAP prêt.'),
      event('imap-2', 'client', 'mail', 'A001 LOGIN', 'Exemple de commande étiquetée ; utiliser TLS et une méthode d’authentification adaptée.'),
      event('imap-3', 'client', 'mail', 'A002 SELECT INBOX', 'Le client sélectionne la boîte et reçoit son état.'),
      event('imap-4', 'client', 'mail', 'A003 FETCH', 'Lecture d’un message et de ses attributs, notamment les flags.'),
      event('imap-5', 'client', 'mail', 'A004 STORE', 'Le client peut modifier des flags ; le serveur synchronise cet état.')
    ]),
  scenario('ftp', 'FTP', 'web', 'advanced', 5, 'Séparer commande et données FTP.', 'Identifier les deux connexions et leurs rôles.',
    [workstation, server], [
      event('ftp-1', 'client', 'server', 'Connexion de contrôle', 'Une connexion TCP arrive sur le port 21 du serveur FTP.', [
        field('transport', 'Port serveur', '21/TCP', 'Canal de commandes FTP.')]),
      event('ftp-2', 'client', 'server', 'USER / PASS', 'Authentification illustrée en clair : FTP traditionnel ne protège pas les identifiants.'),
      event('ftp-3', 'client', 'server', 'EPSV', 'Le client demande un port de données en mode passif étendu.'),
      event('ftp-4', 'server', 'client', '229 Entering Extended Passive Mode', 'Le serveur annonce le port dynamique à utiliser sur une connexion distincte.'),
      event('ftp-5', 'client', 'server', 'Canal données', 'Le client ouvre une seconde connexion TCP pour transférer les données ; détail condensé.')
    ]),
  scenario('ssh', 'SSH', 'security', 'advanced', 6, 'Authentifier un serveur et ouvrir un canal protégé.', 'Comprendre négociation, échange de clés et authentification.',
    [workstation, auth], [
      event('ssh-1', 'client', 'auth', 'Identification de version', 'Les deux pairs échangent leurs chaînes d’identification SSH.'),
      event('ssh-2', 'client', 'auth', 'KEXINIT', 'Le client propose les algorithmes supportés.'),
      event('ssh-3', 'auth', 'client', 'Négociation / échange de clés', 'Un échange de clés partagé est effectué, puis le client vérifie la clé d’hôte ; algorithmes volontairement non figés.'),
      event('ssh-4', 'client', 'auth', 'Authentification utilisateur', 'Après protection du transport, le client prouve son identité via une méthode autorisée.'),
      event('ssh-5', 'client', 'auth', 'Ouverture de canal', 'Un canal de session peut transporter un shell ou une commande, toujours à l’intérieur du transport SSH.')
    ]),
  scenario('tls', 'TLS 1.3', 'security', 'advanced', 6, 'Négocier une session chiffrée avec TLS 1.3.', 'Distinguer messages visibles, messages protégés et Finished.',
    [workstation, server], [
      event('tls-1', 'client', 'server', 'ClientHello', 'Le client envoie notamment les suites supportées et une part de clé ECDHE.', [
        field('security', 'supported_versions', 'TLS 1.3', 'Annonce la version prise en charge.'),
        field('security', 'key_share', 'ECDHE (illustratif)', 'Part publique d’un secret éphémère.')]),
      event('tls-2', 'server', 'client', 'ServerHello', 'Le serveur répond avec sa sélection et sa propre part de clé.'),
      event('tls-3', 'server', 'client', 'EncryptedExtensions / Certificate / Finished', 'Ces messages de la poignée de main TLS 1.3 sont protégés après ServerHello ; regroupement pédagogique.'),
      event('tls-4', 'client', 'server', 'Finished', 'Le client vérifie le transcript et confirme les clés de la négociation.'),
      event('tls-5', 'client', 'server', 'Application Data', 'La couche applicative échange alors des données chiffrées.')
    ])
];

export const findScenario = (id: string): ProtocolScenario => catalog.find(p => p.id === id) ?? catalog[0];
export const categories: readonly Category[] = ['network', 'web', 'security'];
