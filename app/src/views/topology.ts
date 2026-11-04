import type { NetEvent, Scenario } from '../model.ts';
import { tx } from '../i18n.ts';
import { device } from './devices.ts';
import { along, ease, lengthOf, points, route, type Point } from './geometry.ts';
import { ui } from './icons.ts';
import type { Summary } from './summary.ts';

const NS = 'http://www.w3.org/2000/svg';
const el = <K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number> = {}, parent?: Element): SVGElementTagNameMap[K] => {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  parent?.appendChild(node);
  return node;
};
const d = (pts: Point[]): string => pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join('');
/** Where a lost packet gives up. */
const DROP_AT = 0.55;
/** Half-extent of a device and its label, used to frame the camera. */
const PAD = { x: 140, top: 135, bottom: 130 };
/** Devices and packets are drawn larger than the plan's units so they read well once zoomed out. */
const DEVICE_SCALE = 1.25;
const PACKET_SCALE = 1.35;
/** Below this width (px) the camera follows the packet in close-up instead of framing everything. */
const FOLLOW_BELOW = 620;
/** Width of the scene, in plan units, shown by the close-up camera. */
const FOLLOW_WIDTH = 470;

interface Box { x: number; y: number; w: number; h: number }
interface Flight { pts: Point[]; length: number; trail: SVGPathElement; packet: SVGGElement }

/**
 * The network scene. A camera frames the devices the story has reached so far;
 * devices appear the first time a packet needs them; the packet of the current
 * step travels along its route as a labelled card.
 */
export class TopologyView {
  private readonly svg: SVGSVGElement;
  private scenario: Scenario | null = null;
  private summaries: Summary[] = [];
  private nodes = new Map<string, SVGGElement>();
  private links = new Map<string, SVGGElement>();
  private flights: Flight[] = [];
  private trailLayer!: SVGGElement;
  private flightLayer!: SVGGElement;
  private shown = -1;
  private wasArrived = false;
  private camera: Box = { x: 0, y: 0, w: 1000, h: 520 };
  private target: Box = this.camera;
  private raf = 0;
  private last = 0;
  private gliding = false;
  private focus: Point = { x: 0, y: 0 };
  private revealed = new Set<string>();
  private readonly instant: () => boolean;

  constructor(svg: SVGSVGElement, instant: () => boolean) {
    this.svg = svg;
    this.instant = instant;
    new ResizeObserver(() => { this.target = this.following() ? this.close(this.focus) : this.frame(this.revealed); this.snap(); }).observe(svg);
  }

  render(scenario: Scenario, summaries: Summary[]): void {
    this.scenario = scenario;
    this.focus = { x: 0, y: 0 };
    this.summaries = summaries;
    this.shown = -1;
    this.revealed = new Set();
    this.svg.replaceChildren();
    const defs = el('defs', {}, this.svg);
    defs.innerHTML = `<filter id="soft-glow" x="-50%" y="-80%" width="200%" height="260%"><feGaussianBlur stdDeviation="7"/></filter>
      <radialGradient id="screen-glow" cx=".3" cy=".2" r="1"><stop offset="0" stop-color="var(--screen-a)"/><stop offset="1" stop-color="var(--screen-b)"/></radialGradient>
      <linearGradient id="cloud-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--cloud-a)"/><stop offset="1" stop-color="var(--cloud-b)"/></linearGradient>`;
    const xs = scenario.topology.nodes.map(n => n.x), ys = scenario.topology.nodes.map(n => n.y);
    const floor = el('g', { class: 'floor' }, this.svg);
    for (let x = Math.min(...xs) - 1200; x < Math.max(...xs) + 1200; x += 48) el('path', { d: `M${x} ${Math.min(...ys) - 900}v2400` }, floor);
    for (let y = Math.min(...ys) - 900; y < Math.max(...ys) + 900; y += 48) el('path', { d: `M${Math.min(...xs) - 1200} ${y}h3600` }, floor);

    const linkLayer = el('g', { class: 'links' }, this.svg);
    this.links.clear();
    for (const [a, b] of scenario.topology.links) {
      const g = el('g', { class: 'link' }, linkLayer);
      const path = d(points(scenario.topology, [a, b]));
      el('path', { class: 'cable', d: path }, g);
      el('path', { class: 'cable-core', d: path }, g);
      this.links.set(`${a}|${b}`, g);
      this.links.set(`${b}|${a}`, g);
    }
    this.trailLayer = el('g', { class: 'trails' }, this.svg);
    const nodeLayer = el('g', { class: 'devices' }, this.svg);
    this.flightLayer = el('g', { class: 'flights' }, this.svg);
    this.nodes.clear();
    for (const n of scenario.topology.nodes) {
      const g = el('g', { class: `node node-${n.kind}`, transform: `translate(${n.x} ${n.y})`, 'data-node': n.id }, nodeLayer);
      this.nodes.set(n.id, g);
      const body = el('g', { class: 'node-body' }, g);
      el('ellipse', { class: 'ripple', cx: 6, cy: 36, rx: 74, ry: 20 }, body);
      const art = el('g', { class: `dev dev-${n.kind}` }, el('g', { transform: `scale(${DEVICE_SCALE})` }, body));
      art.innerHTML = device(n.kind);
      const label = el('g', { class: 'node-tag', transform: 'translate(0 74)' }, body);
      const name = tx(n.label);
      const width = Math.max(name.length * 8.6, (n.ip ?? '').length * 7.6) + 28;
      el('rect', { class: 'tag-bg', x: -width / 2, y: -16, width, height: n.ip ? 44 : 26, rx: 11 }, label);
      el('text', { class: 'node-label', y: 3, 'text-anchor': 'middle' }, label).textContent = name;
      if (n.ip) el('text', { class: 'node-ip', y: 21, 'text-anchor': 'middle' }, label).textContent = n.ip;
    }
    this.svg.setAttribute('aria-label', scenario.topology.nodes.map(n => tx(n.label)).join(', '));
  }

  /** Called on every animation frame of the player. */
  update(event: NetEvent, index: number, progress: number): void {
    if (!this.scenario) return;
    if (index !== this.shown) this.prepare(event, index);
    this.reveal(index, progress);
    const arrived = progress >= 1;
    const eased = ease(Math.min(1, progress));
    this.flights.forEach((flight, i) => {
      const main = i === 0;
      const f = Math.min(eased, event.drop && main ? DROP_AT : 1);
      const at = along(flight.pts, f);
      // A lost packet falls away from where it stopped.
      const fall = event.drop && main ? Math.max(0, (eased - DROP_AT) / (1 - DROP_AT)) : 0;
      flight.packet.setAttribute('transform', `translate(${at.x.toFixed(1)} ${(at.y + fall * 60).toFixed(1)}) scale(${PACKET_SCALE})`);
      flight.packet.style.opacity = progress <= 0 ? '0' : arrived && !(main && event.drop) ? '0' : event.drop && main ? String(1 - fall * 0.65) : '1';
      flight.packet.classList.toggle('is-lost', !!event.drop && main && eased >= DROP_AT);
      flight.trail.style.strokeDashoffset = String(flight.length * (1 - f));
    });
    this.trailLayer.classList.toggle('is-idle', progress <= 0);
    if (this.following()) this.track(event, progress, eased);
    this.nodes.get(event.from)?.classList.toggle('is-sending', progress > 0 && progress < 1);
    if (arrived && !this.wasArrived && !event.drop) for (const id of [event.to, ...(event.also ?? [])]) this.pulse(id);
    this.wasArrived = arrived;
  }

  private prepare(event: NetEvent, index: number): void {
    const scenario = this.scenario!;
    this.shown = index;
    this.wasArrived = false;
    for (const g of this.nodes.values()) g.classList.remove('is-from', 'is-to', 'is-sending', 'is-arrived');
    for (const g of this.links.values()) g.classList.remove('is-active');
    this.nodes.get(event.from)?.classList.add('is-from');
    for (const id of [event.to, ...(event.also ?? [])]) this.nodes.get(id)?.classList.add('is-to');
    this.flightLayer.replaceChildren();
    this.trailLayer.replaceChildren();
    this.flights = [event.to, ...(event.also ?? [])].map((target, i) => {
      const path = route(scenario.topology, event.from, target);
      for (let k = 1; k < path.length; k++) this.links.get(`${path[k - 1]}|${path[k]}`)?.classList.add('is-active');
      const pts = points(scenario.topology, path);
      const length = lengthOf(pts);
      el('path', { class: `route tone-${event.tone}`, d: d(pts) }, this.trailLayer);
      const trail = el('path', { class: `trail tone-${event.tone}`, d: d(pts) }, this.trailLayer);
      trail.style.strokeDasharray = `${length} ${length}`;
      trail.style.strokeDashoffset = String(length);
      return { pts, length, trail, packet: this.packet(event, index, i === 0) };
    });
    this.flights.slice().reverse().forEach(f => this.flightLayer.appendChild(f.packet));
  }

  /** Devices appear once the story reaches them; the camera follows. */
  private reveal(index: number, progress: number): void {
    const scenario = this.scenario!;
    const seen = new Set<string>();
    scenario.events.forEach((e, i) => {
      if (i > index) return;
      seen.add(e.from);
      if (i < index || progress > 0) for (const t of [e.to, ...(e.also ?? [])]) for (const id of route(scenario.topology, e.from, t)) seen.add(id);
    });
    const changed = seen.size !== this.revealed.size || [...seen].some(id => !this.revealed.has(id));
    if (!changed) return;
    const first = this.revealed.size === 0;
    this.revealed = seen;
    for (const [id, g] of this.nodes) g.classList.toggle('is-hidden', !seen.has(id));
    for (const [a, b] of scenario.topology.links) this.links.get(`${a}|${b}`)!.classList.toggle('is-hidden', !(seen.has(a) && seen.has(b)));
    if (this.following()) return;
    this.target = this.frame(seen);
    if (first || this.instant()) this.snap(); else this.glide();
  }

  private following(): boolean {
    const width = this.svg.getBoundingClientRect().width;
    return width > 0 && width < FOLLOW_BELOW;
  }

  /** Close-up camera: on the sender before departure, on the packet in flight, on the receiver after. */
  private track(event: NetEvent, progress: number, eased: number): void {
    const nodes = this.scenario!.topology.nodes;
    const at = (id: string): Point => { const n = nodes.find(x => x.id === id)!; return { x: n.x, y: n.y }; };
    const main = this.flights[0];
    let focus: Point;
    if (progress <= 0 || !main) focus = at(event.from);
    else if (progress >= 1 && !event.drop) focus = at(event.to);
    else focus = along(main.pts, Math.min(eased, event.drop ? DROP_AT : 1));
    const first = this.focus.x === 0 && this.focus.y === 0;
    this.focus = focus;
    this.target = this.close(focus);
    if (first || this.instant()) this.snap(); else this.glide();
  }

  private close(p: Point): Box {
    const box = this.svg.getBoundingClientRect();
    const aspect = box.width && box.height ? box.width / box.height : 4 / 3;
    const w = FOLLOW_WIDTH, h = w / aspect;
    return { x: p.x - w / 2, y: p.y + 6 - h / 2, w, h };
  }

  /** The smallest box around the given nodes, widened to the canvas aspect ratio. */
  private frame(ids: Set<string>): Box {
    const nodes = this.scenario?.topology.nodes.filter(n => ids.has(n.id)) ?? [];
    if (!nodes.length) return this.camera;
    let x0 = Math.min(...nodes.map(n => n.x)) - PAD.x, x1 = Math.max(...nodes.map(n => n.x)) + PAD.x;
    let y0 = Math.min(...nodes.map(n => n.y)) - PAD.top, y1 = Math.max(...nodes.map(n => n.y)) + PAD.bottom;
    const minW = 520;
    if (x1 - x0 < minW) { const c = (x0 + x1) / 2; x0 = c - minW / 2; x1 = c + minW / 2; }
    const box = this.svg.getBoundingClientRect();
    const aspect = box.width && box.height ? box.width / box.height : 16 / 9;
    let w = x1 - x0, h = y1 - y0;
    if (w / h < aspect) { const nw = h * aspect; x0 -= (nw - w) / 2; w = nw; } else { const nh = w / aspect; y0 -= (nh - h) / 2; h = nh; }
    return { x: x0, y: y0, w, h };
  }

  private snap(): void {
    cancelAnimationFrame(this.raf);
    this.gliding = false;
    this.camera = this.target;
    this.apply();
  }

  /** Eases the camera toward its target; retargeting while moving keeps the same motion going. */
  private glide(): void {
    if (this.gliding) return;
    this.gliding = true;
    this.last = performance.now();
    const step = (now: number) => {
      // Tighter when following a moving packet, so it never leaves the frame.
      const k = 1 - Math.exp(-(now - this.last) / (this.following() ? 110 : 380));
      this.last = now;
      const c = this.camera, t = this.target;
      this.camera = { x: c.x + (t.x - c.x) * k, y: c.y + (t.y - c.y) * k, w: c.w + (t.w - c.w) * k, h: c.h + (t.h - c.h) * k };
      this.apply();
      if (Math.abs(t.w - this.camera.w) + Math.abs(t.x - this.camera.x) + Math.abs(t.y - this.camera.y) > 0.5) this.raf = requestAnimationFrame(step);
      else this.snap();
    };
    this.raf = requestAnimationFrame(step);
  }

  private apply(): void {
    const c = this.camera;
    this.svg.setAttribute('viewBox', `${c.x.toFixed(1)} ${c.y.toFixed(1)} ${c.w.toFixed(1)} ${c.h.toFixed(1)}`);
  }

  /** A card: protocol chip and on-wire label, then ports or a detail line. */
  private packet(event: NetEvent, index: number, main: boolean): SVGGElement {
    const outer = el('g', { class: `packet tone-${event.tone}`, 'aria-hidden': 'true' });
    const g = el('g', { class: 'packet-inner' }, outer);
    if (!main) {
      el('rect', { class: 'packet-mini', x: -9, y: -7, width: 18, height: 14, rx: 4 }, g);
      return outer;
    }
    const s = this.summaries[index];
    const secure = event.tone === 'secure';
    const chip = s.proto;
    const sub = s.ports || `${s.src} → ${s.dst}`;
    const chipW = chip.length * 7.2 + 14;
    const titleW = event.label.length * 7.6;
    const width = Math.max(chipW + titleW + 26 + (secure ? 16 : 0), sub.length * 6.4 + 24, 96);
    const left = -width / 2;
    el('rect', { class: 'packet-halo', x: left - 4, y: -24, width: width + 8, height: 48, rx: 14, filter: 'url(#soft-glow)' }, g);
    el('rect', { class: 'packet-card', x: left, y: -21, width, height: 42, rx: 11 }, g);
    el('rect', { class: 'packet-chip', x: left + 7, y: -15, width: chipW, height: 16, rx: 5 }, g);
    el('text', { class: 'packet-proto', x: left + 7 + chipW / 2, y: -3, 'text-anchor': 'middle' }, g).textContent = chip;
    let tx0 = left + chipW + 14;
    if (secure) {
      const lock = el('g', { class: 'packet-lock', transform: `translate(${tx0 - 2} -15) scale(.62)` }, g);
      el('path', { d: ui.lock }, lock);
      tx0 += 15;
    }
    el('text', { class: 'packet-label', x: tx0, y: -2.5 }, g).textContent = event.label;
    el('text', { class: 'packet-sub', x: left + 8, y: 13 }, g).textContent = sub;
    const cross = el('g', { class: 'packet-cross', transform: `translate(${width / 2 - 2} -20)` }, g);
    el('circle', { r: 11 }, cross);
    el('path', { d: 'M-4.5 -4.5 4.5 4.5M4.5 -4.5 -4.5 4.5' }, cross);
    return outer;
  }

  private pulse(id: string): void {
    const g = this.nodes.get(id);
    if (!g) return;
    g.classList.remove('is-arrived');
    void g.getBoundingClientRect();
    g.classList.add('is-arrived');
  }
}
