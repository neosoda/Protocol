import { catalog, categories, findScenario } from './protocols/catalog.ts';
import type { Category, ProtocolScenario } from './protocols/model.ts';
import { createTimeline } from './engine/timeline.ts';
import type { Speed, TimelineState } from './engine/timeline.ts';
import { isRtl, label, languages, languageSupported } from './i18n/ui.ts';
import type { Label, Language } from './i18n/ui.ts';
import { escapeHtml } from './ui/escape.ts';
import { renderActors, renderFlow } from './visualizations/topology.ts';
import { renderSequence } from './visualizations/sequence.ts';
import { renderInspector } from './inspector/view.ts';
import './ui/styles.css';

type Mode = 'discovery' | 'expert';
type Theme = 'light' | 'dark';
const storagePrefix = 'network-observatory:v1:';
const read = (key: string): string | null => { try { return localStorage.getItem(storagePrefix + key); } catch { return null; } };
const store = (key: string, value: string): void => { try { localStorage.setItem(storagePrefix + key, value); } catch { /* storage not available: stay usable */ } };
const t = (key: Label): string => label(language, key);
const $ = (id: string): HTMLElement | null => document.getElementById(id);
const readStep = (scenario: ProtocolScenario): number => {
  const saved = read('progress:' + scenario.id);
  // Event IDs survive editorial insertion of earlier timeline steps.
  const matched = saved === null ? -1 : scenario.events.findIndex(event => event.id === saved);
  if (matched !== -1) return matched;
  // Backward compatibility with the original alpha's numeric bookmarks.
  const legacy = saved === null ? NaN : Number(saved);
  return Number.isInteger(legacy) && legacy >= 0 && legacy < scenario.events.length ? legacy : 0;
};
const languageFromBrowser = (): Language => {
  const configured = read('language');
  if (configured && languageSupported(configured)) return configured;
  const browser = navigator.language;
  if (languageSupported(browser)) return browser;
  const short = browser.split('-')[0];
  return languageSupported(short) ? short : 'fr';
};
let language: Language = languageFromBrowser();
let theme: Theme = read('theme') === 'light' ? 'light' : 'dark';
let mode: Mode = read('mode') === 'expert' ? 'expert' : 'discovery';
let onCatalog = true;
let selectedField = 0;
let inspectedEventId = "";
let active: ProtocolScenario = findScenario(read('last-protocol') ?? 'tcp');
const app = $('app');
if (!app) throw new Error('Missing application mount');
const timeline = createTimeline(active, () => update());
timeline.setProtocol(active, readStep(active));

function applyPreferences(): void {
  document.documentElement.lang = language;
  document.documentElement.dir = isRtl(language) ? 'rtl' : 'ltr';
  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.mode = mode;
  document.documentElement.style.colorScheme = theme;
}

function brand(): string {
  return `<span class="brand-mark" aria-hidden="true">
    <svg viewBox="0 0 48 48" focusable="false"><path d="M7 14h20l10 10-10 10H7" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M39 33H21L11 23l10-10h18" fill="none" stroke="var(--teal)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="7" cy="14" r="3.2" fill="currentColor"/><circle cx="39" cy="33" r="3.2" fill="var(--teal)"/></svg>
    </span>`;
}

function selectOptions(): string {
  return languages.map(lang => `<option value="${lang.code}" ${lang.code === language ? 'selected' : ''}>${escapeHtml(lang.name)}</option>`).join('');
}

function header(): string {
  return `<header class="masthead">
    <button class="brand" data-action="catalog" aria-label="${escapeHtml(t('catalog'))}">${brand()}<span><strong>NETWORK<span class="brand-divider"> / </span>OBSERVATORY</strong><small>Protocol Explorer · research lab</small></span></button>
    <div class="masthead-actions">
      <label class="select-wrap"><span>${escapeHtml(t('language'))}</span><select id="language-select" aria-label="${escapeHtml(t('language'))}">${selectOptions()}</select></label>
      <button class="plain-button" data-action="theme" title="${escapeHtml(t('theme'))}" aria-label="${escapeHtml(t('theme'))}">${theme === 'dark' ? '☀︎' : '☾'} <span class="theme-name">${escapeHtml(t(theme === 'dark' ? 'themeLight' : 'themeDark'))}</span></button>
    </div>
  </header>`;
}

function formatLevel(level: ProtocolScenario['level']): string {
  return level === 'initial' ? '01 · ' + t('levelInitial') : level === 'intermediate' ? '02 · ' + t('levelIntermediate') : '03 · ' + t('levelAdvanced');
}
const categoryName = (category: Category): string => t(category);
function catalogue(): string {
  const last = findScenario(read('last-protocol') ?? 'tcp');
  return `<main id="main-content" class="page home">
    <section class="intro" aria-labelledby="home-title">
      <div><span class="eyebrow"><span class="pulse" aria-hidden="true"></span> ${escapeHtml(t('labEyebrow'))}</span>
      <h1 id="home-title" tabindex="-1">${escapeHtml(t('heroLead'))} <em>${escapeHtml(t('heroAccent'))}</em></h1>
      <p>${escapeHtml(t('heroDescription'))}</p>
      <div class="intro-actions"><button class="primary-button" data-action="open" data-id="tcp">${escapeHtml(t('start'))} TCP <span aria-hidden="true">→</span></button>
      <button class="secondary-button" data-action="open" data-id="${escapeHtml(last.id)}">${escapeHtml(t('resume'))} ${escapeHtml(last.name)}</button></div></div>
      <div class="intro-instrument" aria-label="${escapeHtml(t('diagramTcp'))}">
        <span class="instrument-caption">OBSERVATION / 001</span>
        <div class="mini-network"><span class="instrument-node">CLIENT</span><span class="mini-link">SYN <b>→</b></span><span class="instrument-node">SERVER</span></div>
        <div class="mini-network reverse"><span class="instrument-node">CLIENT</span><span class="mini-link"><b>←</b> SYN · ACK</span><span class="instrument-node">SERVER</span></div>
        <div class="mini-network"><span class="instrument-node">CLIENT</span><span class="mini-link">ACK <b>→</b></span><span class="instrument-node">SERVER</span></div>
        <div class="instrument-footer"><span>${escapeHtml(t('handshake'))}</span><span>03 ${escapeHtml(t('events'))}</span></div>
      </div>
    </section>
    <section class="catalogue" aria-labelledby="catalogue-title"><div class="section-heading">
      <div><p class="eyebrow">${escapeHtml(t('exploreEyebrow'))}</p><h2 id="catalogue-title">${escapeHtml(t('catalog'))}</h2></div>
      <span class="note-tag">${escapeHtml(t('modelled'))}</span></div>
      ${categories.map(category => `<section class="category" aria-labelledby="group-${category}"><h3 id="group-${category}">${escapeHtml(categoryName(category))}</h3>
      <div class="protocol-grid">${catalog.filter(p => p.category === category).map(p => `<button class="protocol-card" data-action="open" data-id="${p.id}">
        <span class="protocol-top"><strong>${escapeHtml(p.name)}</strong><span aria-hidden="true">↗</span></span>
        <span class="protocol-summary">${escapeHtml(p.summary)}</span><span class="protocol-meta">${escapeHtml(formatLevel(p.level))} <span aria-hidden="true">·</span> ~${p.minutes} ${escapeHtml(t('minutes'))}</span>
      </button>`).join('')}</div></section>`).join('')}
    </section></main>`;
}

function simulation(): string {
  const state = timeline.getState();
  const progress = Math.round(((state.index + 1) / active.events.length) * 100);
  return `<main id="main-content" class="page lab">
    <div class="lab-overview">
      <div><button data-action="catalog" class="back-link">← ${escapeHtml(t('back'))}</button>
      <div class="eyebrow">LAB / ${escapeHtml(active.category.toUpperCase())} / ${escapeHtml(active.id.toUpperCase())}</div>
      <h1 id="lab-title" tabindex="-1">${escapeHtml(active.name)} <span class="muted">/ ${escapeHtml(t('experiment'))}</span></h1>
      <p>${escapeHtml(active.summary)}</p>
      </div><div class="mode-switch" role="group" aria-label="${escapeHtml(t('groupMode'))}">
      <button data-action="mode" data-mode="discovery" aria-pressed="${mode === 'discovery'}" class="${mode === 'discovery' ? 'chosen' : ''}">${escapeHtml(t('discovery'))}</button>
      <button data-action="mode" data-mode="expert" aria-pressed="${mode === 'expert'}" class="${mode === 'expert' ? 'chosen' : ''}">${escapeHtml(t('expert'))}</button>
      </div>
    </div>
    <section class="goalbar"><span class="eyebrow">${escapeHtml(t('objective'))}</span><strong>${escapeHtml(active.objective)}</strong><span class="note-tag">${escapeHtml(t('modelled'))}</span></section>
    <section class="toolbar" aria-label="${escapeHtml(t('groupControls'))}">
      <div class="transport-controls"><button data-action="reset" aria-label="${escapeHtml(t('reset'))}">↺</button>
      <button data-action="prev" id="prev-control" aria-label="${escapeHtml(t('previous'))}">←</button>
      <button class="play-button" data-action="toggle" id="play-control">${escapeHtml(t('play'))}</button>
      <button data-action="next" id="next-control" aria-label="${escapeHtml(t('next'))}">→</button></div>
      <label class="select-wrap speed-wrap"><span>${escapeHtml(t('speed'))}</span><select id="speed-select">
      ${([0.5, 1, 1.5, 2] as Speed[]).map(s => `<option value="${s}" ${state.speed === s ? 'selected' : ''}>${s}×</option>`).join('')}</select></label>
      <div class="progress-wrap"><span id="progress-text" class="mono"></span><div class="progress-track" role="progressbar" id="progress-bar" aria-label="${escapeHtml(t('status'))}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}"><span id="progress-fill"></span></div></div>
    </section>
    <section class="workspace" aria-label="${escapeHtml(t('groupWorkspace'))}">
      <div class="panel topology-panel"><div class="panel-heading"><div><span class="eyebrow">01 / ${escapeHtml(t('panelNetwork'))}</span><h2>${escapeHtml(t('topology'))}</h2></div><span class="legend-key">${escapeHtml(t('flowLegend'))}</span></div>
        <div class="topology-actors" id="topology-actors" aria-label="${escapeHtml(t('groupParticipants'))}">${renderActors(active)}</div>
        <div class="flow-readout" id="flow-readout" aria-live="polite"></div>
      </div>
      <div class="panel sequence-panel"><div class="panel-heading"><div><span class="eyebrow">02 / ${escapeHtml(t('panelTimeline'))}</span><h2>${escapeHtml(t('sequence'))}</h2></div><span class="legend-key">${active.events.length} ${escapeHtml(t('events'))}</span></div>
        <ol class="event-list ladder-list" id="event-list">${renderSequence(active, t)}</ol>
      </div>
    </section>
    <section class="panel inspector-panel" aria-labelledby="inspector-title"><div class="panel-heading"><div><span class="eyebrow">03 / ${escapeHtml(t('panelAnalysis'))}</span><h2 id="inspector-title">${escapeHtml(t('inspector'))}</h2></div><span class="legend-key">${escapeHtml(t('sampleLegend'))}</span></div>
      <div id="inspector-body"></div>
    </section>
  </main>`;
}

function render(focusSelector?: string): void {
  applyPreferences();
  app!.innerHTML = `<a class="skip-link" href="#main-content">${escapeHtml(t('skipLink'))}</a><div class="shell">${header()}${onCatalog ? catalogue() : simulation()}
    <footer class="footer"><span>Network Observatory · ${escapeHtml(t('footerAlpha'))}</span>
    <span>${escapeHtml(t('footerAttribution'))} <a href="https://protocol-explorer-alpha.vercel.app/" target="_blank" rel="noopener noreferrer">Protocol Explorer — Dilum Sanjaya</a> · ${escapeHtml(t('footerRights'))}</span></footer></div>`;
  if (!onCatalog) update();
  // Full view replacements must not silently discard keyboard focus.
  if (focusSelector) app!.querySelector<HTMLElement>(focusSelector)?.focus();
}

function update(): void {
  if (onCatalog || !$('event-list')) return;
  const state: TimelineState = timeline.getState();
  const current = active.events[state.index];
  if (inspectedEventId !== current.id) { selectedField = 0; inspectedEventId = current.id; }
  const progress = Math.round(((state.index + 1) / active.events.length) * 100);
  const progressText = $('progress-text');
  if (progressText) progressText.textContent = `${t('step')} ${state.index + 1} / ${active.events.length}`;
  const fill = $('progress-fill');
  if (fill) fill.style.width = progress + '%';
  $('progress-bar')?.setAttribute('aria-valuenow', String(progress));
  const prev = $('prev-control') as HTMLButtonElement | null;
  const next = $('next-control') as HTMLButtonElement | null;
  if (prev) prev.disabled = state.index === 0;
  if (next) next.disabled = state.index === active.events.length - 1;
  const play = $('play-control');
  if (play) { play.textContent = t(state.playing ? 'pause' : 'play'); play.setAttribute('aria-pressed', String(state.playing)); }
  const list = $('event-list');
  if (list) {
    list.querySelectorAll<HTMLButtonElement>('button[data-index]').forEach(button => {
      const selected = Number(button.dataset.index) === state.index;
      button.classList.toggle('is-active', selected);
      if (selected) button.setAttribute('aria-current', 'step'); else button.removeAttribute('aria-current');
    });
    // Scroll only within the ladder, without moving keyboard focus or the page.
    // This also keeps the final event visible when playback stops on the last tick.
    const selected = list.querySelector<HTMLButtonElement>(`button[data-index="${state.index}"]`);
    if (selected) {
      const viewport = list.getBoundingClientRect();
      const item = selected.getBoundingClientRect();
      const stickyHeader = list.querySelector('.ladder-head')?.getBoundingClientRect().height ?? 0;
      const upperEdge = viewport.top + stickyHeader + 8;
      const lowerEdge = viewport.bottom - 8;
      if (item.top < upperEdge) list.scrollTop -= upperEdge - item.top;
      else if (item.bottom > lowerEdge) list.scrollTop += item.bottom - lowerEdge;
    }
  }
  $('topology-actors')?.querySelectorAll<HTMLElement>('[data-actor]').forEach(element => {
    const sender = element.dataset.actor === current.from;
    const receiver = element.dataset.actor === current.to;
    element.classList.toggle('is-sender', sender);
    element.classList.toggle('is-receiver', receiver);
    const status = element.querySelector<HTMLElement>('.actor-state');
    if (status) status.textContent = sender ? t('sender') : receiver ? t('receiver') : '';
  });
  const flow = $('flow-readout');
  if (flow) flow.innerHTML = renderFlow(active, current, t);
  const body = $('inspector-body');
  if (body) body.innerHTML = renderInspector(current, mode, t, selectedField);
  store('progress:' + active.id, current.id);
}

function openScenario(id: string): void {
  active = findScenario(id);
  store('last-protocol', active.id);
  onCatalog = false;
  timeline.setProtocol(active, readStep(active));
  render('#lab-title');
}
app.addEventListener('click', ev => {
  const target = (ev.target as Element).closest<HTMLElement>('[data-action]');
  if (!target || !app.contains(target)) return;
  switch (target.dataset.action) {
    case 'catalog': timeline.dispatch({ type: 'PAUSE' }); onCatalog = true; render('#home-title'); break;
    case 'open': openScenario(target.dataset.id ?? 'tcp'); break;
    case 'theme': theme = theme === 'dark' ? 'light' : 'dark'; store('theme', theme); render('[data-action="theme"]'); break;
    case 'mode': mode = target.dataset.mode === 'expert' ? 'expert' : 'discovery'; store('mode', mode); render('[data-action="mode"][data-mode="' + mode + '"]'); break;
    case 'toggle': timeline.dispatch({ type: 'TOGGLE' }); break;
    case 'prev': timeline.dispatch({ type: 'PREVIOUS' }); break;
    case 'next': timeline.dispatch({ type: 'NEXT' }); break;
    case 'reset': timeline.dispatch({ type: 'RESET' }); break;
    case 'select': timeline.dispatch({ type: 'SELECT', index: Number(target.dataset.index) }); break;
    case 'inspect-field': {
      const index = Number(target.dataset.fieldIndex);
      if (Number.isInteger(index) && index >= 0 && index < active.events[timeline.getState().index].fields.length) {
        selectedField = index;
        update();
        $('inspector-body')?.querySelector<HTMLButtonElement>(`button[data-field-index="${index}"]`)?.focus();
      }
      break;
    }
  }
});
app.addEventListener('change', ev => {
  const target = ev.target as HTMLSelectElement;
  if (target.id === 'language-select' && languageSupported(target.value)) {
    language = target.value; store('language', language); render('#language-select');
  }
  if (target.id === 'speed-select') {
    const speed = Number(target.value);
    if ([0.5, 1, 1.5, 2].includes(speed)) timeline.dispatch({ type: 'SPEED', speed: speed as Speed });
  }
});
// The ladder is a keyboard-operable timeline: physical arrows stay LTR even
// inside RTL interfaces, matching the diagram's chronological layout.
app.addEventListener('keydown', event => {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement) || !target.matches('#event-list button[data-action="select"]')) return;
  const index = Number(target.dataset.index);
  const last = active.events.length - 1;
  let next: number;
  switch (event.key) {
    case 'ArrowDown':
    case 'ArrowRight': next = Math.min(last, index + 1); break;
    case 'ArrowUp':
    case 'ArrowLeft': next = Math.max(0, index - 1); break;
    case 'Home': next = 0; break;
    case 'End': next = last; break;
    default: return;
  }
  event.preventDefault();
  timeline.dispatch({ type: 'SELECT', index: next });
  $('event-list')?.querySelector<HTMLButtonElement>(`button[data-index="${next}"]`)?.focus();
});
// Background tabs should not consume timer resources or silently advance lessons.
document.addEventListener('visibilitychange', () => {
  if (document.hidden && timeline.getState().playing) timeline.dispatch({ type: 'PAUSE' });
});
window.addEventListener('pagehide', () => timeline.dispose());
render();
