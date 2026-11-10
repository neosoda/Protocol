import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checksum, ipBytes } from '../src/packets/bytes.ts';
import { scenarios } from '../src/scenarios/index.ts';
import type { Layer, Packet } from '../src/model.ts';

const layer = (packet: Packet, kind: Layer['kind']) => packet.layers.find(l => l.kind === kind);
const u16 = (b: Uint8Array, at: number) => (b[at] << 8) | b[at + 1];
const u32 = (b: Uint8Array, at: number) => ((b[at] << 24) | (b[at + 1] << 16) | (b[at + 2] << 8) | b[at + 3]) >>> 0;
const all = scenarios.flatMap(s => s.events.map(e => ({ s, e })));

test('every IPv4 header checksum verifies and its lengths match the packet', () => {
  for (const { e } of all) {
    const ip = layer(e.packet, 'ip');
    assert.ok(ip, `${e.id} has an IPv4 header`);
    assert.equal(checksum(ip.bytes), 0, `${e.id}: header checksum`);
    assert.equal(ip.bytes[0], 0x45, `${e.id}: version/IHL`);
    assert.equal(u16(ip.bytes, 2), e.packet.bytes.length, `${e.id}: total length`);
  }
});

test('every TCP, UDP and ICMP checksum verifies', () => {
  for (const { e } of all) {
    const ip = layer(e.packet, 'ip')!;
    const payload = e.packet.bytes.slice(ip.bytes.length);
    const protocol = ip.bytes[9];
    if (protocol === 1) { assert.equal(checksum(payload), 0, `${e.id}: ICMP`); continue; }
    if (protocol === 89) { assert.equal(checksum([...payload.slice(0, 16), ...payload.slice(24)]), 0, `${e.id}: OSPF checksum`); continue; }
    assert.ok(protocol === 6 || protocol === 17, `${e.id}: supported IPv4 payload`);
    const pseudo = [...ip.bytes.slice(12, 20), 0, protocol, payload.length >> 8, payload.length & 0xff];
    assert.equal(checksum(pseudo, payload), 0, `${e.id}: ${protocol === 6 ? 'TCP' : 'UDP'}`);
    if (protocol === 17) assert.equal(u16(payload, 4), payload.length, `${e.id}: UDP length`);
  }
});

test('fields stay inside their packet and layers tile it without gaps', () => {
  for (const { e } of all) {
    let at = 0;
    for (const l of e.packet.layers) {
      assert.equal(l.offset, at, `${e.id}: ${l.title} starts where the previous layer ends`);
      at += l.bytes.length;
      for (const f of l.fields) {
        assert.ok(f.length > 0, `${e.id}: ${f.name} is not empty`);
        assert.ok(f.offset >= l.offset && f.offset + f.length <= l.offset + l.bytes.length, `${e.id}: ${f.name} inside ${l.title}`);
      }
    }
    assert.equal(at, e.packet.bytes.length, `${e.id}: layers cover the packet`);
  }
});

test('TCP sequence and acknowledgment numbers follow the conversation', () => {
  const tcp = scenarios.find(s => s.id === 'tcp')!;
  const head = (i: number) => {
    const p = tcp.events[i].packet;
    const t = layer(p, 'tcp')!;
    return { seq: u32(t.bytes, 4), ack: u32(t.bytes, 8), flags: t.bytes[13], data: p.bytes.length - t.offset - (t.bytes[12] >> 4) * 4 };
  };
  const [syn, synAck, ack, data1, ack1, lost, resent, ack2, fin, finAck, last] = tcp.events.map((_, i) => head(i));
  assert.equal(syn.flags, 0x02);
  assert.equal(synAck.ack, syn.seq + 1, 'SYN uses one number');
  assert.equal(ack.seq, syn.seq + 1);
  assert.equal(ack.ack, synAck.seq + 1);
  assert.equal(data1.data, 12);
  assert.equal(ack1.ack, data1.seq + 12);
  assert.deepEqual([lost.seq, lost.data], [resent.seq, resent.data], 'retransmission repeats the lost segment');
  assert.equal(ack2.ack, resent.seq + resent.data);
  assert.equal(finAck.ack, fin.seq + 1, 'FIN uses one number');
  assert.equal(last.ack, finAck.seq + 1);
  assert.equal(tcp.events[5].drop, true);
});

test('DNS answers carry the question ID and the right address', () => {
  const dns = scenarios.find(s => s.id === 'dns')!;
  const msg = (i: number) => layer(dns.events[i].packet, 'dns')!.bytes;
  assert.equal(u16(msg(0), 0), u16(msg(7), 0), 'final answer reuses the client ID');
  const answer = msg(7);
  assert.equal(u16(answer, 2) & 0x8000, 0x8000, 'QR set on the answer');
  assert.deepEqual([...answer.slice(-4)], ipBytes('203.0.113.10'));
});

test('DHCP keeps one transaction ID through DORA', () => {
  const dhcp = scenarios.find(s => s.id === 'dhcp')!;
  const xids = dhcp.events.map(e => u32(layer(e.packet, 'dhcp')!.bytes, 4));
  assert.equal(new Set(xids).size, 1);
  const types = dhcp.events.map(e => {
    const b = layer(e.packet, 'dhcp')!.bytes;
    return b[240 + 2]; // option 53 follows the magic cookie
  });
  assert.deepEqual(types, [1, 2, 3, 5]);
});

test('traceroute probes expire where the lesson says', () => {
  const icmp = scenarios.find(s => s.id === 'icmp')!;
  const ttl = (i: number) => layer(icmp.events[i].packet, 'ip')!.bytes[8];
  assert.equal(ttl(2), 1);
  assert.equal(ttl(4), 2);
  assert.equal(layer(icmp.events[3].packet, 'icmp')!.bytes[0], 11);
});

test('HTTP Content-Length matches the body', () => {
  const http = scenarios.find(s => s.id === 'http')!;
  const text = new TextDecoder().decode(layer(http.events[4].packet, 'http')!.bytes);
  const [headers, body] = text.split('\r\n\r\n');
  const length = Number(/Content-Length: (\d+)/.exec(headers)![1]);
  assert.equal(new TextEncoder().encode(body).length, length);
});

test('TLS records announce their real length', () => {
  for (const id of ['tls', 'https']) {
    for (const e of scenarios.find(s => s.id === id)!.events) {
      for (const l of e.packet.layers.filter(x => x.kind === 'tls')) {
        assert.equal(u16(l.bytes, 3), l.bytes.length - 5, `${e.id}: ${l.title}`);
      }
    }
  }
});

test('SSH cleartext packets are padded to a multiple of 8', () => {
  for (const e of scenarios.find(s => s.id === 'ssh')!.events) {
    for (const l of e.packet.layers.filter(x => x.kind === 'ssh' && !x.encrypted && x.bytes[0] !== 0x53)) {
      assert.equal(u32(l.bytes, 0) + 4, l.bytes.length, `${e.id}: packet_length`);
      assert.equal(l.bytes.length % 8, 0, `${e.id}: block alignment`);
      assert.ok(l.bytes[4] >= 4, `${e.id}: at least 4 padding bytes`);
    }
  }
});

test('OSPFv2 fields and Router-LSA checksums are coherent', () => {
  const s = scenarios.find(x => x.id === 'ospf')!;
  const ospf = s.events.filter(e => e.packet.layers.some(l => l.kind === 'ospf'));
  assert.ok(ospf.length >= 6);
  for (const e of ospf) {
    assert.equal(e.packet.layers[0].bytes[9], 89, e.id);
    const o = layer(e.packet, 'ospf')!.bytes;
    assert.equal(o[0], 2, e.id);
    assert.equal(u16(o, 2), o.length, e.id);
    assert.equal(o.length >= 24, true, e.id);
  }
  const dbd = layer(s.events.find(e => e.label === 'DB Description')!.packet, 'ospf')!.bytes;
  assert.equal(dbd[1], 2);
  assert.equal(dbd.length, 24 + 8 + 20, 'DBD advertises the router LSA header');
  for (const e of s.events.filter(e => e.label.includes('LS Update') || e.label.includes('Flooding'))) {
    const o = layer(e.packet, 'ospf')!.bytes;
    assert.equal(o[1], 4);
    assert.equal(u32(o, 24), 1, 'one LSA in the update');
    const lsa = o.subarray(28);
    assert.equal(u16(lsa, 18), lsa.length, 'LSA length');
    let a = 0, b = 0;
    for (const octet of lsa.subarray(2)) { a = (a + octet) % 255; b = (b + a) % 255; }
    assert.equal(a, 0, 'LSA Fletcher c0');
    assert.equal(b, 0, 'LSA Fletcher c1');
  }
});

test('RIPv2 messages use UDP 520 multicast and obey 1..16 hop metrics', () => {
  const s = scenarios.find(x => x.id === 'rip')!;
  const rip = s.events.filter(e => e.packet.layers.some(l => l.kind === 'rip'));
  assert.equal(rip.length, 5);
  for (const e of rip) {
    const ip = layer(e.packet, 'ip')!.bytes;
    const udp = layer(e.packet, 'udp')!.bytes;
    const data = layer(e.packet, 'rip')!.bytes;
    assert.equal(ip[9], 17);
    assert.deepEqual([...ip.slice(16, 20)], ipBytes('224.0.0.9'));
    assert.equal(u16(udp, 0), 520);
    assert.equal(u16(udp, 2), 520);
    assert.equal(data[1], 2);
    assert.equal(data.length, 24);
    assert.equal(u32(data, 20) >= 1 && u32(data, 20) <= 16, true);
  }
  const updates = rip.filter(e => layer(e.packet, 'rip')!.bytes[0] === 2);
  assert.deepEqual(updates.map(e => u32(layer(e.packet, 'rip')!.bytes, 20)), [1, 2, 16, 16]);
});

test('BGP uses TCP 179 with valid OPEN, KEEPALIVE and UPDATE frames', () => {
  const s = scenarios.find(x => x.id === 'bgp')!;
  const msgs = s.events.flatMap(e => e.packet.layers.filter(l => l.kind === 'bgp'));
  assert.ok(msgs.length >= 7);
  const types = new Set<number>();
  for (const l of msgs) {
    assert.deepEqual([...l.bytes.slice(0, 16)], Array(16).fill(0xff));
    assert.equal(u16(l.bytes, 16), l.bytes.length, l.title);
    types.add(l.bytes[18]);
    if (l.bytes[18] === 4) assert.equal(l.bytes.length, 19, 'KEEPALIVE has no body');
    if (l.bytes[18] === 2) {
      const withdrawn = u16(l.bytes, 19);
      const attrs = u16(l.bytes, 21 + withdrawn);
      assert.ok(23 + withdrawn + attrs <= l.bytes.length, 'UPDATE attributes fit');
    }
  }
  assert.deepEqual([...types].sort((a,b) => a-b), [1, 2, 4]);
  for (const e of s.events.filter(e => e.packet.layers.some(l => l.kind === 'bgp'))) {
    assert.equal(layer(e.packet, 'ip')!.bytes[9], 6);
    const t = layer(e.packet, 'tcp')!.bytes;
    assert.ok(u16(t, 0) === 179 || u16(t, 2) === 179, e.id);
  }
});
