import type { NetEvent, Scenario } from '../model.ts';
import { tx } from '../i18n.ts';
import { along, ease, lengthOf, points, route, type Point } from './geometry.ts';
import { nodeIcon, ui } from './icons.ts';

const NS = 'http://www.w3.org/2000/svg';
const el = <K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number> = {}, parent?: Element): SVGElementTagNameMap[K] => {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  parent?.appendChild(node);
  return node;
};
const d = (pts: Point[]): string => pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join('');
/** Where a packet stops when it is lost on the way. */
const DROP_AT = 0.55;

interface Flight { pts: Point[]; length: number; trail: SVGPathElement; packet: SVGGElement }

/** Animated network map: nodes, links, and the packet of the current event in flight. */
export class TopologyView {
  private readonly svg: SVGSVGElement;
  private scenario: Scenario | null = null;
  private nodes = new Map<string, SVGGElement>();
  private links = new Map<string, SVGPathElement>();
  private flights: Flight[] = [];
  private flightLayer!: SVGGElement;
  private trailLayer!: SVGGElement;
  private shown = -1;
  private wasArrived = false;

  constructor(svg: SVGSVGElement) { this.svg = svg; }

  render(scenario: Scenario): void {
    this.scenario = scenario;
    this.shown = -1;
    this.svg.replaceChildren();
    // Frame the drawing tightly around the nodes and their labels.
    const xs = scenario.topology.nodes.map(n => n.x), ys = scenario.topology.nodes.map(n => n.y);
    const box = { x: Math.min(...xs) - 95, y: Math.min(...ys) - 70, w: 0, h: 0 };
    box.w = Math.max(...xs) + 95 - box.x;
    box.h = Math.max(...ys) + 95 - box.y;
    this.svg.setAttribute('viewBox', `${box.x} ${box.y} ${box.w} ${box.h}`);
    const defs = el('defs', {}, this.svg);
    defs.innerHTML = `<filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
    const grid = el('g', { class: 'topo-grid' }, this.svg);
    const step = 40;
    for (let x = Math.ceil((box.x - 400) / step) * step; x < box.x + box.w + 400; x += step)
      for (let y = Math.ceil((box.y - 300) / step) * step; y < box.y + box.h + 300; y += step) el('circle', { cx: x, cy: y, r: 1.1 }, grid);
    const linkLayer = el('g', { class: 'topo-links' }, this.svg);
    this.links.clear();
    for (const [a, b] of scenario.topology.links) {
      const path = el('path', { class: 'link', d: d(points(scenario.topology, [a, b])) }, linkLayer);
      this.links.set(`${a}|${b}`, path);
      this.links.set(`${b}|${a}`, path);
    }
    const trailLayer = el('g', { class: 'topo-trails' }, this.svg);
    const nodeLayer = el('g', { class: 'topo-nodes' }, this.svg);
    // Packets fly above the nodes they pass through; their trails stay beneath.
    this.trailLayer = trailLayer;
    this.flightLayer = el('g', { class: 'topo-flights' }, this.svg);
    this.nodes.clear();
    for (const n of scenario.topology.nodes) {
      const outer = el('g', { class: `node node-${n.kind}`, transform: `translate(${n.x} ${n.y})`, 'data-node': n.id }, nodeLayer);
      this.nodes.set(n.id, outer);
      const g = el('g', { class: 'node-body' }, outer);
      el('circle', { class: 'node-ring', r: 44 }, g);
      el('rect', { class: 'node-card', x: -32, y: -32, width: 64, height: 64, rx: 18 }, g);
      const icon = el('g', { class: 'node-icon', transform: 'translate(-15 -15) scale(1.25)' }, g);
      el('path', { d: nodeIcon[n.kind] }, icon);
      const label = el('text', { class: 'node-label', y: 56, 'text-anchor': 'middle' }, g);
      label.textContent = tx(n.label);
      if (n.ip) {
        const ip = el('text', { class: 'node-ip', y: 74, 'text-anchor': 'middle' }, g);
        ip.textContent = n.ip;
      }
    }
    this.svg.setAttribute('aria-label', scenario.topology.nodes.map(n => tx(n.label)).join(', '));
  }

  /** Called on every animation frame. */
  update(event: NetEvent, index: number, progress: number): void {
    if (!this.scenario) return;
    if (index !== this.shown) this.prepare(event, index);
    const arrived = progress >= 1;
    const eased = ease(Math.min(1, progress));
    this.flights.forEach((flight, i) => {
      const main = i === 0;
      const limit = event.drop && main ? DROP_AT : 1;
      const f = Math.min(eased, limit);
      const at = along(flight.pts, f);
      flight.packet.setAttribute('transform', `translate(${at.x.toFixed(1)} ${at.y.toFixed(1)})`);
      flight.trail.style.strokeDashoffset = String(flight.length * (1 - f));
      const lostNow = !!event.drop && main && eased >= DROP_AT;
      flight.packet.classList.toggle('is-lost', lostNow);
      flight.packet.classList.toggle('is-ghost', !main);
      flight.packet.style.opacity = arrived && !(main && event.drop) ? '0' : '';
    });
    const sender = this.nodes.get(event.from);
    sender?.classList.toggle('is-sending', progress > 0 && progress < 1);
    if (arrived && !this.wasArrived && !event.drop) {
      for (const id of [event.to, ...(event.also ?? [])]) this.pulse(id);
    }
    this.wasArrived = arrived;
  }

  private prepare(event: NetEvent, index: number): void {
    const scenario = this.scenario!;
    this.shown = index;
    this.wasArrived = false;
    for (const g of this.nodes.values()) g.classList.remove('is-from', 'is-to', 'is-sending', 'is-arrived');
    for (const link of this.links.values()) link.classList.remove('is-active');
    this.nodes.get(event.from)?.classList.add('is-from');
    this.nodes.get(event.to)?.classList.add('is-to');
    this.flightLayer.replaceChildren();
    this.trailLayer.replaceChildren();
    const targets = [event.to, ...(event.also ?? [])];
    this.flights = targets.map((target, i) => {
      const path = route(scenario.topology, event.from, target);
      for (let k = 1; k < path.length; k++) this.links.get(`${path[k - 1]}|${path[k]}`)?.classList.add('is-active');
      const pts = points(scenario.topology, path);
      const length = lengthOf(pts);
      const trail = el('path', { class: `trail tone-${event.tone}`, d: d(pts) }, this.trailLayer);
      trail.style.strokeDasharray = `${length} ${length}`;
      trail.style.strokeDashoffset = String(length);
      const packet = this.packet(event, i === 0);
      return { pts, length, trail, packet };
    });
    // The main packet is drawn last so it stays above the broadcast copies.
    this.flights.slice().reverse().forEach(f => this.flightLayer.appendChild(f.packet));
  }

  private packet(event: NetEvent, main: boolean): SVGGElement {
    const outer = el('g', { class: `packet tone-${event.tone}`, 'aria-hidden': 'true' });
    const g = el('g', { class: 'packet-inner' }, outer);
    if (!main) {
      el('circle', { class: 'packet-dot', r: 7 }, g);
      return outer;
    }
    const secure = event.tone === 'secure';
    const text = event.label;
    const width = Math.max(48, text.length * 7.4 + 26 + (secure ? 16 : 0));
    el('rect', { class: 'packet-halo', x: -width / 2 - 6, y: -19, width: width + 12, height: 38, rx: 19, filter: 'url(#glow)' }, g);
    el('rect', { class: 'packet-body', x: -width / 2, y: -13, width, height: 26, rx: 13 }, g);
    let textX = 0;
    if (secure) {
      const lock = el('g', { class: 'packet-lock', transform: `translate(${-width / 2 + 9} -7) scale(.58)` }, g);
      el('path', { d: ui.lock }, lock);
      textX = 8;
    }
    const label = el('text', { class: 'packet-label', x: textX, y: 4.5, 'text-anchor': 'middle' }, g);
    label.textContent = text;
    const cross = el('g', { class: 'packet-cross', transform: 'translate(0 -30) scale(.9)' }, g);
    el('circle', { cx: 0, cy: 0, r: 11 }, cross);
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
