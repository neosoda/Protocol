import type { Field, NetEvent, Scenario } from '../model.ts';
import { t, tx } from '../i18n.ts';
import { escapeHtml as esc } from './escape.ts';
import { icon, ui } from './icons.ts';

interface Located { layer: number; field: number; f: Field }

/** Narrative of the current step, its layers and fields, and the hex dump, all cross-linked. */
export class InspectorView {
  private readonly root: HTMLElement;
  private bytes: HTMLElement[] = [];
  private fields: Located[] = [];
  private pinned: Located | null = null;
  private eventId = '';

  constructor(root: HTMLElement) {
    this.root = root;
    root.addEventListener('pointerover', e => this.hover(e.target as Element));
    root.addEventListener('focusin', e => this.hover(e.target as Element));
    root.addEventListener('pointerleave', () => this.show(this.pinned));
    root.addEventListener('click', e => {
      const located = this.locate(e.target as Element);
      if (!located) return;
      this.pinned = this.pinned && same(this.pinned, located) ? null : located;
      this.show(located);
    });
  }

  render(scenario: Scenario, event: NetEvent, index: number, arrived: boolean): void {
    const key = `${scenario.id}:${event.id}`;
    const changed = key !== this.eventId;
    this.root.classList.toggle('is-waiting', !arrived);
    if (!changed) return;
    this.eventId = key;
    this.pinned = null;
    const name = (id: string) => tx(scenario.topology.nodes.find(n => n.id === id)?.label ?? id);
    this.fields = event.packet.layers.flatMap((layer, l) => layer.fields.map((f, i) => ({ layer: l, field: i, f })));
    const layers = event.packet.layers.map((layer, l) => `
      <section class="layer layer-${layer.kind}${layer.encrypted ? ' is-encrypted' : ''}" style="--layer:var(--l${l % 6})">
        <header><span class="layer-chip"></span><strong>${esc(layer.title)}</strong>
          <span class="layer-size">${layer.bytes.length} B</span>${layer.encrypted ? icon(ui.lock, 'icon layer-lock') : ''}</header>
        <ul>${layer.fields.map((f, i) => `<li><button type="button" class="field" data-field="${l}:${i}">
          <span class="field-name">${esc(f.name)}</span><span class="field-value" dir="ltr">${esc(tx(f.value))}</span></button></li>`).join('')}</ul>
      </section>`).join('');
    this.root.innerHTML = `
      <div class="step-card tone-${event.tone}">
        <div class="step-meta"><span class="step-badge">${t('step')} ${index + 1}</span>
          <span class="step-route">${esc(name(event.from))} <span aria-hidden="true">→</span><span class="sr"> ${t('sentTo')} </span> ${esc(name(event.to))}</span>
          ${event.drop ? `<span class="step-lost">${icon(ui.cross)} ${t('lost')}</span>` : ''}</div>
        <h2>${esc(tx(event.title))}</h2>
        <p>${esc(tx(event.text))}</p>
      </div>
      <div class="packet-panel">
        <div class="panel-title"><h3>${t('inspector')}</h3><span>${event.packet.bytes.length} ${t('bytes').toLowerCase()}</span></div>
        <div class="layers" aria-label="${esc(t('layers'))}">${layers}</div>
        <div class="field-detail" aria-live="polite"></div>
        <div class="hex-title"><h3>${t('bytes')}</h3><span>${t('bytesHint')}</span></div>
        <div class="hex" dir="ltr">${this.hex(event)}</div>
        <p class="observed">${t('observed')}</p>
      </div>`;
    this.bytes = [...this.root.querySelectorAll<HTMLElement>('.hex b')];
    this.root.scrollTop = 0;
    this.show(null);
  }

  private hex(event: NetEvent): string {
    const owner = new Array<number>(event.packet.bytes.length).fill(0);
    event.packet.layers.forEach((layer, l) => owner.fill(l, layer.offset, layer.offset + layer.bytes.length));
    const rows: string[] = [];
    const data = event.packet.bytes;
    // Sixteen bytes per line when the panel is wide enough, eight otherwise.
    const per = this.root.clientWidth >= 540 ? 16 : 8;
    for (let at = 0; at < data.length; at += per) {
      const cells: string[] = [];
      const text: string[] = [];
      for (let i = at; i < Math.min(at + per, data.length); i++) {
        const l = owner[i];
        const enc = event.packet.layers[l].encrypted ? ' x' : '';
        cells.push(`<b data-byte="${i}" class="c${l % 6}${enc}">${data[i].toString(16).padStart(2, '0')}</b>`);
        const ch = data[i] >= 32 && data[i] < 127 ? String.fromCharCode(data[i]) : '·';
        text.push(`<i data-byte="${i}" class="c${l % 6}${enc}">${esc(ch)}</i>`);
      }
      rows.push(`<div class="hex-row" style="--per:${per}"><span class="hex-off">${at.toString(16).padStart(4, '0')}</span><span class="hex-bytes">${cells.join('')}</span><span class="hex-text">${text.join('')}</span></div>`);
    }
    return rows.join('');
  }

  private locate(target: Element): Located | null {
    const button = target.closest<HTMLElement>('[data-field]');
    if (button) {
      const [l, i] = button.dataset.field!.split(':').map(Number);
      return this.fields.find(x => x.layer === l && x.field === i) ?? null;
    }
    const cell = target.closest<HTMLElement>('[data-byte]');
    if (!cell) return null;
    const at = Number(cell.dataset.byte);
    // The narrowest field wins when several describe the same byte.
    return this.fields.filter(x => at >= x.f.offset && at < x.f.offset + x.f.length)
      .sort((a, b) => a.f.length - b.f.length)[0] ?? null;
  }

  private hover(target: Element): void {
    const located = this.locate(target);
    if (located) this.show(located);
  }

  private show(located: Located | null): void {
    const text = [...this.root.querySelectorAll<HTMLElement>('.hex i')];
    for (const cell of [...this.bytes, ...text]) {
      const at = Number(cell.dataset.byte);
      cell.classList.toggle('on', !!located && at >= located.f.offset && at < located.f.offset + located.f.length);
    }
    for (const b of this.root.querySelectorAll<HTMLElement>('.field')) {
      const on = !!located && b.dataset.field === `${located.layer}:${located.field}`;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', String(!!this.pinned && on));
    }
    const detail = this.root.querySelector<HTMLElement>('.field-detail');
    if (!detail) return;
    if (!located) { detail.innerHTML = `<p class="field-empty">${t('bytesHint')}</p>`; return; }
    const { f } = located;
    detail.innerHTML = `<div class="field-head"><strong>${esc(f.name)}</strong><code dir="ltr">${esc(tx(f.value))}</code></div>
      <p>${esc(tx(f.note))}</p>
      <span class="field-pos">${t('offset')} ${f.offset} · ${t('length')} ${f.length} B</span>`;
  }
}

const same = (a: Located, b: Located): boolean => a.layer === b.layer && a.field === b.field;
