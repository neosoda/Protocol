import type { NetworkEvent, ProtocolScenario } from '../protocols/model.ts';
import { escapeHtml } from '../ui/escape.ts';

/** All connections are logical endpoint exchanges, NOT discovered physical hops. */
const pictogram = (id: string): string => {
  if (id === 'router') return '◇';
  if (id === 'client') return '▣';
  if (id === 'resolver') return '◎';
  if (id === 'dhcp') return '▥';
  return '▤';
};
export function renderActors(scenario: ProtocolScenario): string {
  return scenario.participants.map(person =>
    `<div class="actor" data-actor="${escapeHtml(person.id)}">
      <span class="actor-glyph" aria-hidden="true">${pictogram(person.id)}</span>
      <strong>${escapeHtml(person.name)}</strong><span class="actor-role">${escapeHtml(person.role)}</span>
      <span class="actor-state" aria-hidden="true"></span>
    </div>`
  ).join('');
}

export function renderFlow(scenario: ProtocolScenario, event: NetworkEvent): string {
  const name = (id: string): string => scenario.participants.find(p => p.id === id)?.name ?? id;
  return `<div class="flow-label">TRAJET LOGIQUE · MODÈLE PÉDAGOGIQUE</div>
    <div class="packet-journey" dir="ltr" aria-label="${escapeHtml(name(event.from) + ' vers ' + name(event.to))}">
      <span class="journey-endpoint"><bdi>${escapeHtml(name(event.from))}</bdi><small>ÉMISSION</small></span>
      <span class="journey-link" aria-hidden="true"><span class="journey-packet"></span></span>
      <span class="journey-endpoint"><bdi>${escapeHtml(name(event.to))}</bdi><small>RÉCEPTION</small></span>
    </div>
    <strong class="journey-title">${escapeHtml(event.title)}</strong>`;
}
