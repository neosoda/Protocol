import { T, type Part, type PartKind, type Text } from '../model.ts';
import { ascii, hex, ipBytes, noise, size, u16, u32, Writer } from './bytes.ts';

/* ------------------------------------------------------------ text lines */

export interface Line { text: string; name: string; note: Text; crlf?: boolean }
/** Line-oriented protocols (HTTP/1.1, SMTP, POP3, IMAP, FTP): one field per line, CRLF included. */
export function lines(kind: PartKind, title: string, rows: Line[]): Part {
  const w = new Writer();
  for (const row of rows) {
    const text = row.crlf === false ? row.text : row.text + '\r\n';
    const shown = row.text.length > 44 ? row.text.slice(0, 43) + '…' : row.text;
    w.put(row.name, shown === '' ? '⏎' : shown, ascii(text), row.note);
  }
  return w.part(kind, title);
}
export const line = (name: string, text: string, note: Text, crlf = true): Line => ({ name, text, note, crlf });

/* ------------------------------------------------------------------- DNS */

const qtypes = { A: 1, NS: 2, AAAA: 28 } as const;
type RType = keyof typeof qtypes;
export interface DnsRecord { name: string; type: RType; ttl: number; data: string }
export interface DnsMessage {
  id: number; question: string; qtype?: RType; response?: boolean; rd?: boolean; ra?: boolean; aa?: boolean;
  answers?: DnsRecord[]; authority?: DnsRecord[]; additional?: DnsRecord[];
}
const labels = (name: string): number[] =>
  [...name.split('.').filter(Boolean).flatMap(label => [label.length, ...ascii(label)]), 0];
const sections: Record<'answers' | 'authority' | 'additional', [string, Text]> = {
  answers: ['Answer', T('Réponse', 'Answer')],
  authority: ['Authority', T('Autorité', 'Authority')],
  additional: ['Additional', T('Additionnel', 'Additional')]
};

export function dns(m: DnsMessage): Part {
  const w = new Writer();
  const qtype = m.qtype ?? 'A';
  w.u16('Transaction ID', m.id, T(
    'Identifiant choisi par le demandeur ; la réponse le recopie pour être associée à la bonne question.',
    'Identifier picked by the asker; the reply copies it so it can be matched to the right question.'), hex(m.id));
  const flags = (m.response ? 0x8000 : 0) | (m.aa ? 0x0400 : 0) | (m.rd ? 0x0100 : 0) | (m.ra ? 0x0080 : 0);
  const named = [m.response ? 'Response' : 'Query', m.aa && 'AA', m.rd && 'RD', m.ra && 'RA', m.response && 'NOERROR'].filter(Boolean).join(', ');
  w.u16('Flags', flags, T(
    'QR distingue question et réponse ; RD demande une résolution complète ; RA indique que le serveur sait la faire ; AA signale une réponse qui fait autorité.',
    'QR tells a query from a response; RD asks for full resolution; RA says the server can do it; AA marks an authoritative answer.'), named);
  const count = (key: keyof typeof sections) => m[key]?.length ?? 0;
  w.u16('QDCOUNT', 1, T('Nombre de questions : une seule.', 'Number of questions: just one.'));
  w.u16('ANCOUNT', count('answers'), T('Nombre d’enregistrements dans la section réponse.', 'Number of records in the answer section.'));
  w.u16('NSCOUNT', count('authority'), T('Nombre d’enregistrements d’autorité : les serveurs à qui demander ensuite.', 'Number of authority records: the servers to ask next.'));
  w.u16('ARCOUNT', count('additional'), T('Nombre d’enregistrements additionnels, souvent les adresses de ces serveurs.', 'Number of additional records, often those servers’ addresses.'));
  w.put('QNAME', m.question, labels(m.question), T(
    'Le nom demandé, découpé en étiquettes précédées de leur longueur et terminé par un octet nul.',
    'The name asked for, split into labels each preceded by its length, and ended by a zero byte.'));
  w.u16('QTYPE', qtypes[qtype], T(
    qtype === 'A' ? 'Type 1 = A : on veut une adresse IPv4.' : 'Type de l’enregistrement demandé.',
    qtype === 'A' ? 'Type 1 = A: an IPv4 address is wanted.' : 'Type of record wanted.'), `${qtypes[qtype]} (${qtype})`);
  w.u16('QCLASS', 1, T('Classe 1 = IN, Internet.', 'Class 1 = IN, Internet.'), '1 (IN)');
  for (const key of ['answers', 'authority', 'additional'] as const) {
    for (const record of m[key] ?? []) {
      const [label, wording] = sections[key];
      const sameName = record.name === m.question;
      const name = sameName ? [0xc0, 0x0c] : labels(record.name);
      const rdata = record.type === 'NS' ? labels(record.data) : ipBytes(record.data);
      const bytes = [...name, ...u16(qtypes[record.type]), 0, 1, ...u32(record.ttl), ...u16(rdata.length), ...rdata];
      w.put(`${label} · ${record.type}`, `${record.name} → ${record.data}`, bytes, {
        fr: `${wording.fr} : ${record.name} ${record.type} ${record.data}, conservable ${record.ttl} s en cache.` +
          (sameName ? ' Le nom tient en 2 octets (c0 0c) : un pointeur vers le nom déjà écrit dans la question.' : ''),
        en: `${wording.en}: ${record.name} ${record.type} ${record.data}, cacheable for ${record.ttl} s.` +
          (sameName ? ' The name takes 2 bytes (c0 0c): a pointer back to the name already written in the question.' : '')
      });
    }
  }
  return w.part('dns', 'DNS');
}

/* ------------------------------------------------------------------ DHCP */

const dhcpTypes = { DISCOVER: 1, OFFER: 2, REQUEST: 3, ACK: 5 } as const;
export interface DhcpMessage {
  type: keyof typeof dhcpTypes; xid: number; mac: string;
  yiaddr?: string; server?: string; requested?: string; broadcast?: boolean;
}

export function dhcp(m: DhcpMessage): Part {
  const w = new Writer();
  const reply = m.type === 'OFFER' || m.type === 'ACK';
  w.u8('op', reply ? 2 : 1, T('1 = requête du client, 2 = réponse du serveur.', '1 = client request, 2 = server reply.'), reply ? '2 (BOOTREPLY)' : '1 (BOOTREQUEST)');
  w.u8('htype', 1, T('Type de matériel : 1 = Ethernet.', 'Hardware type: 1 = Ethernet.'), '1 (Ethernet)');
  w.u8('hlen', 6, T('Longueur d’une adresse MAC : 6 octets.', 'Length of a MAC address: 6 bytes.'));
  w.u8('hops', 0, T('Incrémenté par les relais DHCP ; aucun ici.', 'Increased by DHCP relays; none here.'));
  w.u32('xid', m.xid, T(
    'Numéro de transaction tiré au hasard par le client : les quatre messages d’un même échange le partagent.',
    'Transaction number picked at random by the client: all four messages of one exchange share it.'), hex(m.xid, 8));
  w.u16('secs', 0, T('Secondes écoulées depuis le début de la demande.', 'Seconds elapsed since the client began.'));
  w.u16('flags', m.broadcast ? 0x8000 : 0, T(
    'Bit de diffusion : le client, encore sans adresse, demande que la réponse soit diffusée.',
    'Broadcast bit: the client, still without an address, asks for the reply to be broadcast.'), m.broadcast ? 'Broadcast' : '0');
  const ip = (name: string, value: string | undefined, note: Text) => w.put(name, value ?? '0.0.0.0', ipBytes(value ?? '0.0.0.0'), note);
  ip('ciaddr', undefined, T('Adresse actuelle du client : il n’en a pas encore.', 'Client’s current address: it has none yet.'));
  ip('yiaddr', m.yiaddr, T('« Your address » : l’adresse que le serveur attribue au client.', '“Your address”: the address the server gives the client.'));
  ip('siaddr', undefined, T('Serveur pour un démarrage réseau ; inutilisé ici.', 'Server for network boot; unused here.'));
  ip('giaddr', undefined, T('Adresse d’un relais DHCP ; aucun ici.', 'Address of a DHCP relay; none here.'));
  const mac = m.mac.split(':').map(h => parseInt(h, 16));
  w.put('chaddr', m.mac, [...mac, ...new Array(10).fill(0)], T(
    'Adresse MAC du client, complétée par des zéros : c’est elle qui identifie la carte réseau.',
    'Client MAC address, padded with zeros: it identifies the network card.'));
  w.put('sname / file', T('vides', 'empty'), new Array(192).fill(0), T(
    '192 octets hérités de BOOTP (nom de serveur et fichier de démarrage), inutilisés ici.',
    '192 bytes inherited from BOOTP (server name and boot file), unused here.'));
  w.put('Magic cookie', '99.130.83.99', [99, 130, 83, 99], T(
    'Valeur fixe qui annonce que des options DHCP suivent.', 'Fixed value saying DHCP options follow.'));
  const option = (code: number, name: string, value: string | Text, data: number[], note: Text) =>
    w.put(`Option ${code} · ${name}`, value, [code, data.length, ...data], note);
  option(53, 'Message Type', m.type, [dhcpTypes[m.type]], T(
    'Le type de message DHCP : c’est cette option qui distingue Discover, Offer, Request et ACK.',
    'The DHCP message type: this option tells Discover, Offer, Request and ACK apart.'));
  if (m.requested) option(50, 'Requested IP', m.requested, ipBytes(m.requested), T(
    'L’adresse que le client accepte, reprise de l’offre.', 'The address the client accepts, taken from the offer.'));
  if (m.server) option(54, 'Server Identifier', m.server, ipBytes(m.server), T(
    'Le serveur concerné : en diffusant le Request, le client prévient aussi les autres serveurs que leur offre est déclinée.',
    'The server concerned: by broadcasting the Request, the client also tells other servers their offer is declined.'));
  if (reply) {
    option(51, 'Lease Time', T('86 400 s (24 h)', '86,400 s (24 h)'), u32(86400), T(
      'Durée du bail : le client devra le renouveler avant expiration.', 'Lease duration: the client must renew before it ends.'));
    option(1, 'Subnet Mask', '255.255.255.0', [255, 255, 255, 0], T('Masque du réseau local : /24.', 'Local network mask: /24.'));
    option(3, 'Router', '192.168.1.1', ipBytes('192.168.1.1'), T('La passerelle par défaut, pour sortir du réseau local.', 'The default gateway, to leave the local network.'));
    option(6, 'DNS', '192.168.1.1', ipBytes('192.168.1.1'), T('Le serveur DNS à utiliser.', 'The DNS server to use.'));
  } else {
    option(55, 'Parameter List', T('masque, routeur, DNS', 'mask, router, DNS'), [1, 3, 6], T(
      'Les réglages que le client souhaite recevoir : masque (1), routeur (3), DNS (6).',
      'The settings the client wants back: mask (1), router (3), DNS (6).'));
  }
  w.put('End', '255', [255], T('Fin de la liste d’options.', 'End of the options list.'));
  return w.part('dhcp', 'DHCP');
}

/* ------------------------------------------------------------------- TLS */

function record(w: Writer, type: number, typeName: string, length: number): void {
  w.u8('Content Type', type, T(
    '22 = handshake, 23 = données applicatives. En TLS 1.3, tout ce qui suit le ServerHello voyage sous le type 23.',
    '22 = handshake, 23 = application data. In TLS 1.3 everything after ServerHello travels as type 23.'), `${type} (${typeName})`);
  w.u16('Legacy Version', 0x0303, T(
    'Toujours 0x0303 (« TLS 1.2 ») pour ne pas dérouter les équipements intermédiaires ; la vraie version se négocie dans une extension.',
    'Always 0x0303 (“TLS 1.2”) so middleboxes are not confused; the real version is negotiated in an extension.'), '0x0303');
  w.u16('Record Length', length, T('Taille du contenu de l’enregistrement.', 'Size of the record’s content.'), size(length));
}
function handshake(w: Writer, type: number, name: string, length: number): void {
  w.u8('Handshake Type', type, T('Le type de message de handshake.', 'The handshake message type.'), `${type} (${name})`);
  w.put('Handshake Length', size(length), [(length >> 16) & 0xff, (length >> 8) & 0xff, length & 0xff], T(
    'Longueur du message sur 3 octets.', 'Message length on 3 bytes.'));
}
const ext = (type: number, body: number[]): number[] => [...u16(type), ...u16(body.length), ...body];
const vec8 = (b: ArrayLike<number>): number[] => [b.length, ...Array.from(b)];
const vec16 = (b: ArrayLike<number>): number[] => [...u16(b.length), ...Array.from(b)];

export function clientHello(host: string, seed: string): Part {
  const random = noise(seed + ':random', 32);
  const session = noise(seed + ':session', 32);
  const share = noise(seed + ':x25519-client', 32);
  const name = ascii(host);
  const exts: [string, string | Text, number[], Text][] = [
    ['server_name', host, ext(0, vec16([0, ...vec16(name)])), T(
      'SNI : le nom du site visé, en clair, pour que le serveur choisisse le bon certificat.',
      'SNI: the target site name, in clear, so the server picks the right certificate.')],
    ['supported_groups', 'x25519, secp256r1', ext(10, vec16([0x00, 0x1d, 0x00, 0x17])), T(
      'Courbes elliptiques acceptées pour l’échange de clés.', 'Elliptic curves accepted for the key exchange.')],
    ['signature_algorithms', 'ed25519, ecdsa_p256, rsa_pss', ext(13, vec16([0x08, 0x07, 0x04, 0x03, 0x08, 0x04])), T(
      'Signatures que le client sait vérifier sur le certificat.', 'Signatures the client can verify on the certificate.')],
    ['alpn', 'h2, http/1.1', ext(16, vec16([...vec8(ascii('h2')), ...vec8(ascii('http/1.1'))])), T(
      'Protocoles applicatifs proposés : HTTP/2 ou HTTP/1.1.', 'Application protocols offered: HTTP/2 or HTTP/1.1.')],
    ['supported_versions', 'TLS 1.3, TLS 1.2', ext(43, vec8([0x03, 0x04, 0x03, 0x03])), T(
      'C’est ici que le client annonce TLS 1.3 (0x0304).', 'This is where the client announces TLS 1.3 (0x0304).')],
    ['key_share', T('x25519, 32 octets', 'x25519, 32 bytes'), ext(51, vec16([0x00, 0x1d, ...vec16(share)])), T(
      'La moitié publique de l’échange Diffie-Hellman, envoyée d’emblée : le handshake ne prend qu’un aller-retour.',
      'The public half of the Diffie-Hellman exchange, sent up front, so the handshake takes a single round trip.')]
  ];
  const extBytes = exts.reduce((n, e) => n + e[2].length, 0);
  const body = 2 + 32 + 33 + 8 + 2 + 2 + extBytes;
  const w = new Writer();
  record(w, 22, 'Handshake', body + 4);
  handshake(w, 1, 'ClientHello', body);
  w.u16('Legacy Version', 0x0303, T('Figé à TLS 1.2 pour compatibilité.', 'Frozen at TLS 1.2 for compatibility.'), '0x0303');
  w.put('Random', T('32 octets aléatoires', '32 random bytes'), random, T(
    'Aléa du client, mêlé aux clés pour qu’aucune session ne ressemble à une autre.',
    'Client randomness, mixed into the keys so no two sessions look alike.'));
  w.put('Session ID', T('32 octets', '32 bytes'), vec8(session), T(
    'Champ hérité de TLS 1.2, rempli au hasard pour ressembler à une reprise de session.',
    'Field inherited from TLS 1.2, filled at random to look like a session resumption.'));
  w.put('Cipher Suites', 'AES_128_GCM, AES_256_GCM, CHACHA20', vec16([0x13, 0x01, 0x13, 0x02, 0x13, 0x03]), T(
    'Les trois suites de chiffrement TLS 1.3 proposées, par ordre de préférence.',
    'The three TLS 1.3 cipher suites offered, in order of preference.'));
  w.put('Compression', T('aucune', 'none'), [1, 0], T('Toujours « aucune » : la compression a été abandonnée.', 'Always “none”: compression was dropped.'));
  w.u16('Extensions Length', extBytes, T('Taille du bloc d’extensions.', 'Size of the extensions block.'), size(extBytes));
  for (const [n, value, bytes, note] of exts) w.put(n, value, bytes, note);
  return w.part('tls', 'TLS 1.3 · ClientHello');
}

export function serverHello(seed: string, clientSeed: string): Part {
  const random = noise(seed + ':random', 32);
  const session = noise(clientSeed + ':session', 32);
  const share = noise(seed + ':x25519-server', 32);
  const exts: [string, string | Text, number[], Text][] = [
    ['supported_versions', 'TLS 1.3', ext(43, [0x03, 0x04]), T('Le serveur confirme TLS 1.3.', 'The server confirms TLS 1.3.')],
    ['key_share', T('x25519, 32 octets', 'x25519, 32 bytes'), ext(51, [0x00, 0x1d, ...vec16(share)]), T(
      'La moitié publique du serveur. Avec celle du client, chaque côté calcule le même secret sans jamais l’envoyer.',
      'The server’s public half. Combined with the client’s, both sides compute the same secret without ever sending it.')]
  ];
  const extBytes = exts.reduce((n, e) => n + e[2].length, 0);
  const body = 2 + 32 + 33 + 2 + 1 + 2 + extBytes;
  const w = new Writer();
  record(w, 22, 'Handshake', body + 4);
  handshake(w, 2, 'ServerHello', body);
  w.u16('Legacy Version', 0x0303, T('Figé à TLS 1.2 pour compatibilité.', 'Frozen at TLS 1.2 for compatibility.'), '0x0303');
  w.put('Random', T('32 octets aléatoires', '32 random bytes'), random, T('Aléa du serveur.', 'Server randomness.'));
  w.put('Session ID', T('écho du client', 'client’s echo'), vec8(session), T('Recopie le Session ID du client.', 'Echoes the client’s Session ID.'));
  w.put('Cipher Suite', 'TLS_AES_128_GCM_SHA256', [0x13, 0x01], T(
    'La suite retenue parmi celles proposées.', 'The suite chosen among those offered.'));
  w.u8('Compression', 0, T('Aucune.', 'None.'), T('aucune', 'none'));
  w.u16('Extensions Length', extBytes, T('Taille du bloc d’extensions.', 'Size of the extensions block.'), size(extBytes));
  for (const [n, value, bytes, note] of exts) w.put(n, value, bytes, note);
  return w.part('tls', 'TLS 1.3 · ServerHello');
}

/** An encrypted TLS 1.3 record: only its 5-byte header is readable on the wire. */
export function tlsEncrypted(inner: string, innerNote: Text, length: number, seed: string): Part {
  const w = new Writer();
  record(w, 23, 'Application Data', length + 16);
  w.put('Encrypted Data', T(`${inner} (chiffré)`, `${inner} (encrypted)`), noise(seed, length), innerNote);
  w.put('Auth Tag', size(16), noise(seed + ':tag', 16), T(
    'Étiquette AEAD : si un seul bit a été modifié en route, le déchiffrement échoue.',
    'AEAD tag: if a single bit was changed in transit, decryption fails.'));
  return w.part('tls', `TLS 1.3 · ${inner}`, true);
}

/* ------------------------------------------------------------------- SSH */

export const sshIdent = (text: string, note: Text): Part =>
  lines('ssh', 'SSH · Identification', [line('Identification', text, note)]);

const sshMessages: Record<number, string> = {
  5: 'SERVICE_REQUEST', 6: 'SERVICE_ACCEPT', 20: 'KEXINIT', 21: 'NEWKEYS', 30: 'KEX_ECDH_INIT', 31: 'KEX_ECDH_REPLY',
  50: 'USERAUTH_REQUEST', 52: 'USERAUTH_SUCCESS', 60: 'USERAUTH_PK_OK', 90: 'CHANNEL_OPEN', 91: 'CHANNEL_OPEN_CONFIRMATION',
  94: 'CHANNEL_DATA', 98: 'CHANNEL_REQUEST'
};
export const sshString = (b: ArrayLike<number>): number[] => [...u32(b.length), ...Array.from(b)];

/** A cleartext SSH binary packet (RFC 4253 §6), before NEWKEYS takes effect. */
export function sshPacket(code: number, build: (w: Writer) => void, seed: string): Part {
  const body = new Writer();
  build(body);
  const payload = 1 + body.length;
  let padding = 8 - ((5 + payload) % 8);
  if (padding < 4) padding += 8;
  const w = new Writer();
  w.u32('Packet Length', 1 + payload + padding, T(
    'Longueur du paquet qui suit (sans ce champ).', 'Length of the packet that follows (excluding this field).'), size(1 + payload + padding));
  w.u8('Padding Length', padding, T(
    'Bourrage aléatoire pour que le paquet tombe sur un multiple de 8 octets.',
    'Random padding so the packet lands on a multiple of 8 bytes.'), size(padding));
  w.u8('Message', code, T('Le code du message SSH.', 'The SSH message code.'), `${code} (${sshMessages[code] ?? '?'})`);
  w.embed(body);
  w.put('Padding', size(padding), noise(seed + ':pad', padding), T('Octets de bourrage aléatoires.', 'Random padding bytes.'));
  return w.part('ssh', `SSH · ${sshMessages[code]}`);
}

/** After NEWKEYS (chacha20-poly1305@openssh.com): even the length is encrypted. */
export function sshEncrypted(message: string, length: number, seed: string, note: Text): Part {
  const w = new Writer();
  w.put('Encrypted Length', T('chiffré', 'encrypted'), noise(seed + ':len', 4), T(
    'Avec chacha20-poly1305, même la longueur du paquet est chiffrée : un observateur ne voit pas où s’arrêtent les messages.',
    'With chacha20-poly1305 even the packet length is encrypted, so an observer cannot see where messages end.'));
  w.put('Ciphertext', T(`${message} (chiffré)`, `${message} (encrypted)`), noise(seed, length), note);
  w.put('MAC', T('16 octets', '16 bytes'), noise(seed + ':mac', 16), T(
    'Étiquette Poly1305 qui garantit que le paquet n’a pas été modifié.', 'Poly1305 tag proving the packet was not tampered with.'));
  return w.part('ssh', `SSH · ${message}`, true);
}

/* ------------------------------------------------------------------- NTP */

const NTP_EPOCH = 2208988800; // seconds from 1900-01-01 to 1970-01-01
const ntpTime = (unixMs: number): number[] => {
  const seconds = Math.floor(unixMs / 1000) + NTP_EPOCH;
  const fraction = Math.round(((unixMs % 1000) / 1000) * 2 ** 32) >>> 0;
  return [...u32(seconds), ...u32(fraction)];
};
const stamp = (unixMs: number): string => new Date(unixMs).toISOString().replace('T', ' ').replace('Z', ' UTC');

/** NTPv4 (RFC 5905) client request or server reply, 48 bytes. Times are Unix milliseconds. */
export function ntp(reply: false, t1: number): Part;
export function ntp(reply: true, t1: number, t2: number, t3: number): Part;
export function ntp(reply: boolean, t1: number, t2 = 0, t3 = 0): Part {
  const w = new Writer();
  w.u8('LI / VN / Mode', reply ? 0x24 : 0x23, T(
    `Version 4, mode ${reply ? '4 = réponse du serveur' : '3 = requête d’un client'} (2 + 3 + 3 bits).`,
    `Version 4, mode ${reply ? '4 = server reply' : '3 = client request'} (2 + 3 + 3 bits).`), reply ? 'v4, server' : 'v4, client');
  w.u8('Stratum', reply ? 2 : 0, T(
    reply ? 'Strate 2 : ce serveur se synchronise sur une horloge de strate 1, elle-même reliée à une référence atomique ou GPS.' : 'Inconnue côté client.',
    reply ? 'Stratum 2: this server syncs to a stratum 1 clock, itself tied to an atomic or GPS reference.' : 'Unknown on the client side.'));
  w.u8('Poll', 6, T('Intervalle d’interrogation conseillé : 2⁶ = 64 s.', 'Suggested polling interval: 2⁶ = 64 s.'), '2⁶ s');
  w.u8('Precision', 0xec, T('Précision de l’horloge : 2⁻²⁰ s, environ une microseconde.', 'Clock precision: 2⁻²⁰ s, about a microsecond.'), '2⁻²⁰ s');
  w.u32('Root Delay', reply ? 0x00000150 : 0, T('Délai aller-retour jusqu’à la référence.', 'Round-trip delay to the reference.'));
  w.u32('Root Dispersion', reply ? 0x00000290 : 0, T('Erreur maximale estimée par rapport à la référence.', 'Maximum estimated error against the reference.'));
  w.put('Reference ID', reply ? '192.0.2.1' : '0', reply ? [192, 0, 2, 1] : [0, 0, 0, 0], T('Source de temps du serveur.', 'The server’s time source.'));
  w.put('Reference Time', reply ? stamp(t2 - 32000) : '0', reply ? ntpTime(t2 - 32000) : new Array(8).fill(0), T(
    'Dernière synchronisation du serveur.', 'Last time the server was synced.'));
  w.put('Origin Time', reply ? stamp(t1) : '0', reply ? ntpTime(t1) : new Array(8).fill(0), T(
    'T1 : l’heure d’envoi de la requête, recopiée par le serveur.', 'T1: when the request left, copied back by the server.'));
  w.put('Receive Time', reply ? stamp(t2) : '0', reply ? ntpTime(t2) : new Array(8).fill(0), T(
    'T2 : l’heure d’arrivée de la requête au serveur.', 'T2: when the request reached the server.'));
  w.put('Transmit Time', stamp(reply ? t3 : t1), ntpTime(reply ? t3 : t1), T(
    reply ? 'T3 : l’heure de départ de la réponse. Avec T4 (son arrivée), le client calcule le délai et le décalage de son horloge.'
      : 'T1 : l’heure à laquelle le client envoie sa requête.',
    reply ? 'T3: when the reply left. With T4 (its arrival) the client works out the delay and its clock offset.'
      : 'T1: when the client sends its request.'));
  return w.part('data', 'NTP');
}

/** Raw application bytes (e.g. a UDP payload). */
export function data(title: string, name: string, value: string | Text, bytes: Uint8Array, note: Text, kind: PartKind = 'data'): Part {
  const w = new Writer();
  w.put(name, value, bytes, note);
  return w.part(kind, title);
}
