import type { ProtocolScenario } from '../protocols/model.ts';
import { escapeHtml } from '../ui/escape.ts';

/** Sequence messages and topology represent the same ordered scenario.events list. */
export function renderSequence(scenario: ProtocolScenario): string {
  const name = (id: string): string => scenario.participants.find(p => p.id === id)?.name ?? id;
  return scenario.events.map((event, i) => `<li><button data-action="select" data-index="${i}" class="event-button" aria-label="${escapeHtml('Étape ' + (i + 1) + ' : ' + event.title)}"><span class="event-index mono">${String(i + 1).padStart(2,'0')}</span><span class="event-body"><strong>${escapeHtml(event.title)}</strong><small><bdi>${escapeHtml(name(event.from))}</bdi> <span aria-hidden="true">→</span> <bdi>${escapeHtml(name(event.to))}</bdi></small></span><span class="selected-chevron" aria-hidden="true">›</span></button></li>`).join('');
}
