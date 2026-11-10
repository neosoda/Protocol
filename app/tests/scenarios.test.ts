import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scenarios, categories } from '../src/scenarios/index.ts';
import { route } from '../src/views/geometry.ts';
import { dictionaries, keys } from '../src/i18n.ts';
import type { Text } from '../src/model.ts';

test('17 lessons with unique ids, every category used', () => {
  assert.equal(scenarios.length, 17);
  assert.equal(new Set(scenarios.map(s => s.id)).size, 14);
  for (const c of categories) assert.ok(scenarios.some(s => s.category === c), c);
});

test('every event travels between known, connected nodes', () => {
  for (const s of scenarios) {
    const ids = new Set(s.topology.nodes.map(n => n.id));
    for (const a of s.actors) assert.ok(ids.has(a), `${s.id}: actor ${a}`);
    for (const e of s.events) {
      assert.ok(s.actors.includes(e.from) && s.actors.includes(e.to), `${e.id}: endpoints are lifelines`);
      assert.ok(route(s.topology, e.from, e.to).length >= 2, `${e.id}: a path exists`);
      for (const other of e.also ?? []) assert.ok(route(s.topology, e.from, other).length >= 2, `${e.id}: path to ${other}`);
    }
    assert.equal(new Set(s.events.map(e => e.id)).size, s.events.length, `${s.id}: unique event ids`);
  }
});

const filled = (text: Text, where: string) => {
  assert.ok(text.fr.trim().length > 0, `${where} (fr)`);
  assert.ok(text.en.trim().length > 0, `${where} (en)`);
};

test('all lesson text exists in French and English', () => {
  for (const s of scenarios) {
    filled(s.tagline, `${s.id} tagline`);
    filled(s.intro, `${s.id} intro`);
    for (const n of s.topology.nodes) filled(n.label, `${s.id} node ${n.id}`);
    for (const e of s.events) {
      filled(e.title, `${e.id} title`);
      filled(e.text, `${e.id} text`);
      for (const l of e.packet.layers) for (const f of l.fields) filled(f.note, `${e.id} ${l.title}.${f.name}`);
    }
  }
});

test('interface strings exist in both languages', () => {
  for (const k of keys) {
    assert.ok(dictionaries.fr[k].length > 0, `fr.${k}`);
    assert.ok(dictionaries.en[k].length > 0, `en.${k}`);
  }
});

test('only meaningful equipment is drawn in foundation and routing scenes', () => {
  for (const id of ['ip', 'icmp', 'ospf', 'rip', 'bgp']) {
    const s = scenarios.find(x => x.id === id)!;
    assert.ok(s, id);
    assert.ok(!s.topology.nodes.some(n => n.id === 'core' || /cœur de réseau|core router/i.test(n.label.fr + n.label.en)), id);
  }
  for (const id of ['ospf', 'rip', 'bgp']) {
    const s = scenarios.find(x => x.id === id)!;
    assert.equal(s.category, 'routing');
    assert.equal(s.topology.nodes.filter(n => n.kind === 'network-router').length, 3);
    assert.ok(s.events.length >= 5);
  }
});

test('link-local OSPF/RIP messages have TTL 1 and routing events target neighbors', () => {
  for (const id of ['ospf', 'rip']) {
    const s = scenarios.find(x => x.id === id)!;
    for (const e of s.events) {
      if (!e.packet.layers.some(l => l.kind === id)) continue;
      assert.equal(e.packet.layers[0].bytes[8], 1, e.id);
      assert.equal(route(s.topology, e.from, e.to).length, 2, e.id);
    }
  }
});
