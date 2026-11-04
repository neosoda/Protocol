import test from 'node:test';
import assert from 'node:assert/strict';
import { catalog } from '../src/protocols/catalog.ts';
import { clampIndex, createTimeline, transition } from '../src/engine/timeline.ts';

test('catalogue: 14 unique validated references and participant links', () => {
  assert.equal(catalog.length, 14);
  assert.equal(new Set(catalog.map(p => p.id)).size, 14);
  for (const scenario of catalog) {
    assert.ok(scenario.events.length >= 2, scenario.id);
    assert.equal(scenario.modelled, true);
    const participants = new Set(scenario.participants.map(p => p.id));
    assert.equal(participants.size, scenario.participants.length, scenario.id);
    for (const e of scenario.events) {
      assert.ok(participants.has(e.from) && participants.has(e.to), scenario.id + '/' + e.id);
      assert.ok(e.title && e.description, scenario.id + '/' + e.id);
      assert.ok(e.from !== e.to, scenario.id + '/' + e.id);
    }
    assert.equal(new Set(scenario.events.map(e => e.id)).size, scenario.events.length);
  }
});

test('navigation is bounded, selection pauses and invalid index falls back to zero', () => {
  const s = { protocolId: 'tcp', index: 0, playing: false, speed: 1 as const };
  assert.equal(transition(s, { type: 'PREVIOUS' }, 3).index, 0);
  assert.equal(transition(s, { type: 'SELECT', index: 200 }, 3).index, 2);
  assert.equal(clampIndex(NaN, 3), 0);
  assert.equal(transition(s, { type: 'NEXT' }, 3).index, 1);
  assert.equal(transition({ ...s, playing: true }, { type: 'SELECT', index: 1 }, 3).playing, false);
});

test('protocol switch synchronizes index and always stops playback', () => {
  const changed: string[] = [];
  const engine = createTimeline(catalog[0], s => changed.push(s.protocolId + ':' + s.index));
  engine.dispatch({ type: 'NEXT' });
  engine.setProtocol(catalog[1], 999);
  const state = engine.getState();
  assert.equal(state.protocolId, catalog[1].id);
  assert.equal(state.playing, false);
  assert.equal(state.index, catalog[1].events.length - 1);
  assert.ok(changed.length > 0);
  engine.dispose();
});

test('end of timeline does not start playback from a terminal event', () => {
  const s = { protocolId: 'dns', index: 2, speed: 1 as const, playing: false };
  const toggled = transition(s, { type: 'TOGGLE' }, 3);
  assert.equal(toggled.index, 0);
  assert.equal(toggled.playing, true);
  assert.equal(transition(toggled, { type: 'RESET' }, 3).playing, false);
});
