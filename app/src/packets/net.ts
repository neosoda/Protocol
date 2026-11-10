import { T, type Part } from '../model.ts';
import { checksum, concat, hex, ipBytes, size, u16, Writer } from './bytes.ts';

export const PROTO = { icmp: 1, tcp: 6, udp: 17, ospf: 89 } as const;
const protoName: Record<number, string> = { 1: 'ICMP', 6: 'TCP', 17: 'UDP', 89: 'OSPF' };

export interface IpSpec { src: string; dst: string; ttl?: number; id?: number; df?: boolean; tos?: number }

/** IPv4 header (RFC 791) in front of an already-encoded payload. */
export function ipv4(spec: IpSpec, protocol: number, payload: Part[]): Part[] {
  const w = new Writer();
  const body = concat(payload);
  const ttl = spec.ttl ?? 64;
  const df = spec.df ?? true;
  const at = w.u8('Version', 0x45, T('Toujours 4 en IPv4 (4 bits de poids fort).', 'Always 4 for IPv4 (high nibble).'), '4');
  w.mark('IHL', T('5 × 4 = 20 octets', '5 × 4 = 20 bytes'), at, 1, T(
    'Longueur de l’en-tête en mots de 32 bits : 5 signifie 20 octets, sans options.',
    'Header length in 32-bit words: 5 means 20 bytes, no options.'));
  w.u8('DSCP / ECN', spec.tos ?? 0, T(
    'Classe de service et notification de congestion ; 0 pour un trafic ordinaire.',
    'Service class and congestion notification; 0 for ordinary traffic.'));
  w.u16('Total Length', 20 + body.length, T(
    'Taille du datagramme entier, en-tête compris, en octets.',
    'Size of the whole datagram, header included, in bytes.'), size(20 + body.length));
  const id = spec.id ?? 0x1c46;
  w.u16('Identification', id, T(
    'Numéro commun aux fragments d’un même datagramme.',
    'Number shared by every fragment of the same datagram.'), hex(id));
  w.u16('Flags / Fragment', df ? 0x4000 : 0, T(
    df ? 'DF (Don’t Fragment) est levé : un routeur ne doit pas découper ce paquet. Décalage de fragment : 0.'
       : 'Aucun drapeau : le paquet peut être fragmenté. Décalage de fragment : 0.',
    df ? 'DF (Don’t Fragment) is set: routers must not split this packet. Fragment offset: 0.'
       : 'No flags: the packet may be fragmented. Fragment offset: 0.'), df ? 'DF, offset 0' : 'offset 0');
  w.u8('TTL', ttl, T(
    'Durée de vie : chaque routeur la décrémente de 1 et jette le paquet à 0, ce qui évite les boucles infinies.',
    'Time to live: each router subtracts 1 and drops the packet at 0, which stops endless loops.'));
  w.u8('Protocol', protocol, T(
    'Indique ce que transporte le datagramme : 1 = ICMP, 6 = TCP, 17 = UDP, 89 = OSPF.',
    'Tells what the datagram carries: 1 = ICMP, 6 = TCP, 17 = UDP, 89 = OSPF.'), `${protocol} (${protoName[protocol]})`);
  const sumAt = w.u16('Header Checksum', 0, T(
    'Somme de contrôle du seul en-tête, recalculée à chaque saut puisque le TTL change.',
    'Checksum of the header alone, recomputed at every hop because the TTL changes.'));
  w.put('Source', spec.src, ipBytes(spec.src), T('Adresse IPv4 de l’émetteur.', 'IPv4 address of the sender.'));
  w.put('Destination', spec.dst, ipBytes(spec.dst), T(
    'Adresse IPv4 du destinataire final ; c’est elle que les routeurs examinent.',
    'IPv4 address of the final recipient; this is what routers look at.'));
  const sum = checksum(w.bytes());
  w.patch16(sumAt, sum);
  w.patchValue(sumAt, hex(sum));
  return [w.part('ip', 'IPv4'), ...payload];
}

const pseudo = (src: string, dst: string, protocol: number, length: number): number[] =>
  [...ipBytes(src), ...ipBytes(dst), 0, protocol, ...u16(length)];

export type TcpFlag = 'FIN' | 'SYN' | 'RST' | 'PSH' | 'ACK' | 'URG';
const flagBits: Record<TcpFlag, number> = { FIN: 1, SYN: 2, RST: 4, PSH: 8, ACK: 16, URG: 32 };
export interface TcpSpec { sport: number; dport: number; seq: number; ack: number; flags: TcpFlag[]; window?: number }

/** TCP header (RFC 9293) with a real checksum over the pseudo-header. */
export function tcp(spec: TcpSpec, src: string, dst: string, payload: Part[] = []): Part[] {
  const w = new Writer();
  const body = concat(payload);
  const syn = spec.flags.includes('SYN');
  const optionLength = syn ? 12 : 0;
  w.u16('Source Port', spec.sport, T(
    'Port de l’application émettrice ; côté client, un port éphémère choisi par le système.',
    'Port of the sending application; on a client, an ephemeral port picked by the OS.'));
  w.u16('Destination Port', spec.dport, T(
    'Port du service visé, qui permet au destinataire de remettre le segment à la bonne application.',
    'Port of the target service, so the receiver hands the segment to the right application.'));
  w.u32('Sequence Number', spec.seq >>> 0, T(
    'Numéro du premier octet de ce segment dans le flux de l’émetteur. SYN et FIN consomment chacun un numéro.',
    'Number of this segment’s first byte in the sender’s stream. SYN and FIN each use up one number.'));
  w.u32('Acknowledgment', spec.ack >>> 0, T(
    spec.flags.includes('ACK') ? 'Prochain octet attendu de l’autre côté : tout ce qui précède est bien reçu.'
      : 'Ignoré tant que le drapeau ACK n’est pas levé.',
    spec.flags.includes('ACK') ? 'Next byte expected from the other side: everything before it has arrived.'
      : 'Ignored while the ACK flag is not set.'));
  const words = (20 + optionLength) / 4;
  const flags = spec.flags.reduce((n, f) => n | flagBits[f], 0);
  const at = w.put('Data Offset', T(`${words} × 4 = ${words * 4} octets`, `${words} × 4 = ${words * 4} bytes`), [words << 4, flags], T(
    'Longueur de l’en-tête TCP en mots de 32 bits (4 bits de poids fort du premier octet).',
    'TCP header length in 32-bit words (high nibble of the first byte).'));
  w.fields[w.fields.length - 1].length = 1;
  w.mark('Flags', spec.flags.join(', '), at + 1, 1, T(
    'Drapeaux de contrôle : SYN ouvre, ACK acquitte, PSH pousse les données vers l’application, FIN ferme, RST interrompt.',
    'Control flags: SYN opens, ACK acknowledges, PSH pushes data up to the app, FIN closes, RST aborts.'));
  const window = spec.window ?? (syn ? 64240 : 502);
  w.u16('Window', window, T(
    'Place libre dans le tampon de réception, qui limite ce que l’autre côté peut envoyer sans attendre.',
    'Free space in the receive buffer, which caps what the other side may send before waiting.'));
  const sumAt = w.u16('Checksum', 0, T(
    'Somme de contrôle de l’en-tête, des données et d’un pseudo-en-tête reprenant les adresses IP.',
    'Checksum over the header, the data and a pseudo-header holding the IP addresses.'));
  w.u16('Urgent Pointer', 0, T('Inutilisé ici : le drapeau URG n’est pas levé.', 'Unused here: the URG flag is not set.'));
  if (syn) {
    w.put('Option MSS', size(1460), [2, 4, ...u16(1460)], T(
      'Taille maximale de segment acceptée : 1460 octets tiennent dans une trame Ethernet de 1500.',
      'Largest segment accepted: 1460 bytes fit in a 1500-byte Ethernet frame.'));
    w.put('Option SACK', T('permis', 'permitted'), [1, 1, 4, 2], T(
      'Deux NOP d’alignement, puis l’accord pour des acquittements sélectifs des blocs reçus.',
      'Two alignment NOPs, then permission to selectively acknowledge received blocks.'));
    w.put('Option Window Scale', '× 128', [1, 3, 3, 7], T(
      'Un NOP puis un facteur d’échelle de 7 : la fenêtre annoncée sera multipliée par 2⁷.',
      'One NOP then a scale factor of 7: the advertised window will be multiplied by 2⁷.'));
  }
  const header = w.bytes();
  const sum = checksum(pseudo(src, dst, 6, header.length + body.length), header, body);
  w.patch16(sumAt, sum);
  w.patchValue(sumAt, hex(sum));
  return [w.part('tcp', 'TCP'), ...payload];
}

export interface UdpSpec { sport: number; dport: number }
export function udp(spec: UdpSpec, src: string, dst: string, payload: Part[]): Part[] {
  const w = new Writer();
  const body = concat(payload);
  w.u16('Source Port', spec.sport, T('Port de l’émetteur, où la réponse éventuelle reviendra.', 'Sender’s port, where any reply will come back to.'));
  w.u16('Destination Port', spec.dport, T('Port du service destinataire.', 'Port of the receiving service.'));
  w.u16('Length', 8 + body.length, T('Longueur totale : 8 octets d’en-tête plus les données.', 'Total length: 8 header bytes plus the data.'), size(8 + body.length));
  const sumAt = w.u16('Checksum', 0, T(
    'Somme de contrôle sur les données et un pseudo-en-tête IP ; c’est la seule protection qu’offre UDP.',
    'Checksum over the data and an IP pseudo-header; it is the only protection UDP gives.'));
  const sum = checksum(pseudo(src, dst, 17, 8 + body.length), w.bytes(), body) || 0xffff;
  w.patch16(sumAt, sum);
  w.patchValue(sumAt, hex(sum));
  return [w.part('udp', 'UDP'), ...payload];
}

/** ICMP echo request (type 8) or reply (type 0). */
export function icmpEcho(type: 0 | 8, id: number, seq: number, data: Uint8Array): Part[] {
  const w = new Writer();
  w.u8('Type', type, T(
    type === 8 ? '8 = Echo Request : « réponds-moi si tu m’entends ».' : '0 = Echo Reply : la réponse à un Echo Request.',
    type === 8 ? '8 = Echo Request: “answer if you can hear me”.' : '0 = Echo Reply: the answer to an Echo Request.'),
  type === 8 ? '8 (Echo Request)' : '0 (Echo Reply)');
  w.u8('Code', 0, T('Précise le type ; toujours 0 pour l’écho.', 'Refines the type; always 0 for echo.'));
  const sumAt = w.u16('Checksum', 0, T('Somme de contrôle du message ICMP entier.', 'Checksum of the whole ICMP message.'));
  w.u16('Identifier', id, T('Relie les réponses au programme ping qui les attend.', 'Ties replies to the ping process waiting for them.'), hex(id));
  w.u16('Sequence', seq, T('Numéro de la requête ; la réponse reprend le même.', 'Request number; the reply repeats it.'));
  w.put('Data', size(data.length), data, T(
    'Charge renvoyée telle quelle par la cible, ce qui permet de vérifier l’intégrité et de mesurer le temps.',
    'Payload echoed back untouched, used to check integrity and time the round trip.'));
  const sum = checksum(w.bytes());
  w.patch16(sumAt, sum);
  w.patchValue(sumAt, hex(sum));
  return [w.part('icmp', 'ICMP')];
}

/** ICMP Time Exceeded (type 11), quoting the expired datagram’s header and first 8 bytes. */
export function icmpTimeExceeded(quoted: Uint8Array): Part[] {
  const w = new Writer();
  w.u8('Type', 11, T('11 = Time Exceeded : le TTL est tombé à 0 en route.', '11 = Time Exceeded: the TTL hit 0 on the way.'), '11 (Time Exceeded)');
  w.u8('Code', 0, T('0 = TTL expiré pendant le transit.', '0 = TTL expired in transit.'));
  const sumAt = w.u16('Checksum', 0, T('Somme de contrôle du message ICMP entier.', 'Checksum of the whole ICMP message.'));
  w.u32('Unused', 0, T('Réservé, laissé à zéro.', 'Reserved, left at zero.'));
  w.put('Original datagram', size(quoted.length), quoted, T(
    'L’en-tête IP du paquet expiré et ses 8 premiers octets de données : l’émetteur peut ainsi retrouver quel envoi a échoué.',
    'The expired packet’s IP header and its first 8 data bytes, so the sender can tell which send failed.'));
  const sum = checksum(w.bytes());
  w.patch16(sumAt, sum);
  w.patchValue(sumAt, hex(sum));
  return [w.part('icmp', 'ICMP')];
}

export interface Endpoint { ip: string; port: number; isn: number }

/** Keeps sequence and acknowledgment numbers consistent across a TCP conversation. */
export class TcpFlow {
  private next: [number, number];
  private seen: [number, number];
  private ipId: [number, number] = [0x3a10, 0x8e02];
  readonly a: Endpoint;
  readonly b: Endpoint;
  constructor(a: Endpoint, b: Endpoint, established = false) {
    this.a = a;
    this.b = b;
    this.next = established ? [a.isn + 1, b.isn + 1] : [a.isn, b.isn];
    this.seen = established ? [b.isn + 1, a.isn + 1] : [0, 0];
  }
  /** Sends from side 0 (a) or 1 (b); returns the full IPv4 + TCP + payload stack. */
  send(side: 0 | 1, flags: TcpFlag[], payload: Part[] = [], { ttl = 64, lost = false } = {}): Part[] {
    const [me, peer] = side === 0 ? [this.a, this.b] : [this.b, this.a];
    const length = concat(payload).length;
    const seq = this.next[side];
    const ack = flags.includes('ACK') ? this.seen[side] : 0;
    const consumed = length + (flags.includes('SYN') ? 1 : 0) + (flags.includes('FIN') ? 1 : 0);
    // A lost segment leaves both counters untouched: it will be sent again as-is.
    if (!lost) {
      this.next[side] = (seq + consumed) >>> 0;
      this.seen[1 - side] = (seq + consumed) >>> 0;
    }
    const id = this.ipId[side]++;
    return ipv4({ src: me.ip, dst: peer.ip, ttl, id }, PROTO.tcp,
      tcp({ sport: me.port, dport: peer.port, seq, ack, flags }, me.ip, peer.ip, payload));
  }
}
