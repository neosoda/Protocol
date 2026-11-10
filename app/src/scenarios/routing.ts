import { T, type Scenario, type Topology } from '../model.ts';
import { ascii } from '../packets/bytes.ts';
import { icmpEcho, ipv4, PROTO, TcpFlow, udp } from '../packets/net.ts';
import { bgpKeepalive, bgpOpen, bgpUpdate, bgpWithdraw, ospfAck, ospfDbd, ospfHello, ospfRequest, ospfUpdate, ripRequest, ripResponse } from '../packets/routing.ts';
import { events, node } from './kit.ts';

/** Links are schematic point-to-point adjacencies; no fictitious core device. */
const routers: Topology = {
  nodes: [
    node('r1', 'network-router', T('Routeur R1', 'Router R1'), 125, 270, '10.0.12.1'),
    node('r2', 'network-router', T('Routeur R2', 'Router R2'), 470, 270, '10.0.12.2'),
    node('r3', 'network-router', T('Routeur R3', 'Router R3'), 815, 270, '10.0.23.3')
  ],
  links: [['r1', 'r2'], ['r2', 'r3']]
};
const R = {
  r1: '10.0.12.1', r2left: '10.0.12.2', r2right: '10.0.23.2', r3: '10.0.23.3',
  id1: '10.0.0.1', id2: '10.0.0.2', id3: '10.0.0.3'
} as const;
const ALL_OSPF = '224.0.0.5';
const ALL_RIP = '224.0.0.9';
const prefix = '10.10.30.0', mask = '255.255.255.0';
const ospfIp = (src: string, dst: string, payload: ReturnType<typeof ospfHello>, id: number) =>
  ipv4({ src, dst, ttl: 1, id, df: false }, 89, [payload]);
const ripIp = (src: string, payload: ReturnType<typeof ripResponse>, id: number) =>
  ipv4({ src, dst: ALL_RIP, ttl: 1, id, df: false }, PROTO.udp,
    udp({ sport: 520, dport: 520 }, src, ALL_RIP, [payload]));

export const ospf: Scenario = {
  id: 'ospf', name: 'OSPFv2', category: 'routing', level: 2,
  tagline: T('Voisins, états de liens et calcul SPF', 'Neighbors, link-state flooding and SPF'),
  intro: T(
    'OSPF est un protocole de routage intérieur à état de liens. Des routeurs voisins échangent des Hello (IP 89, pas TCP ni UDP), synchronisent leurs bases LSDB, diffusent des LSA et calculent les meilleurs chemins avec SPF (Dijkstra). Cette démonstration montre la zone 0, sur des liens point-à-point : aucun routeur « cœur de réseau » artificiel.',
    'OSPF is an interior link-state routing protocol. Neighbor routers exchange Hello packets (IP protocol 89, neither TCP nor UDP), synchronize link-state databases, flood LSAs and compute shortest paths with SPF (Dijkstra). This lab uses area 0 over point-to-point links, without an artificial core router.'),
  topology: routers,
  actors: ['r1', 'r2', 'r3'],
  events: events('ospf', [
    {
      from: 'r2', to: 'r3', label: 'Hello · 224.0.0.5',
      title: T('R2 découvre son voisin R3', 'R2 discovers neighbor R3'),
      text: T('R2 envoie un Hello OSPF sur son lien vers R3. Le multicast 224.0.0.5 et le TTL de 1 limitent le message à cette liaison. Masque, temporisations et zone doivent être compatibles.',
        'R2 sends an OSPF Hello on its R3 link. Multicast 224.0.0.5 and TTL 1 keep the message on this link. Area, timers and mask must be compatible.'),
      parts: ospfIp(R.r2right, ALL_OSPF, ospfHello(R.id2), 0x9001)
    },
    {
      from: 'r3', to: 'r2', label: 'Hello · 2-Way',
      title: T('R3 confirme la découverte bidirectionnelle', 'R3 confirms two-way discovery'),
      text: T('R3 répond avec un Hello qui mentionne le Router ID de R2 dans la liste des voisins. L’état 2-Way est atteint ; sur cette liaison point-à-point, les routeurs vont former une adjacence complète.',
        'R3 replies with a Hello listing R2’s Router ID as a neighbor. They reach 2-Way; on this point-to-point link they proceed toward full adjacency.'),
      parts: ospfIp(R.r3, ALL_OSPF, ospfHello(R.id3, [R.id2]), 0x9002)
    },
    {
      from: 'r3', to: 'r2', label: 'DB Description',
      title: T('Comparaison des bases de topologie', 'Comparing topology databases'),
      text: T('Après la négociation maître/esclave, R3 transmet un Database Description contenant l’en-tête de sa Router-LSA. Le numéro de séquence synchronise la comparaison : R2 constate qu’il lui manque cette annonce.',
        'After master/slave negotiation, R3 sends a Database Description containing its Router-LSA header. The sequence number tracks the exchange: R2 notices it lacks this advertisement.'),
      parts: ospfIp(R.r3, R.r2right, ospfDbd(R.id3, 0x0123abcd, 0, R.id3), 0x9003)
    },
    {
      from: 'r2', to: 'r3', label: 'LS Request',
      title: T('R2 demande l’annonce manquante', 'R2 requests the missing advertisement'),
      text: T('R2 veut la Router-LSA de R3. Une Link State Request précise le type, le Link State ID et le routeur annonceur : pas besoin de recopier toute la base.',
        'R2 wants R3’s Router-LSA. A Link State Request identifies its type, Link State ID and advertising router, without copying the whole database.'),
      parts: ospfIp(R.r2right, R.r3, ospfRequest(R.id2, R.id3), 0x9004)
    },
    {
      from: 'r3', to: 'r2', label: 'LS Update · coût 10', tone: 'data',
      title: T('R3 décrit son réseau directement connecté', 'R3 describes its connected network'),
      text: T('Le Link State Update transporte la Router-LSA de R3 : réseau terminal 10.10.30.0/24, coût 10, numéro de séquence et somme Fletcher de la LSA. Une LSA décrit une topologie, pas une simple distance en sauts.',
        'The Link State Update carries R3’s Router-LSA: stub network 10.10.30.0/24, cost 10, sequence number and LSA Fletcher checksum. An LSA describes topology, not just a hop count.'),
      parts: ospfIp(R.r3, ALL_OSPF, ospfUpdate(R.id3, R.id3), 0x9005)
    },
    {
      from: 'r2', to: 'r3', label: 'LS Ack',
      title: T('R2 acquitte la LSA', 'R2 acknowledges the LSA'),
      text: T('OSPF utilise ses propres acquittements pour fiabiliser la diffusion des LSA. R2 accuse réception avec l’en-tête de l’annonce, sans retransmettre son contenu.',
        'OSPF uses its own acknowledgments for reliable LSA flooding. R2 acknowledges the advertisement with its header, without repeating its payload.'),
      parts: ospfIp(R.r2right, R.r3, ospfAck(R.id2, R.id3), 0x9006)
    },
    {
      from: 'r2', to: 'r1', label: 'Flooding · LSA R3', tone: 'data',
      title: T('R2 diffuse l’information à R1', 'R2 floods the information to R1'),
      text: T('R2 retransmet la LSA de R3 vers son autre voisin déjà adjacent, R1. L’Advertising Router reste R3 : R2 ne prétend pas avoir créé ce réseau. Les routeurs d’une zone convergent vers la même LSDB.',
        'R2 floods R3’s LSA to its other already-adjacent neighbor, R1. The Advertising Router remains R3: R2 does not claim to originate the network. Routers within an area converge on the same LSDB.'),
      parts: ospfIp(R.r2left, ALL_OSPF, ospfUpdate(R.id2, R.id3), 0x9007)
    },
    {
      from: 'r1', to: 'r3', label: 'SPF · via R2', tone: 'data',
      title: T('Le chemin calculé passe par R2', 'The computed path goes through R2'),
      text: T('Une fois les annonces intégrées, R1 calcule un chemin vers R3 et son réseau : R1 → R2 → R3. Le paquet ICMP illustratif suit ce trajet. Dans un réseau réel, SPF compare la somme des coûts de chaque chemin disponible.',
        'After receiving the LSAs, R1 computes a route to R3 and its network: R1 → R2 → R3. This illustrative ICMP packet follows that route. In real networks, SPF compares summed link costs across available paths.'),
      parts: ipv4({ src: R.r1, dst: R.r3, ttl: 64, id: 0x9010 }, PROTO.icmp,
        icmpEcho(8, 0x1010, 1, ascii('route-ospf')))
    }
  ])
};

export const rip: Scenario = {
  id: 'rip', name: 'RIPv2', category: 'routing', level: 1,
  tagline: T('Le routage à vecteur de distance et ses limites', 'Distance-vector routing and its limits'),
  intro: T(
    'RIPv2 échange des routes entre voisins avec UDP 520 et le multicast 224.0.0.9. Sa métrique compte les routeurs traversés : 1 pour un réseau directement connecté, 16 pour injoignable, donc au plus 15 sauts utiles. On suit la propagation d’un préfixe puis son empoisonnement après une panne. Les mises à jour normales sont périodiques (environ 30 secondes), mais les changements peuvent déclencher des annonces immédiates.',
    'RIPv2 shares routes with neighbors over UDP 520 to multicast 224.0.0.9. Its metric counts hops: 1 for a directly connected network, 16 for unreachable, meaning at most 15 usable hops. Follow a prefix advertisement, then route poisoning after a failure. Regular updates are sent about every 30 seconds, while changes can trigger earlier updates.'),
  topology: routers,
  actors: ['r1', 'r2', 'r3'],
  events: events('rip', [
    {
      from: 'r1', to: 'r2', label: 'Request · table',
      title: T('R1 demande des informations de routage', 'R1 requests routing information'),
      text: T('R1 peut solliciter une table complète avec une Request RIPv2 (famille 0, métrique 16). UDP 520 envoie le message à 224.0.0.9, réservé aux routeurs du lien local.',
        'R1 can request an entire table with a RIPv2 Request (family 0, metric 16). UDP 520 carries it to 224.0.0.9, for local-link routers only.'),
      parts: ripIp(R.r1, ripRequest(), 0xa001)
    },
    {
      from: 'r3', to: 'r2', label: '10.10.30.0/24 · 1', tone: 'data',
      title: T('R3 annonce son réseau connecté', 'R3 advertises its connected network'),
      text: T('R3 annonce 10.10.30.0/24, directement connecté, avec une métrique 1. Le masque apparaît dans le paquet RIPv2, contrairement à RIPv1.',
        'R3 advertises directly connected 10.10.30.0/24 at metric 1. Unlike RIPv1, RIPv2 includes the subnet mask in its packet.'),
      parts: ripIp(R.r3, ripResponse(prefix, mask, 1), 0xa002)
    },
    {
      from: 'r2', to: 'r1', label: '10.10.30.0/24 · 2', tone: 'data',
      title: T('R2 ajoute un saut et transmet la route', 'R2 adds a hop and shares the route'),
      text: T('R2 a appris le préfixe via R3 avec une distance de 2 sauts en le réannonçant à R1. L’horizon partagé (split horizon) empêche normalement de renvoyer la même route vers R3.',
        'R2 learned the prefix from R3 and advertises it to R1 at metric 2. Split horizon normally prevents sending that learned route straight back to R3.'),
      parts: ripIp(R.r2left, ripResponse(prefix, mask, 2), 0xa003)
    },
    {
      from: 'r1', to: 'r3', label: 'Données · via R2', tone: 'data',
      title: T('Le trafic utilise la route apprise', 'Traffic uses the learned route'),
      text: T('R1 transmet vers R3 en passant par R2. L’animation illustre l’acheminement après convergence ; RIP échange des routes, mais ne transporte pas lui-même les données applicatives.',
        'R1 forwards toward R3 via R2. The animation shows forwarding after convergence; RIP exchanges routes but does not itself carry application data.'),
      parts: ipv4({ src: R.r1, dst: R.r3, ttl: 64, id: 0xa004 }, PROTO.icmp,
        icmpEcho(8, 0x2222, 1, ascii('route-rip')))
    },
    {
      from: 'r3', to: 'r2', label: 'Métrique 16', tone: 'alert',
      title: T('Le réseau de R3 devient indisponible', 'R3’s subnet becomes unreachable'),
      text: T('La liaison du réseau 10.10.30.0/24 tombe (R3 reste joignable sur son lien avec R2). R3 déclenche une annonce avec métrique 16 : le préfixe est empoisonné.',
        'The 10.10.30.0/24 access network fails (R3 remains reachable from R2). R3 sends a triggered update with metric 16: the prefix is poisoned.'),
      parts: ripIp(R.r3, ripResponse(prefix, mask, 16), 0xa005)
    },
    {
      from: 'r2', to: 'r1', label: 'Retrait · 16', tone: 'alert',
      title: T('R2 avertit R1 que la route est perdue', 'R2 warns R1 that the route is lost'),
      text: T('R2 propage l’inaccessibilité vers R1 avec métrique 16. La convergence peut être lente dans un réseau RIP complexe ; split horizon et poison reverse limitent certaines boucles, sans supprimer toutes ses limites.',
        'R2 propagates the unreachable metric 16 to R1. Convergence can be slow on complex RIP networks; split horizon and poison reverse mitigate some loops but cannot remove every limitation.'),
      parts: ripIp(R.r2left, ripResponse(prefix, mask, 16), 0xa006)
    }
  ])
};

/** TCP has already negotiated MSS/options on the second link; the first link shows the handshake. */
const peering12 = new TcpFlow(
  { ip: R.r1, port: 50179, isn: 24001 },
  { ip: R.r2left, port: 179, isn: 41001 }
);
const peering23 = new TcpFlow(
  { ip: R.r2right, port: 50279, isn: 50100 },
  { ip: R.r3, port: 179, isn: 60100 },
  true
);

export const bgp: Scenario = {
  id: 'bgp', name: 'BGP-4', category: 'routing', level: 3,
  tagline: T('Échanger des routes entre systèmes autonomes', 'Exchanging routes between autonomous systems'),
  intro: T(
    'BGP-4 connecte des systèmes autonomes (AS), par exemple entre opérateurs, via des sessions TCP port 179. Une session échange OPEN et KEEPALIVE avant d’annoncer des préfixes dans UPDATE. L’AS_PATH liste les AS traversés, évite certaines boucles et contribue aux décisions de politique de routage : BGP ne choisit pas simplement le chemin le plus court. Les AS 65001, 65002 et 65003 sont privés et servent ici de laboratoire.',
    'BGP-4 connects autonomous systems (ASes), for example between providers, over TCP port 179. A session exchanges OPEN and KEEPALIVE before announcing prefixes via UPDATE. AS_PATH records crossed ASes, prevents certain loops and informs routing policy: BGP does not simply select the shortest route. Private ASNs 65001, 65002 and 65003 are used in this lab.'),
  topology: {
    nodes: [
      node('r1', 'network-router', T('AS 65001 · R1', 'AS 65001 · R1'), 125, 270, R.r1),
      node('r2', 'network-router', T('AS 65002 · R2', 'AS 65002 · R2'), 470, 270, R.r2left),
      node('r3', 'network-router', T('AS 65003 · R3', 'AS 65003 · R3'), 815, 270, R.r3)
    ],
    links: routers.links
  },
  actors: ['r1', 'r2', 'r3'],
  events: events('bgp', [
    {
      from: 'r1', to: 'r2', label: 'SYN · TCP 179',
      title: T('R1 ouvre une connexion TCP vers R2', 'R1 opens a TCP connection to R2'),
      text: T('BGP est une application TCP : R1 contacte R2 sur le port 179 depuis un port éphémère. Ici, les deux routeurs appartiennent à des AS différents, donc la session sera eBGP.',
        'BGP runs over TCP: R1 connects to R2 on port 179 from an ephemeral port. These routers are in different ASes, so this will be an eBGP session.'),
      parts: peering12.send(0, ['SYN'])
    },
    {
      from: 'r2', to: 'r1', label: 'SYN, ACK',
      title: T('R2 accepte la connexion', 'R2 accepts the connection'),
      text: T('La réponse SYN-ACK confirme que R2 écoute et fixe les numéros de séquence TCP. BGP ne peut pas échanger de messages avant l’établissement du transport.',
        'The SYN-ACK confirms R2 is listening and establishes TCP sequence numbers. BGP cannot exchange messages before transport is established.'),
      parts: peering12.send(1, ['SYN', 'ACK'])
    },
    {
      from: 'r1', to: 'r2', label: 'ACK',
      title: T('Le transport TCP est prêt', 'TCP transport is established'),
      text: T('Le troisième paquet ACK termine la poignée de main TCP. Les échanges BGP peuvent commencer.',
        'The third TCP ACK completes the handshake. BGP messages can now be exchanged.'),
      parts: peering12.send(0, ['ACK'])
    },
    {
      from: 'r1', to: 'r2', label: 'OPEN · AS 65001',
      title: T('R1 annonce son identité BGP', 'R1 introduces its BGP identity'),
      text: T('OPEN indique la version 4, l’AS 65001, le Hold Time de 90 secondes et un identifiant BGP. Cette démonstration n’ajoute aucune capacité optionnelle.',
        'OPEN declares version 4, AS 65001, a 90-second Hold Time and a BGP identifier. This lab deliberately omits optional capabilities.'),
      parts: peering12.send(0, ['PSH', 'ACK'], [bgpOpen(65001, '1.1.1.1')])
    },
    {
      from: 'r2', to: 'r1', label: 'OPEN · AS 65002',
      title: T('R2 annonce à son tour son AS', 'R2 announces its AS in return'),
      text: T('R2 répond avec son propre OPEN, AS 65002. La cohérence de la session et les paramètres annoncés sont contrôlés avant d’accepter les routes.',
        'R2 answers with its own OPEN, AS 65002. Peering parameters are checked before accepting routing announcements.'),
      parts: peering12.send(1, ['PSH', 'ACK'], [bgpOpen(65002, '2.2.2.2')])
    },
    {
      from: 'r1', to: 'r2', label: 'KEEPALIVE',
      title: T('R1 valide l’ouverture de session', 'R1 confirms session establishment'),
      text: T('Un KEEPALIVE BGP est un message de 19 octets sans corps. Il confirme un OPEN acceptable et entretient la session.',
        'A BGP KEEPALIVE is exactly 19 bytes long, with no body. It confirms an acceptable OPEN and maintains the session.'),
      parts: peering12.send(0, ['PSH', 'ACK'], [bgpKeepalive()])
    },
    {
      from: 'r2', to: 'r1', label: 'KEEPALIVE',
      title: T('La session atteint Established', 'The session reaches Established'),
      text: T('R2 retourne son KEEPALIVE. Les deux pairs peuvent désormais échanger des UPDATE. Le second peering R2–R3 est supposé déjà Established pour concentrer l’animation sur les routes.',
        'R2 returns its KEEPALIVE. Both peers can now exchange UPDATE messages. The R2–R3 session is already Established to focus the animation on route propagation.'),
      parts: peering12.send(1, ['PSH', 'ACK'], [bgpKeepalive()])
    },
    {
      from: 'r1', to: 'r2', label: 'UPDATE · 203.0.113/24', tone: 'data',
      title: T('R1 annonce un préfixe avec AS_PATH', 'R1 advertises a prefix with AS_PATH'),
      text: T('R1 annonce 203.0.113.0/24 : ORIGIN IGP, AS_PATH [65001] et NEXT_HOP 10.0.12.1. L’annonce décrit un chemin BGP disponible, pas encore une garantie qu’une politique locale le sélectionne.',
        'R1 advertises 203.0.113.0/24 with ORIGIN IGP, AS_PATH [65001] and NEXT_HOP 10.0.12.1. The UPDATE describes an available BGP path, not a guarantee local policy will select it.'),
      parts: peering12.send(0, ['PSH', 'ACK'], [bgpUpdate('203.0.113.0', 24, [65001], R.r1)])
    },
    {
      from: 'r2', to: 'r3', label: 'AS_PATH 65002 65001', tone: 'data',
      title: T('R2 propage le chemin à un autre AS', 'R2 propagates the route to another AS'),
      text: T('Sous réserve de sa politique d’export, R2 annonce le préfixe à AS 65003 en préfixant son numéro : AS_PATH [65002, 65001]. NEXT_HOP devient son interface 10.0.23.2. R3 peut refuser une route contenant son propre AS.',
        'Subject to export policy, R2 announces the prefix to AS 65003 and prepends its ASN: AS_PATH [65002, 65001]. NEXT_HOP becomes 10.0.23.2. R3 can reject routes containing its own AS.'),
      parts: peering23.send(0, ['PSH', 'ACK'], [bgpUpdate('203.0.113.0', 24, [65002, 65001], R.r2right)])
    },
    {
      from: 'r1', to: 'r2', label: 'WITHDRAW · /24', tone: 'alert',
      title: T('R1 retire sa route', 'R1 withdraws its route'),
      text: T('Le préfixe n’est plus disponible via R1. Un UPDATE peut transporter un retrait sans aucun attribut de chemin ni nouveau NLRI. R2 retire alors ce chemin de sa table BGP.',
        'The prefix is no longer reachable via R1. An UPDATE may carry only withdrawn routes, without path attributes or new NLRI. R2 removes that path from its BGP table.'),
      parts: peering12.send(0, ['PSH', 'ACK'], [bgpWithdraw('203.0.113.0', 24)])
    },
    {
      from: 'r2', to: 'r3', label: 'WITHDRAW · /24', tone: 'alert',
      title: T('R2 retire son annonce à R3', 'R2 withdraws its advertisement to R3'),
      text: T('R2 propage le retrait au pair auquel il avait annoncé ce chemin. S’il connaissait un autre chemin valide, sa politique pourrait conduire à annoncer une route de remplacement.',
        'R2 propagates the withdrawal to the neighbor to which it had advertised the path. If another valid path existed, policy could allow a replacement advertisement.'),
      parts: peering23.send(0, ['PSH', 'ACK'], [bgpWithdraw('203.0.113.0', 24)])
    }
  ])
};
