import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HOLD, Player, schedule, TRAVEL, type Frame } from '../src/engine/player.ts';
import { scenarios } from '../src/scenarios/index.ts';

// The player only needs a frame clock; tests drive time by hand.
globalThis.requestAnimationFrame ??= (() => 0) as typeof requestAnimationFrame;
globalThis.cancelAnimationFrame ??= (() => {}) as typeof cancelAnimationFrame;

const tcp = scenarios.find(s => s.id === 'tcp')!;
const slots = schedule(tcp.events, () => 2);

test('slots follow one another, travel then hold', () => {
  assert.equal(slots[0].start, 0);
  for (let i = 0; i < slots.length; i++) {
    assert.ok(slots[i].arrive - slots[i].start >= TRAVEL * 0.7);
    assert.equal(slots[i].end - slots[i].arrive, HOLD);
    if (i) assert.equal(slots[i].start, slots[i - 1].end);
  }
});

test('seeking maps time to the right event and progress', () => {
  let last: Frame | undefined;
  const player = new Player(f => { last = f; });
  player.load(slots);
  assert.deepEqual([last!.index, last!.progress], [0, 0]);
  player.seek((slots[3].start + slots[3].arrive) / 2);
  assert.equal(last!.index, 3);
  assert.ok(Math.abs(last!.progress - 0.5) < 1e-9);
  player.previous();
  assert.deepEqual([last!.index, last!.progress], [2, 1]);
});

test('loading a scenario never reports the previous scenario’s time', () => {
  const frames: Frame[] = [];
  const player = new Player(f => frames.push(f));
  player.load(slots);
  player.seek(player.total);
  frames.length = 0;
  player.load(schedule(scenarios[0].events, () => 1));
  assert.ok(frames.every(f => f.time === 0), 'only the new start time is emitted');
});

test('with reduced motion, replay jumps straight to arrival', () => {
  let last: Frame | undefined;
  const player = new Player(f => { last = f; }, () => true);
  player.load(slots);
  player.replay(4);
  assert.deepEqual([last!.index, last!.progress, last!.playing], [4, 1, false]);
  player.next();
  assert.deepEqual([last!.index, last!.progress], [5, 1]);
});
