import { T, type Scenario, type Topology } from '../model.ts';
import { dhcp, dns, type DnsMessage } from '../packets/app.ts';
import { ipv4, PROTO, udp } from '../packets/net.ts';
import { box, events, IP, laptop, MAC, node } from './kit.ts';

const lan: Topology = {
  nodes: [
    laptop(130, 380),
    node('ap', 'switch', T('Point d’accès Wi-Fi', 'Wi-Fi access point'), 420, 250),
    node('phone', 'phone', T('Téléphone', 'Phone'), 160, 120, IP.phone),
    node('tv', 'laptop', T('Autre ordinateur', 'Other computer'), 460, 450, '192.168.1.40'),
    { ...box(780, 250), label: T('Box · serveur DHCP', 'Router · DHCP server') }
  ],
  links: [['client', 'ap'], ['phone', 'ap'], ['tv', 'ap'], ['ap', 'box']]
};
const XID = 0x5e1f2a90;
const OFFERED = '192.168.1.23';
const NONE = '0.0.0.0';
const ALL = '255.255.255.255';
const fromClient = (m: Parameters<typeof dhcp>[0], id: number) =>
  ipv4({ src: NONE, dst: ALL, ttl: 64, id, df: false }, PROTO.udp, udp({ sport: 68, dport: 67 }, NONE, ALL, [dhcp(m)]));
const fromServer = (m: Parameters<typeof dhcp>[0], id: number) =>
  ipv4({ src: IP.box, dst: ALL, ttl: 64, id, df: false }, PROTO.udp, udp({ sport: 67, dport: 68 }, IP.box, ALL, [dhcp(m)]));

export const dhcpScenario: Scenario = {
  id: 'dhcp', name: 'DHCP', category: 'services', level: 1,
  tagline: T('Obtenir une adresse en arrivant sur un réseau', 'Getting an address when joining a network'),
  intro: T(
    'Un ordinateur qui rejoint un Wi-Fi n’a pas encore d’adresse IP. DHCP la lui fournit en quatre messages, qu’on retient sous le nom DORA : Discover, Offer, Request, Acknowledge. Comme le client ne connaît encore personne, il parle à tout le monde par diffusion.',
    'A computer joining a Wi-Fi network has no IP address yet. DHCP hands it one in four messages, remembered as DORA: Discover, Offer, Request, Acknowledge. Since the client knows nobody yet, it talks to everyone by broadcast.'),
  topology: lan,
  actors: ['client', 'box'],
  events: events('dhcp', [
    {
      from: 'client', to: 'box', label: 'DISCOVER', tone: 'broadcast', also: ['phone', 'tv'],
      title: T('Discover : « y a-t-il un serveur DHCP ? »', 'Discover: “is there a DHCP server?”'),
      text: T(
        'Sans adresse, l’ordinateur émet depuis 0.0.0.0 vers 255.255.255.255 : tous les appareils du réseau local reçoivent la question, mais seul un serveur DHCP y répondra. Il s’identifie par son adresse MAC et un numéro de transaction.',
        'With no address, the computer sends from 0.0.0.0 to 255.255.255.255: every device on the local network gets the question, but only a DHCP server will answer. It identifies itself by its MAC address and a transaction number.'),
      parts: fromClient({ type: 'DISCOVER', xid: XID, mac: MAC, broadcast: true }, 0x0001)
    },
    {
      from: 'box', to: 'client', label: 'OFFER', tone: 'broadcast', also: ['phone', 'tv'],
      title: T('Offer : une proposition', 'Offer: a proposal'),
      text: T(
        'La box propose 192.168.1.23 (champ yiaddr) avec un bail de 24 h, le masque, la passerelle et le DNS. Le client n’ayant pas d’adresse, la réponse est diffusée ; il la reconnaît grâce au numéro de transaction.',
        'The router offers 192.168.1.23 (the yiaddr field) with a 24-hour lease, the mask, the gateway and the DNS. As the client has no address, the reply is broadcast; it recognises it by the transaction number.'),
      parts: fromServer({ type: 'OFFER', xid: XID, mac: MAC, yiaddr: OFFERED, server: IP.box, broadcast: true }, 0x4c01)
    },
    {
      from: 'client', to: 'box', label: 'REQUEST', tone: 'broadcast', also: ['phone', 'tv'],
      title: T('Request : « j’accepte cette offre »', 'Request: “I’ll take this offer”'),
      text: T(
        'Le client demande officiellement l’adresse proposée et nomme le serveur choisi. Il diffuse encore ce message : s’il y avait plusieurs serveurs DHCP, les autres comprendraient que leur offre est déclinée.',
        'The client formally requests the offered address and names the chosen server. It broadcasts again: if several DHCP servers had answered, the others would learn their offer was declined.'),
      parts: fromClient({ type: 'REQUEST', xid: XID, mac: MAC, requested: OFFERED, server: IP.box, broadcast: true }, 0x0002)
    },
    {
      from: 'box', to: 'client', label: 'ACK', tone: 'broadcast', also: ['phone', 'tv'],
      title: T('ACK : l’adresse est attribuée', 'ACK: the address is assigned'),
      text: T(
        'La box confirme le bail. L’ordinateur configure 192.168.1.23/24, passe par 192.168.1.1 pour sortir et interrogera ce même DNS. Il renouvellera son bail à mi-parcours, cette fois directement auprès du serveur.',
        'The router confirms the lease. The computer sets 192.168.1.23/24, goes through 192.168.1.1 to get out and will ask that same DNS. It will renew its lease halfway through, this time directly with the server.'),
      parts: fromServer({ type: 'ACK', xid: XID, mac: MAC, yiaddr: OFFERED, server: IP.box, broadcast: true }, 0x4c02)
    }
  ])
};

const dnsMap: Topology = {
  nodes: [
    laptop(90, 400),
    node('resolver', 'dns', T('Résolveur du FAI', 'ISP resolver'), 400, 400, IP.resolver),
    node('root', 'dns', T('Serveur racine', 'Root server'), 700, 90, IP.root),
    node('tld', 'dns', T('Serveur .com', '.com server'), 880, 250, IP.tld),
    node('auth', 'dns', T('Serveur de example.com', 'example.com server'), 720, 420, IP.auth)
  ],
  links: [['client', 'resolver'], ['resolver', 'root'], ['resolver', 'tld'], ['resolver', 'auth']]
};
const NAME = 'www.example.com';
const query = (src: string, dst: string, sport: number, m: DnsMessage, id: number) =>
  ipv4({ src, dst, id }, PROTO.udp, udp({ sport, dport: 53 }, src, dst, [dns(m)]));
const reply = (src: string, dst: string, dport: number, m: DnsMessage, id: number) =>
  ipv4({ src, dst, id, ttl: 57 }, PROTO.udp, udp({ sport: 53, dport }, src, dst, [dns(m)]));

export const dnsScenario: Scenario = {
  id: 'dns', name: 'DNS', category: 'services', level: 2,
  tagline: T('Traduire un nom en adresse', 'Turning a name into an address'),
  intro: T(
    'Avant tout échange avec www.example.com, il faut son adresse IP. L’ordinateur pose la question à un résolveur, qui descend l’arborescence du DNS : la racine l’envoie vers les serveurs de .com, qui l’envoient vers ceux de example.com, qui connaissent la réponse.',
    'Before talking to www.example.com, its IP address is needed. The computer asks a resolver, which walks down the DNS tree: the root points it to the .com servers, which point it to example.com’s servers, which know the answer.'),
  topology: dnsMap,
  actors: ['client', 'resolver', 'root', 'tld', 'auth'],
  events: events('dns', [
    {
      from: 'client', to: 'resolver', label: 'A ?',
      title: T('La question de l’ordinateur', 'The computer’s question'),
      text: T(
        'Une requête UDP vers le port 53 : « quelle est l’adresse IPv4 (type A) de www.example.com ? ». Le bit RD demande au résolveur de faire tout le travail.',
        'A UDP query to port 53: “what is the IPv4 address (type A) of www.example.com?”. The RD bit asks the resolver to do all the work.'),
      parts: query(IP.laptop, IP.resolver, 53188, { id: 0x9c3e, question: NAME, rd: true }, 0x5100)
    },
    {
      from: 'resolver', to: 'root', label: 'A ?',
      title: T('Le résolveur demande à la racine', 'The resolver asks the root'),
      text: T(
        'Son cache est vide : le résolveur commence par l’un des 13 serveurs racine, dont l’adresse est inscrite dans sa configuration. Il ne demande pas de récursion (RD = 0).',
        'Its cache is empty, so the resolver starts at one of the 13 root servers, whose addresses ship with its configuration. It does not ask for recursion (RD = 0).'),
      parts: query(IP.resolver, IP.root, 40711, { id: 0x2b01, question: NAME }, 0x0a10)
    },
    {
      from: 'root', to: 'resolver', label: '→ .com',
      title: T('La racine renvoie vers .com', 'The root refers to .com'),
      text: T(
        'La racine ne connaît pas www.example.com, mais sait qui gère .com. Sa réponse ne contient aucune réponse (ANCOUNT = 0) : seulement un serveur à interroger, en section autorité, et son adresse en section additionnelle.',
        'The root does not know www.example.com but knows who runs .com. Its reply has no answer (ANCOUNT = 0): just a server to ask, in the authority section, and its address in the additional section.'),
      parts: reply(IP.root, IP.resolver, 40711, {
        id: 0x2b01, question: NAME, response: true,
        authority: [{ name: 'com', type: 'NS', ttl: 172800, data: 'a.gtld-servers.net' }],
        additional: [{ name: 'a.gtld-servers.net', type: 'A', ttl: 172800, data: IP.tld }]
      }, 0x77d2)
    },
    {
      from: 'resolver', to: 'tld', label: 'A ?',
      title: T('Le résolveur demande à .com', 'The resolver asks .com'),
      text: T(
        'Même question, posée cette fois au serveur de .com. Le résolveur mémorise au passage l’adresse de ce serveur pour les prochaines requêtes en .com.',
        'Same question, now asked of the .com server. The resolver also caches that server’s address for future .com lookups.'),
      parts: query(IP.resolver, IP.tld, 40712, { id: 0x2b02, question: NAME }, 0x0a11)
    },
    {
      from: 'tld', to: 'resolver', label: '→ example.com',
      title: T('.com renvoie vers example.com', '.com refers to example.com'),
      text: T(
        'Le serveur de .com délègue à son tour : example.com est géré par ns1.example.com, dont il fournit l’adresse.',
        'The .com server delegates in turn: example.com is run by ns1.example.com, whose address it supplies.'),
      parts: reply(IP.tld, IP.resolver, 40712, {
        id: 0x2b02, question: NAME, response: true,
        authority: [{ name: 'example.com', type: 'NS', ttl: 172800, data: 'ns1.example.com' }],
        additional: [{ name: 'ns1.example.com', type: 'A', ttl: 172800, data: IP.auth }]
      }, 0x1e04)
    },
    {
      from: 'resolver', to: 'auth', label: 'A ?',
      title: T('Dernière étape : le serveur faisant autorité', 'Last stop: the authoritative server'),
      text: T(
        'Le résolveur interroge enfin le serveur qui détient la zone example.com.',
        'The resolver finally asks the server that holds the example.com zone.'),
      parts: query(IP.resolver, IP.auth, 40713, { id: 0x2b03, question: NAME }, 0x0a12)
    },
    {
      from: 'auth', to: 'resolver', label: 'A 203.0.113.10',
      title: T('La réponse qui fait autorité', 'The authoritative answer'),
      text: T(
        'Cette fois, la section réponse contient l’enregistrement A, et le bit AA atteste qu’il vient de la source officielle. Son TTL de 3 600 s autorise le résolveur à le garder une heure en cache.',
        'This time the answer section holds the A record, and the AA bit vouches it comes from the official source. Its 3,600 s TTL lets the resolver cache it for an hour.'),
      parts: reply(IP.auth, IP.resolver, 40713, {
        id: 0x2b03, question: NAME, response: true, aa: true,
        answers: [{ name: NAME, type: 'A', ttl: 3600, data: IP.web }]
      }, 0x3a99)
    },
    {
      from: 'resolver', to: 'client', label: 'A 203.0.113.10',
      title: T('L’ordinateur a son adresse', 'The computer has its address'),
      text: T(
        'Le résolveur répond à la question d’origine, avec le même identifiant 0x9c3e. Les prochains visiteurs de www.example.com chez ce FAI obtiendront la réponse immédiatement, depuis le cache.',
        'The resolver answers the original question, with the same identifier 0x9c3e. The next visitors of www.example.com at this ISP will get the answer at once, from the cache.'),
      parts: reply(IP.resolver, IP.laptop, 53188, {
        id: 0x9c3e, question: NAME, response: true, rd: true, ra: true,
        answers: [{ name: NAME, type: 'A', ttl: 3600, data: IP.web }]
      }, 0x6f20)
    }
  ])
};
