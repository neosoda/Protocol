import type { NetEvent } from '../model.ts';

/** Milliseconds of animation for one event, before the speed multiplier. */
export const TRAVEL = 1500;
/** Pause after arrival while playing, so the explanation can be read. */
export const HOLD = 1300;

export interface Slot { start: number; arrive: number; end: number }
export function schedule(events: readonly NetEvent[], hops: (e: NetEvent) => number): Slot[] {
  let t = 0;
  return events.map(event => {
    const travel = TRAVEL * (0.7 + 0.15 * Math.min(4, hops(event)));
    const slot = { start: t, arrive: t + travel, end: t + travel + HOLD };
    t = slot.end;
    return slot;
  });
}

export interface Frame {
  /** Index of the event on screen. */
  index: number;
  /** 0 → 1 while the packet travels; 1 once it has arrived. */
  progress: number;
  playing: boolean;
  time: number;
  total: number;
}

/**
 * Scenario time runs from 0 to the last event's end. Playing advances it;
 * stepping plays a single event then stops at its arrival.
 */
export class Player {
  private slots: Slot[] = [];
  private time = 0;
  private stopAt: number | null = null;
  private playing = false;
  private last = 0;
  private raf = 0;
  speed = 1;
  private readonly onFrame: (frame: Frame) => void;
  private readonly instant: () => boolean;

  constructor(onFrame: (frame: Frame) => void, instant: () => boolean = () => false) {
    this.onFrame = onFrame;
    this.instant = instant;
  }

  /** Loads a scenario, showing event `arrived` as delivered (-1: before the first departure). */
  load(slots: Slot[], arrived = -1): void {
    // Stop and reset the clock before emitting: the old time means nothing in the new scenario.
    this.playing = false;
    this.stopAt = null;
    cancelAnimationFrame(this.raf);
    this.slots = slots;
    this.time = arrived >= 0 && slots.length ? slots[Math.min(arrived, slots.length - 1)].arrive : 0;
    this.emit();
  }

  get total(): number { return this.slots.at(-1)?.end ?? 0; }
  get isPlaying(): boolean { return this.playing; }

  frame(): Frame {
    const t = this.time;
    let index = this.slots.findIndex(s => t < s.end);
    if (index === -1) index = this.slots.length - 1;
    const slot = this.slots[index];
    const progress = !slot ? 1 : t <= slot.start ? 0 : Math.min(1, (t - slot.start) / (slot.arrive - slot.start));
    return { index: Math.max(0, index), progress, playing: this.playing, time: t, total: this.total };
  }

  play(): void {
    if (!this.slots.length) return;
    if (this.time >= this.total - 1) this.time = 0;
    this.stopAt = null;
    this.start();
  }
  pause(): void {
    this.playing = false;
    cancelAnimationFrame(this.raf);
    this.emit();
  }
  toggle(): void { this.playing ? this.pause() : this.play(); }

  /** Replays event i from its departure and stops when it arrives. */
  replay(i: number): void {
    const slot = this.slots[i];
    if (!slot) return;
    this.time = slot.start;
    this.stopAt = slot.arrive;
    this.start();
  }
  next(): void {
    const { index, progress } = this.frame();
    if (progress < 1) { this.seek(this.slots[index].arrive); return; }
    if (index < this.slots.length - 1) this.replay(index + 1);
  }
  previous(): void {
    const target = this.frame().index - 1;
    this.seek(target < 0 ? 0 : this.slots[target].arrive);
  }
  seek(time: number): void {
    this.pause();
    this.time = Math.max(0, Math.min(this.total, time));
    this.emit();
  }

  private start(): void {
    if (this.instant()) {
      this.time = this.stopAt ?? this.total;
      this.stopAt = null;
      this.playing = false;
      this.emit();
      return;
    }
    cancelAnimationFrame(this.raf);
    this.playing = true;
    this.last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(64, now - this.last) * this.speed;
      this.last = now;
      this.time += dt;
      const limit = this.stopAt ?? this.total;
      if (this.time >= limit) {
        this.time = limit;
        this.playing = false;
        this.stopAt = null;
        this.emit();
        return;
      }
      this.emit();
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
    this.emit();
  }
  private emit(): void { this.onFrame(this.frame()); }
}
