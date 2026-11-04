import type { ProtocolScenario } from '../protocols/model.ts';
import { escapeHtml } from '../ui/escape.ts';
import type { Label } from '../i18n/ui.ts';

/**
 * Real ladder layout: each participant owns one vertical lifeline; horizontal
 * arrows represent events in the original chronological order. No inferred hops.
 * The HTML is a pure projection of scenario.events, not a second state store.
 */
export function renderSequence(scenario: ProtocolScenario, t: (key: Label) => string): string {
  const participants = scenario.participants;
  const count = participants.length;
  const lifelines = participants.map(() => '<span class="ladder-lifeline" aria-hidden="true"></span>').join('');
  const header = `<li class="ladder-head" aria-hidden="true" style="--participant-count:${count}">${participants.map(person =>
    `<span class="ladder-participant"><bdi>${escapeHtml(person.name)}</bdi><small>${escapeHtml(person.role)}</small></span>`
  ).join('')}</li>`;
  const events = scenario.events.map((event, index) => {
    const from = participants.findIndex(person => person.id === event.from);
    const to = participants.findIndex(person => person.id === event.to);
    // The catalogue's referential-integrity test ensures both IDs exist.
    const left = (100 * (Math.min(from, to) + 0.5) / count).toFixed(3);
    const width = (100 * Math.abs(to - from) / count).toFixed(3);
    const direction = from < to ? 'forward' : 'reverse';
    const source = participants[from]?.name ?? event.from;
    const destination = participants[to]?.name ?? event.to;
    const accessibleName = `${t('inspectStep')} ${index + 1} : ${event.title}, ${source} ${t('inspectTo')} ${destination}`;
    return `<li class="ladder-step"><button class="ladder-button event-button" data-action="select" data-index="${index}"
      aria-label="${escapeHtml(accessibleName)}">
      <span class="ladder-row" style="--participant-count:${count}" aria-hidden="true">
        ${lifelines}
        <span class="ladder-event-caption"><span class="ladder-step-number">${String(index + 1).padStart(2, '0')}</span>
          <strong>${escapeHtml(event.title)}</strong></span>
        <span class="ladder-arrow ${direction}" style="left:${left}%;width:${width}%">
          <span class="ladder-packet"></span></span>
      </span></button></li>`;
  }).join('');
  return header + events;
}
