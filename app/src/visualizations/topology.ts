import type { NetworkEvent, ProtocolScenario } from '../protocols/model.ts';
import { escapeHtml } from '../ui/escape.ts';

/** Pure HTML view: state and events are supplied by the timeline, never read from DOM. */
export function renderActors(scenario: ProtocolScenario): string {
  return scenario.participants.map(participant => `<div class="actor" data-actor="${escapeHtml(participant.id)}"><span class="actor-glyph" aria-hidden="true">▣</span><strong>${escapeHtml(participant.name)}</strong><span>${escapeHtml(participant.role)}</span></div>`).join('');
}
export function renderFlow(scenario: ProtocolScenario, event: NetworkEvent): string {
  const name = (id: string): string => scenario.participants.find(p => p.id === id)?.name ?? id;
  return `<span class="flow-label">ACTIVE FLOW</span>
    <span><bdi>${escapeHtml(name(event.from))}</bdi> <span class="direction-arrow" aria-label="vers">→</span> <bdi>${escapeHtml(name(event.to))}</bdi></span>
    <strong>${escapeHtml(event.title)}</strong>`;
}
