import { T, type Part } from '../model.ts';
import { checksum, ipBytes, u16, Writer } from './bytes.ts';

/** Educational, field-accurate IPv4 control messages (RFC 2328, 2453, 4271).
 * Authentication and advanced options are intentionally absent, never faked. */
const note = (fr: string, en: string) => T(fr, en);

function ospfMessage(type: 1 | 2 | 3 | 4 | 5, routerId: string, body: (w: Writer) => void): Part {
  const w = new Writer();
  w.u8('Version', 2, note('Version OSPFv2 pour IPv4.', 'OSPFv2 for IPv4.'));
  w.u8('Packet Type', type, note('1 Hello, 2 DBD, 3 LSR, 4 LSU, 5 LSAck.', '1 Hello, 2 DBD, 3 LSR, 4 LSU, 5 LSAck.'));
  const length = w.u16('Packet Length', 0, note('En-tête OSPF (24 octets) et corps.', 'OSPF header (24 bytes) and body.'));
  w.put('Router ID', routerId, ipBytes(routerId), note('Identifiant stable du routeur, pas forcément son IP de liaison.', 'Stable router identifier, not necessarily its link address.'));
  w.put('Area ID', '0.0.0.0 (backbone)', [0, 0, 0, 0], note('Tous les routeurs de cet exemple appartiennent à la zone 0.', 'All routers in this example belong to area 0.'));
  const sum = w.u16('Checksum', 0, note('Contrôle OSPF sur le paquet sans les huit octets d’authentification.', 'OSPF checksum excluding the eight authentication bytes.'));
  w.u16('AuType', 0, note('Pas d’authentification OSPF dans cette démonstration.', 'No OSPF authentication in this demonstration.'));
  w.put('Authentication', '0 (non utilisé)', new Uint8Array(8), note('Octets réservés à l’authentification, ici nuls.', 'Authentication field, all zero here.'));
  body(w);
  w.patch16(length, w.length);
  w.patchValue(length, String(w.length));
  const value = checksum(w.bytes()); // AuType=0 and authentication bytes are zero.
  w.patch16(sum, value);
  w.patchValue(sum, '0x' + value.toString(16).padStart(4, '0'));
  return w.part('ospf', 'OSPFv2');
}

export function ospfHello(routerId: string, neighbors: string[] = []): Part {
  return ospfMessage(1, routerId, w => {
    w.put('Network Mask', '255.255.255.252', ipBytes('255.255.255.252'), note('Masque du lien point-à-point de démonstration.', 'Mask of the example point-to-point link.'));
    w.u16('Hello Interval', 10, note('Intervalle Hello attendu, en secondes.', 'Expected Hello interval in seconds.'));
    w.u8('Options', 2, note('Bit E : zone compatible avec les routes externes.', 'E bit: area supports external routes.'));
    w.u8('Router Priority', 1, note('Utilisée pour élire le DR sur un réseau multi-accès ; pas d’élection sur ce lien point-à-point.', 'Used to elect a DR on multi-access links; not used for this point-to-point link.'));
    w.u32('Router Dead Interval', 40, note('Sans Hello pendant 40 secondes, le voisin est déclaré perdu.', 'Without Hello for 40 seconds, the neighbor is declared down.'));
    w.put('Designated Router', '0.0.0.0', [0, 0, 0, 0], note('Aucun DR sur cette liaison point-à-point.', 'No DR on this point-to-point link.'));
    w.put('Backup Designated Router', '0.0.0.0', [0, 0, 0, 0], note('Aucun BDR sur cette liaison point-à-point.', 'No BDR on this point-to-point link.'));
    for (const id of neighbors) w.put('Neighbor Router ID', id, ipBytes(id), note('Voisin vu dans un Hello valide : relation bidirectionnelle.', 'Neighbor seen in a valid Hello: bidirectional discovery.'));
  });
}

export function ospfDbd(routerId: string, sequence: number, flags: number, advertisedLsa?: string): Part {
  return ospfMessage(2, routerId, w => {
    w.u16('Interface MTU', 1500, note('MTU de la liaison utilisée.', 'MTU of this link.'));
    w.u8('Options', 2, note('Capacités OSPF de la zone.', 'OSPF area capabilities.'));
    w.u8('I / M / MS', flags, note('Initialisation, autres descriptions, rôle maître/esclave.', 'Initialization, more descriptions, master/slave role.'));
    w.u32('DD Sequence', sequence, note('Synchronise l’échange des résumés de LSDB.', 'Synchronizes LSDB summary exchange.'));
    if (advertisedLsa) w.put('LSA Header Summary', advertisedLsa, routerLsa(advertisedLsa).bytes().slice(0, 20), note('Résumé d’une LSA disponible chez ce voisin.', 'Header summary of an LSA held by this neighbor.'));
  });
}

export function ospfRequest(routerId: string, lsaRouterId: string): Part {
  return ospfMessage(3, routerId, w => {
    w.u32('LS Type', 1, note('Type 1 : Router-LSA.', 'Type 1: Router-LSA.'));
    w.put('Link State ID', lsaRouterId, ipBytes(lsaRouterId), note('Router ID de la LSA demandée.', 'Router ID of the requested LSA.'));
    w.put('Advertising Router', lsaRouterId, ipBytes(lsaRouterId), note('Routeur qui a créé cette LSA.', 'Router that originated this LSA.'));
  });
}

/** Router-LSA with one stub-network link; RFC 2328 Appendix A.4.1. */
function routerLsa(origin: string): Writer {
  const w = new Writer();
  w.u16('LS Age', 1, note('Âge en secondes de l’annonce d’état de liens.', 'LSA age in seconds.'));
  w.u8('LS Options', 2, note('Options de la zone.', 'Area options.'));
  w.u8('LS Type', 1, note('Router-LSA : état des liaisons du routeur.', 'Router-LSA: state of this router’s links.'));
  w.put('Link State ID', origin, ipBytes(origin), note('Identifiant du routeur pour une Router-LSA.', 'Router identifier for a Router-LSA.'));
  w.put('Advertising Router', origin, ipBytes(origin), note('Émetteur de l’annonce.', 'LSA originator.'));
  w.u32('LS Sequence', 0x80000001, note('Version initiale de cette LSA ; augmente en cas de changement.', 'Initial version of this LSA; increases when it changes.'), '0x80000001');
  const checkAt = w.u16('LS Checksum', 0, note('Fletcher-16 de la LSA, hors champ LS Age.', 'Fletcher-16 over the LSA, excluding LS Age.'));
  w.u16('LS Length', 36, note('20 octets d’en-tête + 16 octets de données.', '20-byte header + 16-byte body.'));
  w.u8('V / E / B flags', 0, note('Routeur interne de démonstration.', 'Example internal router.'));
  w.u8('Reserved', 0, note('Réservé.', 'Reserved.'));
  w.u16('Number of Links', 1, note('Une entrée de réseau connecté est décrite.', 'One connected network entry is described.'));
  w.put('Link ID', '10.10.30.0', ipBytes('10.10.30.0'), note('Sous-réseau annoncé dans cette simulation.', 'Subnet advertised in this simulation.'));
  w.put('Link Data', '255.255.255.0', ipBytes('255.255.255.0'), note('Masque du réseau de transit simulé.', 'Mask of the simulated stub network.'));
  w.u8('Link Type', 3, note('3 = réseau terminal (stub).', '3 = stub network.'));
  w.u8('TOS Count', 0, note('Aucune métrique TOS supplémentaire.', 'No extra TOS metrics.'));
  w.u16('Cost', 10, note('Coût OSPF du lien, utilisé par SPF.', 'OSPF link cost used by SPF.'));
  // The two checksum bytes are LSA offsets 16 and 17; LS Age is omitted.
  const data = w.bytes();
  let c0 = 0, c1 = 0;
  for (let i = 2; i < data.length; i++) { c0 = (c0 + data[i]) % 255; c1 = (c1 + c0) % 255; }
  const x = ((data.length - 2 - 15) * c0 - c1 + 255 * 512) % 255;
  const y = (255 - (c0 + x) % 255) % 255;
  w.patch16(checkAt, (x << 8) | y);
  w.patchValue(checkAt, '0x' + ((x << 8) | y).toString(16).padStart(4, '0'));
  return w;
}

export function ospfUpdate(routerId: string, origin: string): Part {
  return ospfMessage(4, routerId, w => {
    w.u32('Number of LSAs', 1, note('Une LSA est diffusée de façon fiable.', 'One LSA is flooded reliably.'));
    w.embed(routerLsa(origin));
  });
}

export function ospfAck(routerId: string, origin: string): Part {
  return ospfMessage(5, routerId, w => {
    const header = routerLsa(origin).bytes().slice(0, 20);
    w.put('Acknowledged LSA Header', origin, header, note('Accuse réception de la LSA sans recopier son corps.', 'Acknowledges the LSA header without repeating its body.'));
  });
}

function ripBase(command: 1 | 2, body: (w: Writer) => void): Part {
  const w = new Writer();
  w.u8('Command', command, note('1 = Request, 2 = Response.', '1 = Request, 2 = Response.'));
  w.u8('Version', 2, note('RIPv2 transporte les masques de sous-réseau.', 'RIPv2 carries subnet masks.'));
  w.u16('Reserved', 0, note('Deux octets obligatoirement nuls.', 'Two reserved zero bytes.'));
  body(w);
  return w.part('rip', 'RIPv2');
}

export function ripRequest(): Part {
  return ripBase(1, w => {
    w.u16('Address Family', 0, note('0 = demande de table complète.', '0 = request for the full routing table.'));
    w.u16('Route Tag', 0, note('Nul pour une requête globale.', 'Zero for a full-table request.'));
    for (const key of ['IP Address', 'Subnet Mask', 'Next Hop'] as const) w.put(key, '0.0.0.0', [0, 0, 0, 0], note('Entrée générique de demande.', 'Wildcard request entry.'));
    w.u32('Metric', 16, note('La métrique 16 dans une Request demande toutes les routes.', 'Metric 16 in a Request asks for every route.'));
  });
}

export function ripResponse(prefix: string, mask: string, metric: number): Part {
  if (metric < 1 || metric > 16) throw new RangeError('RIPv2 metric must be 1..16');
  return ripBase(2, w => {
    w.u16('Address Family', 2, note('2 = famille IPv4.', '2 = IPv4 address family.'));
    w.u16('Route Tag', 0, note('Identifiant de redistribution non utilisé ici.', 'Route redistribution tag, unused here.'));
    w.put('IP Address', prefix, ipBytes(prefix), note('Préfixe de destination annoncé.', 'Advertised destination prefix.'));
    w.put('Subnet Mask', mask, ipBytes(mask), note('Masque explicite : avantage de RIPv2 sur RIPv1.', 'Explicit mask: improvement over RIPv1.'));
    w.put('Next Hop', '0.0.0.0', [0, 0, 0, 0], note('Utiliser l’émetteur de cette annonce comme prochain saut.', 'Use this update’s sender as next hop.'));
    w.u32('Metric', metric, note('Distance en sauts : 16 signifie injoignable.', 'Hop-count metric: 16 means unreachable.'));
  });
}

const prefixBytes = (address: string, bits: number): number[] => {
  if (bits < 0 || bits > 32) throw new RangeError('Invalid IPv4 prefix');
  return [bits, ...ipBytes(address).slice(0, Math.ceil(bits / 8))];
};

function bgpMessage(type: 1 | 2 | 4, body: (w: Writer) => void): Part {
  const w = new Writer();
  w.put('Marker', 'FF × 16', new Uint8Array(16).fill(0xff), note('Marqueur BGP de 16 octets.', '16-byte BGP marker.'));
  const at = w.u16('Length', 0, note('Longueur totale, en-tête de 19 octets inclus.', 'Total length, including the 19-byte header.'));
  w.u8('Type', type, note('1 OPEN, 2 UPDATE, 4 KEEPALIVE.', '1 OPEN, 2 UPDATE, 4 KEEPALIVE.'));
  body(w);
  w.patch16(at, w.length);
  w.patchValue(at, String(w.length));
  return w.part('bgp', 'BGP-4');
}

export function bgpOpen(asn: number, routerId: string): Part {
  return bgpMessage(1, w => {
    w.u8('Version', 4, note('Version BGP-4.', 'BGP-4 version.'));
    w.u16('My AS', asn, note('AS privé de laboratoire sur 2 octets.', 'Two-byte private lab AS number.'));
    w.u16('Hold Time', 90, note('Délai maximal négocié sans message du pair.', 'Negotiated maximum interval without a peer message.'));
    w.put('BGP Identifier', routerId, ipBytes(routerId), note('Identifiant BGP du routeur.', 'Router BGP identifier.'));
    w.u8('Optional Parameters Length', 0, note('Aucune capacité additionnelle négociée dans cet exemple.', 'No extra capabilities negotiated in this example.'));
  });
}

export const bgpKeepalive = (): Part => bgpMessage(4, () => {});

export function bgpUpdate(prefix: string, bits: number, asPath: number[], nextHop: string): Part {
  return bgpMessage(2, w => {
    w.u16('Withdrawn Routes Length', 0, note('Aucune route retirée dans cette annonce.', 'No withdrawn routes in this advertisement.'));
    const a = new Writer();
    a.put('ORIGIN', 'IGP (0)', [0x40, 1, 1, 0], note('Route originaire de l’AS annoncé.', 'Route originated by the advertising AS.'));
    a.put('AS_PATH', asPath.join(' '), [0x40, 2, 2 + 2 * asPath.length, 2, asPath.length, ...asPath.flatMap(u16)],
      note('Séquence des AS traversés ; aide à éviter les boucles et à choisir une route.', 'Sequence of crossed ASes; helps avoid loops and select routes.'));
    a.put('NEXT_HOP', nextHop, [0x40, 3, 4, ...ipBytes(nextHop)],
      note('Adresse du prochain saut annoncée au voisin eBGP.', 'Next hop advertised to the eBGP peer.'));
    w.u16('Total Path Attribute Length', a.length, note('Taille des attributs suivants.', 'Length of the following path attributes.'));
    w.embed(a);
    const p = prefixBytes(prefix, bits);
    w.put('NLRI', prefix + '/' + bits, p, note('Préfixe IPv4 joignable par ce chemin.', 'IPv4 prefix reachable via this path.'));
  });
}

export function bgpWithdraw(prefix: string, bits: number): Part {
  return bgpMessage(2, w => {
    const p = prefixBytes(prefix, bits);
    w.u16('Withdrawn Routes Length', p.length, note('Nombre d’octets de préfixes retirés.', 'Byte length of withdrawn prefixes.'));
    w.put('Withdrawn Route', prefix + '/' + bits, p, note('Le chemin précédemment annoncé n’est plus utilisable.', 'The previously advertised path is no longer usable.'));
    w.u16('Total Path Attribute Length', 0, note('Aucun attribut ni NLRI pour ce retrait pur.', 'No attributes or NLRI for a withdrawal-only UPDATE.'));
  });
}
