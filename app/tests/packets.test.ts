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
