import test from 'node:test';
import assert from 'node:assert/strict';
import { catalog } from '../src/protocols/catalog.ts';

const get = (id: string) => {
  const item = catalog.find(s => s.id === id);
  assert.ok(item, id + ' scenario exists');
  return item;
};
const value = (eventIndex: number, scenario: ReturnType<typeof get>, name: string) =>
  scenario.events[eventIndex].fields.find(field => field.name === name)?.value;

test('TCP: the SYN flags occupy one sequence number and data advances ACK by byte length', () => {
  const tcp = get('tcp');
  assert.equal(value(0, tcp, 'SEQ'), '1000');
  assert.equal(value(1, tcp, 'ACK'), '1001');
  assert.equal(value(1, tcp, 'SEQ'), '5000');
  assert.equal(value(2, tcp, 'ACK'), '5001');
  assert.equal(value(3, tcp, 'SEQ'), '1001');
  assert.equal(new TextEncoder().encode(tcp.events[3].sample!).length, 3);
  assert.equal(value(4, tcp, 'ACK'), '1004');
});

test('DHCPv4: DORA is chronological, with ports 68 to 67 on discovery', () => {
  const dhcp = get('dhcp');
  assert.deepEqual(dhcp.events.map(e => e.title), ['Discover', 'Offer', 'Request', 'ACK']);
  assert.equal(value(0, dhcp, 'UDP'), '68 → 67');
});

test('TLS1.3: encrypted server messages, server Finished, client Finished, application traffic', () => {
  const tls = get('tls');
  assert.deepEqual(tls.events.map(e => e.id), [
    'tls-1','tls-2','tls-3','tls-4','tls-5','tls-6','tls-7'
  ]);
  assert.match(tls.events[2].title, /EncryptedExtensions/);
  assert.match(tls.events[4].title, /Finished serveur/);
  assert.match(tls.events[5].title, /Finished client/);
  const https = get('https');
  assert.equal(https.events.findIndex(e => e.title.includes('Finished client')) <
    https.events.findIndex(e => e.title.includes('Requête HTTP')), true);
});

test('only valid byte ranges can point to the UTF-8 example, never synthetic headers', () => {
  for (const scenario of catalog) for (const event of scenario.events) {
    const size = event.sample === undefined ? 0 : new TextEncoder().encode(event.sample).length;
    for (const field of event.fields) if (field.sampleRange) {
      assert.ok(event.sample !== undefined, scenario.id + '/' + event.id);
      assert.ok(Number.isInteger(field.sampleRange.offset));
      assert.ok(Number.isInteger(field.sampleRange.length));
      assert.ok(field.sampleRange.offset >= 0 && field.sampleRange.length > 0);
      assert.ok(field.sampleRange.offset + field.sampleRange.length <= size);
    }
  }
  const http = get('http').events[0];
  const range = http.fields[0].sampleRange!;
  assert.equal(new TextDecoder().decode(new TextEncoder().encode(http.sample!).slice(range.offset, range.offset+range.length)), 'GET');
});


test('HTTP/1.1: Content-Length matches authored UTF-8 response body length', () => {
  const response = get('http').events[1];
  assert.ok(response.sample);
  const [headers, body, ...extra] = response.sample.split('\r\n\r\n');
  assert.equal(extra.length, 0, 'one header/body separator');
  assert.match(headers, /^HTTP\/1\.1 200 OK\r\n/);
  const declared = Number(headers.match(/(?:^|\r\n)Content-Length:\s*(\d+)/i)?.[1]);
  const actual = new TextEncoder().encode(body).length;
  assert.equal(declared, 7);
  assert.equal(declared, actual);
  assert.equal(response.fields.find(f => f.name === 'Content-Length')?.value, String(actual));
});

test('SSH: KEXINIT, NEWKEYS, user authentication and channel confirmation are in order', () => {
  const events = get('ssh').events;
  assert.equal(events.length, 14);
  assert.deepEqual(events.map(e => e.id), Array.from({ length: 14 }, (_, i) => 'ssh-' + (i + 1)));
  assert.deepEqual(events.slice(0, 4).map(e => e.from), ['client', 'auth', 'client', 'auth']);
  const idx = (title: string) => events.findIndex(e => e.title.includes(title));
  assert.ok(idx('KEXINIT serveur') < idx('NEWKEYS client'));
  assert.ok(idx('NEWKEYS client') < idx('SERVICE_REQUEST'));
  assert.ok(idx('NEWKEYS serveur') < idx('SERVICE_REQUEST'));
  assert.ok(idx('SERVICE_ACCEPT') < idx('USERAUTH_REQUEST'));
  assert.ok(idx('USERAUTH_REQUEST') < idx('USERAUTH_SUCCESS'));
  assert.ok(idx('USERAUTH_SUCCESS') < idx('CHANNEL_OPEN'));
  assert.ok(idx('CHANNEL_OPEN_CONFIRMATION') < idx('CHANNEL_REQUEST'));
  assert.equal(events[idx('USERAUTH_SUCCESS')].from, 'auth');
  assert.equal(events[idx('CHANNEL_OPEN_CONFIRMATION')].from, 'auth');
});
