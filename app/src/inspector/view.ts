import type { NetworkEvent } from '../protocols/model.ts';
import type { Label } from '../i18n/ui.ts';
import { escapeHtml } from '../ui/escape.ts';

export type InspectorMode = 'discovery' | 'expert';
function renderSample(sample: string): string {
  const bytes = new TextEncoder().encode(sample);
  const rows: string[] = [];
  for (let i = 0; i < bytes.length; i += 16) {
    const chunk = [...bytes.slice(i, i + 16)];
    const offset = i.toString(16).padStart(4, '0');
    const hex = chunk.map(value => value.toString(16).padStart(2, '0')).join(' ').padEnd(47, ' ');
    const ascii = chunk.map(value => value >= 32 && value < 127 ? String.fromCharCode(value) : '.').join('');
    rows.push(`${offset}  ${hex}  ${ascii}`);
  }
  return `<pre class="hex-view" tabindex="0" aria-label="Octets UTF-8 de l'exemple textuel">${escapeHtml(rows.join('\n'))}</pre>
  <p class="raw-caption">Encodage UTF-8 du texte d'exemple, généré localement. Ce n'est pas une trame capturée ni un en-tête binaire complet.</p>`;
}

export function renderInspector(event: NetworkEvent, mode: InspectorMode, t: (key: Label) => string): string {
  const visibleFields = mode === 'discovery' ? event.fields.slice(0, 1) : event.fields;
  const grouped = Array.from(new Set(visibleFields.map(field => field.layer)));
  const fields = grouped.length
    ? grouped.map(layer => `<section class="field-group"><h4>${escapeHtml(layer.toUpperCase())}</h4><dl>${visibleFields.filter(f => f.layer === layer)
      .map(f => `<div><dt>${escapeHtml(f.name)}</dt><dd><code>${escapeHtml(f.value)}</code><small>${escapeHtml(f.explanation)}</small></dd></div>`).join('')}</dl></section>`).join('')
    : '<p class="empty-fields">Pas de champs techniques individuels validés pour cette étape.</p>';
  const raw = mode === 'discovery'
    ? '<p class="empty-fields">Passez en mode Expert pour examiner les octets des exemples.</p>'
    : event.sample === undefined
      ? `<p class="empty-fields">${escapeHtml(t('noBytes'))}</p>`
      : renderSample(event.sample);
  return `<div class="inspector-grid"><div>
    <div class="selected-event"><span class="eyebrow">SELECTED EVENT / ${escapeHtml(event.id.toUpperCase())}</span>
      <h3>${escapeHtml(event.title)}</h3><p>${escapeHtml(event.description)}</p></div>
    <h4 class="section-subtitle">${escapeHtml(t('layers'))}</h4><div class="field-list">${fields}</div></div>
    <div class="raw-panel"><h4>HEX / ASCII <span>· EXEMPLE CONSTRUIT</span></h4>${raw}</div></div>`;
}
