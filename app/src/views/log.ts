import type { Scenario } from '../model.ts';
import { t } from '../i18n.ts';
import { escapeHtml as esc } from './escape.ts';
import type { Summary } from './summary.ts';

/** Capture-style list of the packets sent so far; rows appear as packets leave. */
export class LogView {
  private readonly root: HTMLElement;
  private readonly body: HTMLElement;
  private rows: HTMLElement[] = [];
  private visible = -1;
  private current = -1;

  constructor(root: HTMLElement, onSelect: (index: number) => void) {
    this.root = root;
    root.innerHTML = `<div class="log-head"><h3></h3><span class="log-count"></span></div>
      <div class="log-scroll"><table><thead><tr></tr></thead><tbody></tbody></table></div>`;
    this.body = root.querySelector('tbody')!;
    this.body.addEventListener('click', e => {
      const row = (e.target as Element).closest<HTMLElement>('tr[data-index]');
      if (row) onSelect(Number(row.dataset.index));
    });
  }

  render(scenario: Scenario, summaries: Summary[]): void {
    this.root.querySelector('h3')!.textContent = t('log');
    this.root.querySelector('thead tr')!.innerHTML = ['No.', t('logTime'), t('logSource'), t('logDestination'), t('logProtocol'), t('logInfo'), t('logSize')]
      .map(h => `<th scope="col">${esc(h)}</th>`).join('');
    this.body.innerHTML = summaries.map((s, i) => {
      const e = scenario.events[i];
      return `<tr data-index="${i}" class="tone-${e.tone}${e.drop ? ' is-drop' : ''}" hidden>
        <td><span class="log-no">${i + 1}</span></td><td>${s.time.toFixed(3)}</td><td>${s.src}</td><td>${s.dst}</td>
        <td><span class="log-proto">${esc(s.proto)}</span></td><td class="log-info">${esc(s.info)}${e.drop ? ` <em>${esc(t('lost'))}</em>` : ''}</td>
        <td>${e.packet.bytes.length} B</td></tr>`;
    }).join('');
    this.rows = [...this.body.querySelectorAll<HTMLElement>('tr')];
    this.visible = -1;
    this.current = -1;
  }

  /** Rows up to `index` are listed once their packet has left (progress > 0). */
  update(index: number, progress: number): void {
    const last = progress > 0 ? index : index - 1;
    if (last !== this.visible) {
      this.rows.forEach((row, i) => {
        const show = i <= last;
        if (show && row.hidden) { row.hidden = false; row.classList.add('is-new'); setTimeout(() => row.classList.remove('is-new'), 700); }
        else if (!show) row.hidden = true;
      });
      this.visible = last;
      this.root.querySelector('.log-count')!.textContent = `${Math.max(0, last + 1)} / ${this.rows.length}`;
      const row = this.rows[last];
      const box = this.root.querySelector<HTMLElement>('.log-scroll')!;
      if (row) box.scrollTop = Math.max(0, row.offsetTop - box.clientHeight + row.offsetHeight + 4);
    }
    if (index !== this.current) {
      this.rows[this.current]?.classList.remove('is-current');
      this.rows[index]?.classList.add('is-current');
      this.current = index;
    }
  }
}
