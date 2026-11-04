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
let catalogQuery = '';
let navOpen = false;
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
    <svg viewBox="0 0 64 64" focusable="false"><path d="M12 18h15l13 14H52" fill="none" stroke="currentColor" stroke-width="4.5" stroke-linecap="round"/><path d="M12 46h15l13-14H52" fill="none" stroke="var(--teal)" stroke-width="4.5" stroke-linecap="round"/><circle cx="12" cy="18" r="5" fill="currentColor"/><circle cx="12" cy="46" r="5" fill="var(--teal)"/><circle cx="52" cy="32" r="5.5" fill="var(--surface)" stroke="currentColor" stroke-width="3"/></svg>
    </span>`;
}

function selectOptions(): string {
  return languages.map(lang => `<option value="${lang.code}" ${lang.code === language ? 'selected' : ''}>${escapeHtml(lang.name)}</option>`).join('');
}

function header(): string {
  return `<header class="app-rail" aria-label="${escapeHtml(t('navLabel'))}">
    <div class="rail-head">
      <button class="brand" data-action="catalog" aria-label="${escapeHtml(t('catalog'))}">
        ${brand()}<span class="brand-type"><strong>NETWORK<br><span>OBSERVATORY</span></strong><small>RESEARCH / LEARN / TRACE</small></span>
      </button>
      <button class="rail-menu" data-action="toggle-nav" aria-controls="rail-nav"
        aria-expanded="${navOpen}" aria-label="${escapeHtml(t('navToggle'))}">
        <span aria-hidden="true">${navOpen ? '×' : '☰'}</span></button>
    </div>
    <nav class="rail-nav" id="rail-nav" aria-label="${escapeHtml(t('navLabel'))}">
      <p class="rail-caption">${escapeHtml(t('navBrowse'))} <span> / ${String(catalog.length).padStart(2, '0')}</span></p>
      <button class="rail-catalog ${onCatalog ? 'is-current' : ''}" data-action="catalog"
        ${onCatalog ? 'aria-current="page"' : ''}><span aria-hidden="true">▦</span>${escapeHtml(t('catalog'))}</button>
      ${categories.map((category, index) => `<section class="rail-group">
        <h2><span class="rail-category-index">0${index + 1}</span>${escapeHtml(categoryName(category))}</h2>
        ${catalog.filter(p => p.category === category).map(p => `<button class="rail-protocol ${!onCatalog && active.id === p.id ? 'is-current' : ''}"
          data-action="open" data-id="${escapeHtml(p.id)}" ${!onCatalog && active.id === p.id ? 'aria-current="page"' : ''}>
          <span class="rail-protocol-dot" aria-hidden="true"></span><span>${escapeHtml(p.name)}</span>
          <span class="rail-protocol-arrow" aria-hidden="true">↗</span></button>`).join('')}
      </section>`).join('')}
    </nav>
    <div class="rail-bottom">
      <div class="rail-status"><span class="rail-status-dot" aria-hidden="true"></span>
        <span>${escapeHtml(t('simulationLabel'))}</span><strong>14 / 14</strong></div>
      <div class="rail-preferences">
        <label class="select-wrap"><span>${escapeHtml(t('language'))}</span>
          <select id="language-select" aria-label="${escapeHtml(t('language'))}">${selectOptions()}</select></label>
        <button class="plain-button" data-action="theme" title="${escapeHtml(t('theme'))}" aria-label="${escapeHtml(t('theme'))}">
          <span aria-hidden="true">${theme === 'dark' ? '◐' : '◑'}</span>
          <span class="theme-name">${escapeHtml(t(theme === 'dark' ? 'themeLight' : 'themeDark'))}</span></button>
      </div>
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
    <div class="page-kicker"><span>NETWORK OBSERVATORY <span class="quiet">/ FIELD GUIDE</span></span>
      <span class="edition">001 — 014</span></div>
    <section class="signal-hero" aria-labelledby="home-title">
      <div class="hero-copy">
        <div class="eyebrow"><span class="tiny-square" aria-hidden="true"></span>${escapeHtml(t('heroIndex'))}</div>
        <h1 id="home-title" tabindex="-1">${escapeHtml(t('heroLead'))} <em>${escapeHtml(t('heroAccent'))}</em></h1>
        <p class="hero-description">${escapeHtml(t('heroDescription'))}</p>
        <div class="intro-actions">
          <button class="primary-button" data-action="open" data-id="tcp">${escapeHtml(t('start'))} TCP <span aria-hidden="true">↗</span></button>
          <button class="secondary-button" data-action="open" data-id="${escapeHtml(last.id)}">${escapeHtml(t('resume'))} ${escapeHtml(last.name)} <span aria-hidden="true">→</span></button>
        </div>
        <p class="hero-footnote">${escapeHtml(t('heroFootnote'))}</p>
      </div>
      <div class="trace-monitor" aria-label="${escapeHtml(t('diagramTcp'))}">
        <div class="monitor-bar"><span>TRACE / TCP / 001</span>
          <span class="monitor-live"><i aria-hidden="true"></i>${escapeHtml(t('heroMonitor'))}</span></div>
        <svg class="monitor-diagram" viewBox="0 0 660 370" role="img" aria-label="${escapeHtml(t('diagramTcp'))}">
          <defs>
            <pattern id="trace-grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M32 0H0V32" fill="none" stroke="#48556c" stroke-opacity=".42" stroke-width="1"/>
            </pattern>
            <marker id="signal-forward" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0L10 5L0 10Z" fill="#ff8264"/>
            </marker>
            <marker id="signal-return" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0L10 5L0 10Z" fill="#9ab4ff"/>
            </marker>
          </defs>
          <rect width="660" height="370" fill="url(#trace-grid)"/>
          <g font-family="ui-monospace,Consolas,monospace" font-size="15" font-weight="700" fill="#c4cbd9">
            <text x="146" y="51" text-anchor="middle">CLIENT</text>
            <text x="516" y="51" text-anchor="middle">SERVER</text>
          </g>
          <g stroke="#77839a" stroke-dasharray="6 9" stroke-opacity=".75" stroke-width="2">
            <line x1="146" x2="146" y1="66" y2="324"/><line x1="516" x2="516" y1="66" y2="324"/>
          </g>
          <g font-family="ui-monospace,Consolas,monospace" font-size="15" font-weight="700">
            <line x1="146" x2="502" y1="120" y2="120" stroke="#ff8264" stroke-width="3" marker-end="url(#signal-forward)"/>
            <text x="326" y="101" text-anchor="middle" fill="#ffad95">01 / SYN</text>
            <line x1="516" x2="160" y1="203" y2="203" stroke="#9ab4ff" stroke-width="3" marker-end="url(#signal-return)"/>
            <text x="330" y="184" text-anchor="middle" fill="#afc5ff">02 / SYN·ACK</text>
            <line x1="146" x2="502" y1="286" y2="286" stroke="#ff8264" stroke-width="3" marker-end="url(#signal-forward)"/>
            <text x="326" y="267" text-anchor="middle" fill="#ffad95">03 / ACK</text>
          </g>
          <g fill="#f7f5f0"><circle cx="146" cy="120" r="6"/><circle cx="516" cy="203" r="6"/><circle cx="146" cy="286" r="6"/></g>
        </svg>
        <div class="monitor-footer"><span>TCP / HANDSHAKE</span><span>03 ${escapeHtml(t('events'))} <i aria-hidden="true">●</i> ${escapeHtml(t('modelled'))}</span></div>
      </div>
    </section>
    <section class="catalogue" aria-labelledby="catalogue-title">
      <div class="library-heading"><div><div class="eyebrow">02 / ${escapeHtml(t('exploreEyebrow'))}</div>
        <h2 id="catalogue-title">${escapeHtml(t('catalog'))}</h2>
        <p>${escapeHtml(t('navBrowse'))}</p></div>
        <span class="library-index">[ ${String(catalog.length).padStart(2, '0')} ]</span></div>
      <div class="catalogue-tools">
        <label class="search-control" for="protocol-search"><span class="search-label">${escapeHtml(t('searchLabel'))}</span>
          <span class="search-field"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg>
          <input id="protocol-search" type="search" autocomplete="off" placeholder="${escapeHtml(t('searchPlaceholder'))}"
            value="${escapeHtml(catalogQuery)}"></span></label>
        <button type="button" class="search-clear" data-action="clear-search" ${catalogQuery ? '' : 'hidden'}>${escapeHtml(t('searchClear'))}</button>
        <span id="search-count" class="search-count" role="status" aria-live="polite"></span>
      </div>
      <p id="search-empty" class="search-empty" hidden>${escapeHtml(t('searchEmpty'))}</p>
      ${categories.map((category, catIndex) => `<section class="category" data-category="${category}" aria-labelledby="group-${category}">
        <div class="category-heading"><h3 id="group-${category}"><span>0${catIndex + 1} /</span> ${escapeHtml(categoryName(category))}</h3>
          <span>${String(catalog.filter(p => p.category === category).length).padStart(2, '0')} ${escapeHtml(t('searchResults'))}</span></div>
        <div class="protocol-grid">${catalog.filter(p => p.category === category).map(p => `<button class="protocol-card" data-action="open" data-id="${escapeHtml(p.id)}"
          data-search="${escapeHtml([p.name, p.summary, categoryName(p.category), p.category, p.id].join(' ').toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''))}">
          <span class="card-index">${String(catalog.indexOf(p) + 1).padStart(2, '0')}</span>
          <span class="card-main"><span class="protocol-top"><strong>${escapeHtml(p.name)}</strong><span class="protocol-arrow" aria-hidden="true">↗</span></span>
          <span class="protocol-summary">${escapeHtml(p.summary)}</span>
          <span class="protocol-meta">${escapeHtml(formatLevel(p.level))} <span aria-hidden="true">·</span> ~${p.minutes} ${escapeHtml(t('minutes'))}</span></span>
        </button>`).join('')}</div></section>`).join('')}
    </section>
  </main>`;
}

function updateCatalogueFilter(): void {
  if (!onCatalog) return;
  const query = catalogQuery.trim().toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  let matches = 0;
  app!.querySelectorAll<HTMLElement>('.category').forEach(section => {
    let sectionMatches = 0;
    section.querySelectorAll<HTMLButtonElement>('.protocol-card').forEach(card => {
      const match = (card.dataset.search ?? '').includes(query);
      card.hidden = !match;
      if (match) { sectionMatches++; matches++; }
    });
    section.hidden = sectionMatches === 0;
  });
  const count = $('search-count');
  if (count) count.textContent = `${matches} / ${catalog.length} ${t('searchResults')}`;
  const empty = $('search-empty');
  if (empty) empty.hidden = matches !== 0;
  const clear = app!.querySelector<HTMLButtonElement>('.search-clear');
  if (clear) clear.hidden = !catalogQuery;
}

function simulation(): string {
  const state = timeline.getState();
  const progress = Math.round(((state.index + 1) / active.events.length) * 100);
  return `<main id="main-content" class="page lab">
    <div class="lab-overview">
      <div class="lab-heading">
        <button data-action="catalog" class="back-link">← ${escapeHtml(t('back'))}</button>
        <div class="eyebrow">EXPERIMENT / ${String(catalog.indexOf(active) + 1).padStart(2,'0')} <span class="quiet">— ${escapeHtml(categoryName(active.category))}</span></div>
        <h1 id="lab-title" tabindex="-1">${escapeHtml(active.name)}<span class="lab-typemark">↗</span></h1>
        <p>${escapeHtml(active.summary)}</p>
      </div>
      <div class="mode-switch" role="group" aria-label="${escapeHtml(t('groupMode'))}">
        <button data-action="mode" data-mode="discovery" aria-pressed="${mode === 'discovery'}"
          class="${mode === 'discovery' ? 'chosen' : ''}">${escapeHtml(t('discovery'))}</button>
        <button data-action="mode" data-mode="expert" aria-pressed="${mode === 'expert'}"
          class="${mode === 'expert' ? 'chosen' : ''}">${escapeHtml(t('expert'))}</button>
      </div>
    </div>
    <section class="goalbar"><span class="eyebrow">${escapeHtml(t('objective'))}</span>
      <strong>${escapeHtml(active.objective)}</strong><span class="note-tag">${escapeHtml(t('modelled'))}</span></section>
    <section class="toolbar" aria-label="${escapeHtml(t('groupControls'))}">
      <div class="transport-controls">
        <button data-action="reset" aria-label="${escapeHtml(t('reset'))}">↺</button>
        <button data-action="prev" id="prev-control" aria-label="${escapeHtml(t('previous'))}">←</button>
        <button class="play-button" data-action="toggle" id="play-control">${escapeHtml(t('play'))}</button>
        <button data-action="next" id="next-control" aria-label="${escapeHtml(t('next'))}">→</button>
      </div>
      <label class="select-wrap speed-wrap"><span>${escapeHtml(t('speed'))}</span><select id="speed-select">
        ${([0.5, 1, 1.5, 2] as Speed[]).map(s => `<option value="${s}" ${state.speed === s ? 'selected' : ''}>${s}×</option>`).join('')}
      </select></label>
      <div class="progress-wrap"><span id="progress-text" class="mono"></span>
        <div class="progress-track" role="progressbar" id="progress-bar" aria-label="${escapeHtml(t('status'))}"
          aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}"><span id="progress-fill"></span></div></div>
    </section>
    <section class="current-trace" aria-label="${escapeHtml(t('currentSignal'))}">
      <div class="trace-meta"><span class="trace-led" aria-hidden="true"></span>
        <span>${escapeHtml(t('currentSignal'))}</span><span id="trace-step-index" class="mono"></span></div>
      <strong id="trace-title"></strong><span id="trace-route" class="mono"></span>
    </section>
    <section class="workspace" aria-label="${escapeHtml(t('groupWorkspace'))}">
      <div class="panel sequence-panel">
        <div class="panel-heading"><div><span class="eyebrow">01 / ${escapeHtml(t('panelTimeline'))}</span><h2>${escapeHtml(t('sequence'))}</h2></div>
          <span class="legend-key">${String(active.events.length).padStart(2,'0')} ${escapeHtml(t('events'))}</span></div>
        <ol class="event-list ladder-list" id="event-list" aria-label="${escapeHtml(t('eventListLabel'))}">${renderSequence(active, t)}</ol>
      </div>
      <div class="workbench-side">
        <div class="panel topology-panel">
          <div class="panel-heading"><div><span class="eyebrow">02 / ${escapeHtml(t('panelNetwork'))}</span><h2>${escapeHtml(t('topology'))}</h2></div>
            <span class="legend-key">${escapeHtml(t('flowLegend'))}</span></div>
          <div class="topology-actors" id="topology-actors" aria-label="${escapeHtml(t('groupParticipants'))}">${renderActors(active)}</div>
          <div class="flow-readout" id="flow-readout" aria-live="polite"></div>
        </div>
        <section class="panel inspector-panel" aria-labelledby="inspector-title">
          <div class="panel-heading"><div><span class="eyebrow">03 / ${escapeHtml(t('panelAnalysis'))}</span>
            <h2 id="inspector-title">${escapeHtml(t('inspector'))}</h2></div>
            <span class="legend-key">${escapeHtml(t('sampleLegend'))}</span></div>
          <div id="inspector-body"></div>
        </section>
      </div>
    </section>
  </main>`;
}

function render(focusSelector?: string): void {
  applyPreferences();
  app!.innerHTML = `<a class="skip-link" href="#main-content">${escapeHtml(t('skipLink'))}</a><div class="shell" data-view="${onCatalog ? 'catalogue' : 'laboratory'}" data-nav-open="${navOpen}">${header()}${onCatalog ? catalogue() : simulation()}
    <footer class="footer"><span>Network Observatory · ${escapeHtml(t('footerAlpha'))}</span>
    <span>${escapeHtml(t('footerAttribution'))} <a href="https://protocol-explorer-alpha.vercel.app/" target="_blank" rel="noopener noreferrer">Protocol Explorer — Dilum Sanjaya</a> · ${escapeHtml(t('footerRights'))}</span></footer></div>`;
  if (onCatalog) updateCatalogueFilter(); else update();
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
  const traceTitle = $('trace-title');
  if (traceTitle) traceTitle.textContent = current.title;
  const traceRoute = $('trace-route');
  if (traceRoute) traceRoute.textContent = `${active.participants.find(p => p.id === current.from)?.name ?? current.from} → ${active.participants.find(p => p.id === current.to)?.name ?? current.to}`;
  const traceIndex = $('trace-step-index');
  if (traceIndex) traceIndex.textContent = `${String(state.index + 1).padStart(2,'0')} / ${String(active.events.length).padStart(2,'0')}`;
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
  navOpen = false;
  timeline.setProtocol(active, readStep(active));
  render('#lab-title');
}
app.addEventListener('click', ev => {
  const target = (ev.target as Element).closest<HTMLElement>('[data-action]');
  if (!target || !app.contains(target)) return;
  switch (target.dataset.action) {
    case 'catalog': timeline.dispatch({ type: 'PAUSE' }); navOpen = false; onCatalog = true; render('#home-title'); break;
    case 'toggle-nav': navOpen = !navOpen; render('[data-action="toggle-nav"]'); break;
    case 'open': openScenario(target.dataset.id ?? 'tcp'); break;
    case 'clear-search': {
      catalogQuery = '';
      const input = $('protocol-search') as HTMLInputElement | null;
      if (input) { input.value = ''; updateCatalogueFilter(); input.focus(); }
      break;
    }
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
app.addEventListener('input', ev => {
  const target = ev.target;
  if (target instanceof HTMLInputElement && target.id === 'protocol-search') {
    catalogQuery = target.value;
    updateCatalogueFilter();
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
