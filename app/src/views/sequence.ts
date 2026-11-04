import type { NetEvent, Scenario } from '../model.ts';
import type { Summary } from './summary.ts';
import { t, tx } from '../i18n.ts';
import { ease } from './geometry.ts';
import { escapeHtml as esc } from './escape.ts';

const NS = 'http://www.w3.org/2000/svg';
const HEAD = 78;
const DROP_AT = 0.55;

interface Row { group: SVGGElement; line: SVGLineElement; head: SVGPolygonElement; dot: SVGCircleElement; x1: number; x2: number; y1: number; y2: number; length: number }

/** Ladder diagram: one lifeline per actor, one slanted arrow per event, drawn as it travels. */
export class SequenceView {
  private readonly svg: SVGSVGElement;
  private readonly scroller: HTMLElement;
  private rows: Row[] = [];
  private scenario: Scenario | null = null;
  private shown = -1;
  private W = 1000;
  private last: [number, number] = [0, 0];
  private summaries: Summary[] = [];
  private hops: (e: NetEvent) => number = () => 1;

  constructor(svg: SVGSVGElement, scroller: HTMLElement, onSelect: (index: number) => void) {
    this.svg = svg;
    this.scroller = scroller;
    svg.addEventListener('click', e => {
      const hit = (e.target as Element).closest<SVGGElement>('[data-index]');
      if (hit) onSelect(Number(hit.dataset.index));
    });
    svg.addEventListener('keydown', e => {
      const hit = (e.target as Element).closest<SVGGElement>('[data-index]');
      if (hit && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onSelect(Number(hit.dataset.index)); }
    });
    // Drawn at the pane's own width so text keeps its size; redrawn when the width changes much.
    new ResizeObserver(() => {
      if (this.scenario && Math.abs(this.width(this.scenario) - this.W) > 40) {
        this.render(this.scenario);
        this.update(...this.last);
      }
    }).observe(scroller);
  }

  private width(scenario: Scenario): number {
    const least = scenario.actors.length * 136 + 70;
    return Math.round(Math.max(least, Math.min(1100, this.scroller.clientWidth || 1000)));
  }

  render(scenario: Scenario, summaries: Summary[] = this.summaries, hops: (e: NetEvent) => number = this.hops): void {
    this.scenario = scenario;
    this.summaries = summaries;
    this.hops = hops;
    this.shown = -1;
    const W = this.W = this.width(scenario);
    const actors = scenario.actors;
    const margin = Math.min(actors.length > 3 ? 120 : 200, W * 0.24);
    const x = (id: string) => margin + (W - 2 * margin) * (actors.length === 1 ? 0.5 : actors.indexOf(id) / (actors.length - 1));
    // Arrows slope with travel time: the further a packet goes, the steeper.
    let top = HEAD;
    const layout = scenario.events.map(event => {
      const slant = 16 + 14 * Math.min(4, hops(event));
      const row = { y1: top + 22, y2: top + 22 + slant, x1: x(event.from), x2: x(event.to), top, height: slant + 40 };
      top += row.height;
      return row;
    });
    const height = top + 24;
    const parts: string[] = [];
    for (const id of actors) {
      const n = scenario.topology.nodes.find(node => node.id === id)!;
      parts.push(`<g class="actor" transform="translate(${x(id)} 0)">
        <rect x="-74" y="10" width="148" height="44" rx="12" class="actor-card"/>
        <text y="30" text-anchor="middle" class="actor-name">${esc(tx(n.label))}</text>
        <text y="46" text-anchor="middle" class="actor-ip">${esc(n.ip ?? '')}</text>
        <line y1="${HEAD - 18}" y2="${height - 10}" class="lifeline"/></g>`);
    }
    scenario.events.forEach((event, i) => {
      const { x1, x2, y1, y2, top: rowTop, height: rowH } = layout[i];
      const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
      const upright = angle > 90 || angle < -90 ? angle - 180 : angle;
      const name = `${t('step')} ${i + 1} : ${tx(event.title)}`;
      parts.push(`<g class="row tone-${event.tone}${event.drop ? ' is-drop' : ''}" data-index="${i}" tabindex="0" role="button" aria-label="${esc(name)}">
        <rect class="row-hit" x="0" y="${rowTop}" width="${W}" height="${rowH}" rx="10"/>
        <text class="row-num" x="16" y="${y1 + 4}">${String(i + 1).padStart(2, '0')}</text>
        <text class="row-time" x="16" y="${y1 + 18}">${(summaries[i]?.time ?? 0).toFixed(3)}</text>
        <line class="row-ghost" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>
        <line class="row-line" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>
        <polygon class="row-head" points="0,0 -12,-6 -12,6"/>
        <circle class="row-dot" r="6"/>
        <text class="row-label" text-anchor="middle" transform="translate(${(x1 + x2) / 2} ${(y1 + y2) / 2}) rotate(${upright.toFixed(2)}) translate(0 -8)">${esc(event.label)}</text>
      </g>`);
    });
    this.svg.setAttribute('viewBox', `0 0 ${W} ${height}`);
    this.svg.style.width = `${W}px`;
    this.svg.innerHTML = parts.join('');
    this.rows = [...this.svg.querySelectorAll<SVGGElement>('.row')].map((group, i) => {
      const { x1, x2, y1, y2 } = layout[i];
      return {
        group, line: group.querySelector<SVGLineElement>('.row-line')!, x1, x2, y1, y2, length: Math.hypot(x2 - x1, y2 - y1),
        head: group.querySelector<SVGPolygonElement>('.row-head')!, dot: group.querySelector<SVGCircleElement>('.row-dot')!
      };
    });
  }

  update(index: number, progress: number): void {
    if (!this.scenario) return;
    this.last = [index, progress];
    this.rows.forEach((row, i) => {
      const state = i < index ? 'past' : i === index ? 'current' : 'future';
      row.group.dataset.state = state;
      const event = this.scenario!.events[i];
      const p = state === 'past' ? 1 : state === 'future' ? 0 : ease(progress);
      const f = event.drop ? Math.min(p, DROP_AT) : p;
      row.line.style.strokeDasharray = `${row.length} ${row.length}`;
      row.line.style.strokeDashoffset = String(row.length * (1 - f));
      const x = row.x1 + (row.x2 - row.x1) * f;
      const y = row.y1 + (row.y2 - row.y1) * f;
      const angle = Math.atan2(row.y2 - row.y1, row.x2 - row.x1) * 180 / Math.PI;
      row.head.setAttribute('transform', `translate(${row.x2} ${row.y2}) rotate(${angle})`);
      row.head.style.opacity = !event.drop && f >= 0.98 ? '1' : '0';
      row.dot.setAttribute('cx', x.toFixed(1));
      row.dot.setAttribute('cy', y.toFixed(1));
      row.dot.style.opacity = state === 'current' && (f < 0.98 || event.drop) ? '1' : '0';
      row.group.classList.toggle('is-lost', !!event.drop && f >= DROP_AT && state !== 'future');
    });
    if (index !== this.shown) {
      this.shown = index;
      this.follow(index);
    }
  }

  /** Keeps the current arrow in view inside the scroll container. */
  private follow(index: number): void {
    const row = this.rows[index];
    if (!row) return;
    const scale = this.svg.getBoundingClientRect().width / this.W || 1;
    const top = (row.y1 - 40) * scale;
    const bottom = (row.y2 + 40) * scale;
    const box = this.scroller;
    if (top < box.scrollTop || bottom > box.scrollTop + box.clientHeight) {
      box.scrollTo({ top: Math.max(0, top - box.clientHeight / 3), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }
  }
}
