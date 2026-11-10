import { T, type Scenario, type Topology } from '../model.ts';
import { ascii, concat } from '../packets/bytes.ts';
import { data, ntp } from '../packets/app.ts';
import { icmpEcho, icmpTimeExceeded, ipv4, PROTO, TcpFlow, udp } from '../packets/net.ts';
import { box, events, IP, laptop, node, toServer } from './kit.ts';

/* A path with real routers, so hops and TTLs can be followed. */
const routed: Topology = {
  nodes: [
    laptop(90, 330), box(260, 330),
    node('isp', 'router', T('Routeur du FAI', 'ISP router'), 450, 170, IP.isp),
    node('server', 'server', T('Serveur web', 'Web server'), 760, 330, IP.web)
  ],
  links: [['client', 'box'], ['box', 'isp'], ['isp', 'server']]
};

const echo = ascii('observatory-ping');

export const ip: Scenario = {
  id: 'ip', name: 'IP', category: 'foundations', level: 1,
  tagline: T('Comment un paquet trouve son chemin', 'How a packet finds its way'),
  intro: T(
    'IP achemine des datagrammes de proche en proche. Chaque routeur lit l’adresse de destination, choisit le saut suivant et décrémente le TTL. Au passage, la box remplace l’adresse privée de l’ordinateur par son adresse publique : c’est la traduction d’adresses (NAT).',
    'IP carries datagrams hop by hop. Each router reads the destination address, picks the next hop and lowers the TTL. On the way out the home router swaps the laptop’s private address for its public one: network address translation (NAT).'),
  topology: routed,
  actors: ['client', 'box', 'isp', 'server'],
  events: events('ip', [
    {
      from: 'client', to: 'box', label: 'TTL 64', tone: 'data',
      title: T('Premier saut : vers la passerelle', 'First hop: to the gateway'),
      text: T(
        'L’ordinateur veut joindre 203.0.113.10, hors de son réseau local. Il confie donc le datagramme à sa passerelle par défaut, la box. Source privée 192.168.1.23, TTL de départ 64.',
        'The laptop wants 203.0.113.10, outside its local network, so it hands the datagram to its default gateway, the home router. Private source 192.168.1.23, starting TTL 64.'),
      parts: ipv4({ src: IP.laptop, dst: IP.web, ttl: 64, id: 0x51a0 }, PROTO.icmp, icmpEcho(8, 0x0c01, 1, echo))
    },
    {
      from: 'box', to: 'isp', label: 'TTL 63 · NAT', tone: 'data',
      title: T('La box traduit l’adresse', 'The router translates the address'),
      text: T(
        'Une adresse 192.168.x.x n’est pas routable sur Internet. La box la remplace par son adresse publique 198.51.100.7, note la correspondance dans sa table NAT, décrémente le TTL à 63 et recalcule la somme de contrôle.',
        'A 192.168.x.x address cannot be routed on the Internet. The router swaps in its public address 198.51.100.7, records the mapping in its NAT table, lowers the TTL to 63 and recomputes the checksum.'),
      parts: ipv4({ src: IP.boxWan, dst: IP.web, ttl: 63, id: 0x51a0 }, PROTO.icmp, icmpEcho(8, 0x0c01, 1, echo))
    },
    {
      from: 'isp', to: 'server', label: 'TTL 62', tone: 'data',
      title: T('Routage chez le fournisseur', 'Routing at the provider'),
      text: T(
        'Le routeur du FAI cherche dans sa table la route la plus précise vers 203.0.113.0/24 et transmet vers le réseau du serveur (les autres routeurs intermédiaires sont volontairement omis sur ce schéma). Seuls le TTL et la somme de contrôle changent.',
        'The ISP router looks up the most specific route to 203.0.113.0/24 and forwards toward the server network (other intermediate routers are intentionally omitted from this schematic). Only the TTL and the checksum change.'),
      parts: ipv4({ src: IP.boxWan, dst: IP.web, ttl: 62, id: 0x51a0 }, PROTO.icmp, icmpEcho(8, 0x0c01, 1, echo))
    },
    {
      from: 'server', to: 'box', label: 'TTL 64 ←', tone: 'data',
      title: T('La réponse repart en sens inverse', 'The reply heads back'),
      text: T(
        'Le serveur répond à 198.51.100.7 avec un nouveau datagramme et son propre TTL de 64. Le retour n’emprunte pas forcément le même chemin : chaque routeur décide de nouveau.',
        'The server answers 198.51.100.7 with a new datagram and its own TTL of 64. The return trip need not follow the same path: every router decides again.'),
      parts: ipv4({ src: IP.web, dst: IP.boxWan, ttl: 64, id: 0x0e77 }, PROTO.icmp, icmpEcho(0, 0x0c01, 1, echo))
    },
    {
      from: 'box', to: 'client', label: 'NAT ←', tone: 'data',
      title: T('La box retrouve le destinataire', 'The router finds the recipient'),
      text: T(
        'Grâce à sa table NAT, la box sait que cette réponse est attendue par 192.168.1.23. Elle réécrit la destination et remet le datagramme sur le réseau local, avec un TTL réduit des sauts parcourus.',
        'Using its NAT table, the router knows 192.168.1.23 is waiting for this reply. It rewrites the destination and puts the datagram on the local network, its TTL reduced by the hops travelled.'),
      parts: ipv4({ src: IP.web, dst: IP.laptop, ttl: 62, id: 0x0e77 }, PROTO.icmp, icmpEcho(0, 0x0c01, 1, echo))
    }
  ])
};

const probe = (ttl: number, seq: number) =>
  ipv4({ src: IP.laptop, dst: IP.web, ttl, id: 0x6200 + seq }, PROTO.icmp, icmpEcho(8, 0x0c02, seq, echo));
/** The expired datagram as it reached the router (TTL 1): header plus first 8 bytes. */
const quoted = (ttl: number, seq: number, src: string = IP.laptop): Uint8Array => {
  const parts = ipv4({ src, dst: IP.web, ttl, id: 0x6200 + seq }, PROTO.icmp, icmpEcho(8, 0x0c02, seq, echo));
  return concat(parts).slice(0, 28);
};

export const icmp: Scenario = {
  id: 'icmp', name: 'ICMP', category: 'foundations', level: 1,
  tagline: T('Ping et traceroute, les outils de diagnostic', 'Ping and traceroute, the diagnostic tools'),
  intro: T(
    'ICMP est le protocole des messages de service d’IP. Ping s’en sert pour vérifier qu’une machine répond ; traceroute détourne le TTL pour faire se signaler, un à un, les routeurs du chemin.',
    'ICMP carries IP’s service messages. Ping uses it to check a machine answers; traceroute bends the TTL so the routers along the path reveal themselves one by one.'),
  topology: routed,
  actors: ['client', 'box', 'isp', 'server'],
  events: events('icmp', [
    {
      from: 'client', to: 'server', label: 'Echo Request',
      title: T('Ping : la question', 'Ping: the question'),
      text: T(
        'La commande ping envoie un Echo Request (type 8) avec un identifiant et un numéro de séquence. Le message traverse tous les routeurs sans qu’ils aient à le comprendre.',
        'The ping command sends an Echo Request (type 8) carrying an identifier and a sequence number. It crosses every router without them needing to understand it.'),
      parts: ipv4({ src: IP.laptop, dst: IP.web, ttl: 64, id: 0x61f0 }, PROTO.icmp, icmpEcho(8, 0x0c02, 1, echo))
    },
    {
      from: 'server', to: 'client', label: 'Echo Reply',
      title: T('Ping : la réponse', 'Ping: the answer'),
      text: T(
        'Le serveur renvoie un Echo Reply (type 0) avec les mêmes identifiant, séquence et données. Le temps écoulé entre les deux donne la latence aller-retour. Un pare-feu peut bloquer ICMP : l’absence de réponse ne prouve pas que la machine est éteinte.',
        'The server returns an Echo Reply (type 0) with the same identifier, sequence and data. The time between the two is the round-trip latency. Firewalls may block ICMP, so silence does not prove the machine is down.'),
      parts: ipv4({ src: IP.web, dst: IP.laptop, ttl: 62, id: 0x0e78 }, PROTO.icmp, icmpEcho(0, 0x0c02, 1, echo))
    },
    {
      from: 'client', to: 'box', label: 'TTL 1', tone: 'data',
      title: T('Traceroute : TTL de 1', 'Traceroute: TTL of 1'),
      text: T(
        'Traceroute envoie une sonde vers le serveur, mais avec un TTL de 1. La box le décrémente à 0 : elle doit jeter le paquet.',
        'Traceroute sends a probe to the server, but with a TTL of 1. The home router brings it down to 0 and must drop it.'),
      parts: probe(1, 2)
    },
    {
      from: 'box', to: 'client', label: 'Time Exceeded', tone: 'alert',
      title: T('Le premier routeur se dénonce', 'The first router gives itself away'),
      text: T(
        'En jetant la sonde, la box renvoie un ICMP Time Exceeded (type 11) qui cite l’en-tête du paquet perdu. Son adresse source révèle le premier saut : 192.168.1.1.',
        'Dropping the probe, the router sends back an ICMP Time Exceeded (type 11) quoting the lost packet’s header. Its source address reveals the first hop: 192.168.1.1.'),
      parts: ipv4({ src: IP.box, dst: IP.laptop, ttl: 64, id: 0x0001 }, PROTO.icmp, icmpTimeExceeded(quoted(1, 2)))
    },
    {
      from: 'client', to: 'isp', label: 'TTL 2', tone: 'data',
      title: T('Traceroute : TTL de 2', 'Traceroute: TTL of 2'),
      text: T(
        'Nouvelle sonde avec un TTL de 2 : la box la laisse passer (TTL 1), le routeur du FAI la fait expirer.',
        'A new probe with a TTL of 2: the home router lets it through (TTL 1), the ISP router makes it expire.'),
      parts: probe(2, 3)
    },
    {
      from: 'isp', to: 'client', label: 'Time Exceeded', tone: 'alert',
      title: T('Deuxième saut révélé', 'Second hop revealed'),
      text: T(
        'Le routeur du FAI répond à son tour depuis 198.51.100.1. En augmentant le TTL d’un cran à chaque fois, traceroute dresse la liste complète des routeurs jusqu’au serveur.',
        'The ISP router answers in turn from 198.51.100.1. Raising the TTL by one each time, traceroute lists every router up to the server.'),
      parts: ipv4({ src: IP.isp, dst: IP.boxWan, ttl: 255, id: 0x9a31 }, PROTO.icmp, icmpTimeExceeded(quoted(1, 3, IP.boxWan)))
    }
  ])
};

const T1 = Date.UTC(2026, 10, 4, 12, 0, 0, 125);
const timeServer = toServer('server', T('Serveur de temps', 'Time server'), IP.time);
const ntpRequest = (sport: number, t: number) =>
  ipv4({ src: IP.laptop, dst: IP.time, id: 0x7100 + sport % 16 }, PROTO.udp, udp({ sport, dport: 123 }, IP.laptop, IP.time, [ntp(false, t)]));

export const udpScenario: Scenario = {
  id: 'udp', name: 'UDP', category: 'foundations', level: 1,
  tagline: T('Envoyer sans connexion ni garantie', 'Sending without connection or guarantee'),
  intro: T(
    'UDP ajoute seulement des ports et une somme de contrôle à IP : pas de connexion, pas d’accusé de réception, pas de retransmission. C’est léger et rapide, parfait pour une question courte comme « quelle heure est-il ? » avec NTP.',
    'UDP adds only ports and a checksum to IP: no connection, no acknowledgment, no retransmission. It is light and fast, ideal for a short question like “what time is it?” with NTP.'),
  topology: timeServer,
  actors: ['client', 'server'],
  events: events('udp', [
    {
      from: 'client', to: 'server', label: 'NTP ?', tone: 'data',
      title: T('Une question, tout de suite', 'A question, straight away'),
      text: T(
        'Pas de poignée de main : le premier paquet porte déjà la requête. L’en-tête UDP ne fait que 8 octets, ports et longueur compris.',
        'No handshake: the very first packet already carries the request. The UDP header is only 8 bytes, ports and length included.'),
      parts: ntpRequest(50123, T1)
    },
    {
      from: 'server', to: 'client', label: 'NTP !', tone: 'data',
      title: T('La réponse horodatée', 'The time-stamped reply'),
      text: T(
        'Le serveur répond depuis le port 123 vers le port d’origine. Ses trois horodatages, plus l’heure d’arrivée, permettent au client de corriger son horloge à quelques millisecondes près.',
        'The server answers from port 123 back to the source port. Its three timestamps, plus the arrival time, let the client correct its clock to within a few milliseconds.'),
      parts: ipv4({ src: IP.time, dst: IP.laptop, ttl: 58, id: 0x2c40 }, PROTO.udp,
        udp({ sport: 123, dport: 50123 }, IP.time, IP.laptop, [ntp(true, T1, T1 + 14, T1 + 15)]))
    },
    {
      from: 'client', to: 'server', label: 'NTP ?', tone: 'alert', drop: true,
      title: T('Un datagramme se perd', 'A datagram goes missing'),
      text: T(
        'Une heure plus tard, nouvelle requête… perdue en route, par exemple dans un routeur saturé. UDP n’en saura rien : aucun mécanisme ne signale la perte.',
        'An hour later, a new request… lost on the way, say in a congested router. UDP will never know: nothing reports the loss.'),
      parts: ntpRequest(50124, T1 + 3_600_000)
    },
    {
      from: 'client', to: 'server', label: 'NTP ?', tone: 'data',
      title: T('L’application réessaie', 'The application tries again'),
      text: T(
        'Sans réponse après un délai, c’est le programme NTP lui-même qui renvoie une requête. Avec UDP, la fiabilité est l’affaire de l’application.',
        'With no reply after a while, the NTP program itself sends another request. With UDP, reliability is the application’s job.'),
      parts: ntpRequest(50125, T1 + 3_602_000)
    },
    {
      from: 'server', to: 'client', label: 'NTP !', tone: 'data',
      title: T('Cette fois, ça passe', 'This time it gets through'),
      text: T(
        'La réponse arrive. Le client ne sait pas, et n’a pas besoin de savoir, que la première tentative a disparu.',
        'The reply arrives. The client does not know, and does not need to know, that the first attempt vanished.'),
      parts: ipv4({ src: IP.time, dst: IP.laptop, ttl: 58, id: 0x2c41 }, PROTO.udp,
        udp({ sport: 123, dport: 50125 }, IP.time, IP.laptop, [ntp(true, T1 + 3_602_000, T1 + 3_602_013, T1 + 3_602_014)]))
    }
  ])
};

const web = toServer('server', T('Serveur', 'Server'), IP.web);
const text = (value: string) => data('Data', 'Payload', JSON.stringify(value), ascii(value), T(
  'Les octets de l’application, transportés tels quels. TCP ne les interprète pas : il les numérote.',
  'The application’s bytes, carried as they are. TCP does not interpret them: it numbers them.'));

function tcpEvents() {
  const flow = new TcpFlow({ ip: IP.laptop, port: 51514, isn: 2_431_870_001 }, { ip: IP.web, port: 7, isn: 3_806_221_450 });
  return events('tcp', [
    {
      from: 'client', to: 'server', label: 'SYN',
      title: T('SYN : « on se connecte ? »', 'SYN: “shall we connect?”'),
      text: T(
        'Le client choisit un numéro de séquence initial au hasard et lève le drapeau SYN. Il annonce aussi ses options : taille maximale de segment, acquittements sélectifs, facteur d’échelle de fenêtre.',
        'The client picks a random initial sequence number and sets the SYN flag. It also states its options: maximum segment size, selective acknowledgments, window scale.'),
      parts: flow.send(0, ['SYN'])
    },
    {
      from: 'server', to: 'client', label: 'SYN, ACK',
      title: T('SYN-ACK : « d’accord, et toi ? »', 'SYN-ACK: “sure, and you?”'),
      text: T(
        'Le serveur acquitte le SYN (ACK = numéro du client + 1, car SYN compte pour un) et envoie son propre numéro initial.',
        'The server acknowledges the SYN (ACK = client’s number + 1, since SYN counts as one) and sends its own initial number.'),
      parts: flow.send(1, ['SYN', 'ACK'])
    },
    {
      from: 'client', to: 'server', label: 'ACK',
      title: T('ACK : connexion établie', 'ACK: connection established'),
      text: T(
        'Le client acquitte à son tour. Trois messages ont suffi : chaque côté connaît le numéro de départ de l’autre, la connexion est ouverte.',
        'The client acknowledges in turn. Three messages were enough: each side knows the other’s starting number and the connection is open.'),
      parts: flow.send(0, ['ACK'])
    },
    {
      from: 'client', to: 'server', label: 'PSH +12', tone: 'data',
      title: T('Premier envoi de données', 'First data sent'),
      text: T(
        'Le client envoie 12 octets. Le numéro de séquence désigne le premier d’entre eux ; PSH demande de les remettre sans attendre à l’application.',
        'The client sends 12 bytes. The sequence number points to the first of them; PSH asks for them to be handed to the app straight away.'),
      parts: flow.send(0, ['PSH', 'ACK'], [text('hello world\n')])
    },
    {
      from: 'server', to: 'client', label: 'ACK',
      title: T('Accusé de réception', 'Acknowledgment'),
      text: T(
        'Le serveur répond ACK = séquence + 12 : « j’ai tout reçu jusqu’ici, j’attends la suite ». Un acquittement porte sur tout ce qui précède, pas sur un paquet précis.',
        'The server answers ACK = sequence + 12: “I have everything up to here, send what’s next”. An acknowledgment covers everything before it, not one particular packet.'),
      parts: flow.send(1, ['ACK'])
    },
    {
      from: 'client', to: 'server', label: 'PSH +8', tone: 'alert', drop: true,
      title: T('Un segment se perd', 'A segment is lost'),
      text: T(
        'Le segment suivant disparaît en route. Le client a lancé un minuteur de retransmission au moment de l’envoi.',
        'The next segment disappears on the way. The client started a retransmission timer when it sent it.'),
      parts: flow.send(0, ['PSH', 'ACK'], [text('goodbye\n')], { lost: true })
    },
    {
      from: 'client', to: 'server', label: 'PSH +8 ↻', tone: 'data',
      title: T('Retransmission', 'Retransmission'),
      text: T(
        'Sans ACK avant l’expiration du minuteur, le client renvoie exactement les mêmes octets, avec le même numéro de séquence. C’est ce qui rend TCP fiable.',
        'With no ACK before the timer runs out, the client sends exactly the same bytes again, with the same sequence number. This is what makes TCP reliable.'),
      parts: flow.send(0, ['PSH', 'ACK'], [text('goodbye\n')])
    },
    {
      from: 'server', to: 'client', label: 'ACK',
      title: T('Les données sont arrivées', 'The data has arrived'),
      text: T(
        'Le serveur acquitte les 8 octets. Pour l’application, rien ne s’est passé : elle reçoit un flux continu et ordonné.',
        'The server acknowledges the 8 bytes. To the application nothing happened: it gets a continuous, ordered stream.'),
      parts: flow.send(1, ['ACK'])
    },
    {
      from: 'client', to: 'server', label: 'FIN',
      title: T('FIN : le client a terminé', 'FIN: the client is done'),
      text: T(
        'Le client n’a plus rien à envoyer et lève FIN. Comme SYN, FIN consomme un numéro de séquence.',
        'The client has nothing more to send and sets FIN. Like SYN, FIN uses up one sequence number.'),
      parts: flow.send(0, ['FIN', 'ACK'])
    },
    {
      from: 'server', to: 'client', label: 'FIN, ACK',
      title: T('Le serveur ferme aussi', 'The server closes too'),
      text: T(
        'Le serveur acquitte la fermeture et, n’ayant plus rien à dire, envoie son propre FIN dans le même segment.',
        'The server acknowledges the close and, with nothing left to say, sends its own FIN in the same segment.'),
      parts: flow.send(1, ['FIN', 'ACK'])
    },
    {
      from: 'client', to: 'server', label: 'ACK',
      title: T('Dernier acquittement', 'Final acknowledgment'),
      text: T(
        'Le client acquitte le FIN du serveur. La connexion est fermée dans les deux sens ; le client attend encore un peu (TIME-WAIT) au cas où ce dernier ACK se perdrait.',
        'The client acknowledges the server’s FIN. The connection is closed both ways; the client still waits a little (TIME-WAIT) in case this last ACK is lost.'),
      parts: flow.send(0, ['ACK'])
    }
  ]);
}

export const tcpScenario: Scenario = {
  id: 'tcp', name: 'TCP', category: 'foundations', level: 2,
  tagline: T('Une conversation fiable et ordonnée', 'A reliable, ordered conversation'),
  intro: T(
    'TCP transforme le service « au mieux » d’IP en un flux fiable : il ouvre une connexion, numérote chaque octet, attend des accusés de réception et retransmet ce qui se perd. Suivez les numéros de séquence et d’acquittement de bout en bout.',
    'TCP turns IP’s best-effort service into a reliable stream: it opens a connection, numbers every byte, waits for acknowledgments and resends what gets lost. Follow the sequence and acknowledgment numbers end to end.'),
  topology: web,
  actors: ['client', 'server'],
  events: tcpEvents()
};

