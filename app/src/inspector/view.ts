import type { NetworkEvent, PacketField } from '../protocols/model.ts';
import type { Label } from '../i18n/ui.ts';
import { escapeHtml } from '../ui/escape.ts';

export type InspectorMode = 'discovery' | 'expert';
type Range = NonNullable<PacketField['sampleRange']>;

function validRange(sample: string, range?: Range): Range | undefined {
  if (!range) return undefined;
  const size = new TextEncoder().encode(sample).length;
  return Number.isInteger(range.offset) && Number.isInteger(range.length) &&
    range.offset >= 0 && range.length > 0 && range.offset + range.length <= size ? range : undefined;
}

/** Only UTF-8 bytes of an explicitly authored sample. Never a synthetic packet capture. */
function renderSample(sample: string, t: (key: Label) => string, range?: Range): string {
  const bytes = new TextEncoder().encode(sample);
  const selected = validRange(sample, range);
  const rows: string[] = [];
  for (let i = 0; i < bytes.length; i += 16) {
    const chunk = [...bytes.slice(i, i + 16)];
    const offset = i.toString(16).padStart(4, '0');
    const active = (index: number): boolean => !!selected && index >= selected.offset && index < selected.offset + selected.length;
    // If a real, checked sample range is known, highlight its byte columns.
    const hex = selected
      ? chunk.map((value, j) => `<span class="${active(i + j) ? 'byte-selected' : ''}">${value.toString(16).padStart(2, '0')}</span>`).join(' ')
      : escapeHtml(chunk.map(value => value.toString(16).padStart(2, '0')).join(' '));
    const ascii = selected
      ? chunk.map((value, j) => `<span class="${active(i + j) ? 'byte-selected' : ''}">${escapeHtml(value >= 32 && value < 127 ? String.fromCharCode(value) : '.')}</span>`).join('')
      : escapeHtml(chunk.map(value => value >= 32 && value < 127 ? String.fromCharCode(value) : '.').join(''));
    rows.push(`<span class="hex-line"><span class="hex-offset">${offset}</span><span class="hex-columns">${hex}</span><span class="ascii-columns">${ascii}</span></span>`);
  }
  return `<div class="hex-view" tabindex="0" role="region" aria-label="${escapeHtml(t('sampleBytes'))}" dir="ltr">${rows.join('')}</div>
  <p class="raw-caption">${escapeHtml(t('sampleMeaning'))}
    ${selected ? escapeHtml(t('sampleValidRange')) : escapeHtml(t('sampleNoRange'))}</p>`;
}

export function renderInspector(event: NetworkEvent, mode: InspectorMode, t: (key: Label) => string, selectedField = 0): string {
  const fields = mode === 'discovery' ? event.fields.slice(0, 1) : event.fields;
  const layers = [...new Set(fields.map(field => field.layer))];
  const current = fields[selectedField] ?? fields[0];
  const grouped = layers.length
    ? layers.map(layer => `<section class="field-group" aria-label="${escapeHtml(layer)}"><h4>${escapeHtml(layer.toUpperCase())}</h4>
      <div class="field-items">${fields.map((f, i) => ({ f, i })).filter(({ f }) => f.layer === layer).map(({ f, i }) =>
      `<button class="field-option ${current === f ? 'is-selected' : ''}" data-action="inspect-field"
        data-field-index="${i}" aria-pressed="${current === f}">
        <span>${escapeHtml(f.name)}</span><code dir="ltr"><bdi>${escapeHtml(f.value)}</bdi></code></button>`).join('')}</div></section>`).join('')
    : '<p class="empty-fields">${escapeHtml(t('noFields'))}</p>';
  const raw = mode === 'discovery'
    ? '<p class="empty-fields">${escapeHtml(t('discoveryHint'))}</p>'
    : event.sample === undefined
      ? `<p class="empty-fields">${escapeHtml(t('noBytes'))}</p>`
      : renderSample(event.sample, t, current?.sampleRange);
  return `<div class="inspector-grid"><div>
    <div class="selected-event"><span class="eyebrow">${escapeHtml(t('selectedEvent'))} / ${escapeHtml(event.id.toUpperCase())}</span>
      <h3>${escapeHtml(event.title)}</h3><p>${escapeHtml(event.description)}</p></div>
    <h4 class="section-subtitle">${escapeHtml(t('layers'))}</h4><div class="field-list">${grouped}</div>
    ${current ? `<div class="field-explanation" aria-live="polite"><span class="eyebrow">${escapeHtml(t('selectedField'))}</span>
      <strong>${escapeHtml(current.name)}</strong><p>${escapeHtml(current.explanation)}</p></div>` : ''}
    </div>
    <div class="raw-panel"><h4>HEX / ASCII <span>· ${escapeHtml(t('sampleLabel'))}</span></h4>${raw}</div></div>`;
}
