import type { Lang, Scenario } from './model.ts';
import { categories, findScenario, scenarios } from './scenarios/index.ts';
import { category, lang, setLang, t, tx } from './i18n.ts';
import { Player, schedule, type Frame } from './engine/player.ts';
import { hops } from './views/geometry.ts';
import { TopologyView } from './views/topology.ts';
import { LogView } from './views/log.ts';
import { summarize } from './views/summary.ts';
import { SequenceView } from './views/sequence.ts';
import { InspectorView } from './views/inspector.ts';
import { icon, mark, ui } from './views/icons.ts';
import { escapeHtml as esc } from './views/escape.ts';
import './ui/styles.css';

type View = 'network' | 'sequence' | 'both';
type Theme = 'light' | 'dark';
const SPEEDS = [0.5, 1, 2] as const;

// Query-driven embed avoids interfering with either application's hash router.
const embedParams = new URLSearchParams(location.search);
const embedded = window.parent !== window && embedParams.get('embed') === '1';
const referrerOrigin = (() => { try { return document.referrer ? new URL(document.referrer).origin : null; } catch { return null; } })();
const parentOrigin = (() => {
  if (!embedded) return null;
  const raw = embedParams.get('parentOrigin');
  if (!raw) return referrerOrigin;
  try {
    const url = new URL(raw);
    if (!['https:', 'http:'].includes(url.protocol) || url.origin !== raw) return null;
    if (referrerOrigin && referrerOrigin !== raw) return null;
    return raw;
  } catch { return null; }
})();
if (embedded) document.documentElement.dataset.embed = 'true';

function notifyParent(type: 'ready' | 'progress' | 'error', details: Record<string, unknown> = {}): void {
  if (!embedded || !parentOrigin) return;
  window.parent.postMessage({ source: 'network-observatory', version: 1, type, scenarioId: scenario.id, ...details }, parentOrigin);
}

const store = {
  get(key: string): string | null { try { return localStorage.getItem('observatory:' + key); } catch { return null; } },
  set(key: string, value: string): void { try { localStorage.setItem('observatory:' + key, value); } catch { /* private mode: stay usable */ } }
};
const readProgress = (): Record<string, number> => {
  try { return JSON.parse(store.get('progress') ?? '{}') as Record<string, number>; } catch { return {}; }
};

const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const prefersDark = matchMedia('(prefers-color-scheme: dark)');
const savedLang = store.get('lang');
setLang(embedded && ['fr', 'en'].includes(embedParams.get('lang') ?? '') ? embedParams.get('lang') as Lang : savedLang === 'fr' || savedLang === 'en' ? savedLang : navigator.language.toLowerCase().startsWith('fr') ? 'fr' : 'en');
let theme: Theme = embedded && ['light', 'dark'].includes(embedParams.get('theme') ?? '') ? embedParams.get('theme') as Theme : store.get('theme') === 'dark' ? 'dark' : store.get('theme') === 'light' ? 'light' : prefersDark.matches ? 'dark' : 'light';
let view: View = (['network', 'sequence', 'both'] as const).find(v => v === store.get('view')) ?? 'network';
let speed: number = SPEEDS.find(s => String(s) === store.get('speed')) ?? 1;
let progress = readProgress();
const requestedEmbeddedScenario = embedded ? embedParams.get('scenario') : null;
let scenario: Scenario = embedded ? (findScenario(requestedEmbeddedScenario) ?? scenarios[3]) : (findScenario(location.hash.slice(2)) ?? findScenario(store.get('last')) ?? scenarios[3]);

const app = document.getElementById('app')!;
app.innerHTML = `
  <a class="skip" href="#stage" data-t="skip"></a>
  <header class="top">
    <button class="icon-btn rail-toggle" type="button" data-action="rail" aria-expanded="false">${icon(ui.menu)}</button>
    <div class="brand">${mark}<span><strong data-t="brand"></strong><small data-t="brandTag"></small></span></div>
    <div class="top-progress" role="img"><span class="tp-label" data-t="progress"></span><span class="tp-bar"><i></i></span><span class="tp-value"></span></div>
    <div class="top-actions">
      <div class="seg lang" role="group">
        <button type="button" data-lang="fr" lang="fr">FR</button><button type="button" data-lang="en" lang="en">EN</button>
      </div>
      <button class="icon-btn" type="button" data-action="theme"></button>
    </div>
  </header>
  <div class="shell">
    <nav class="rail" id="rail"></nav>
    <div class="scrim" data-action="rail"></div>
    <main class="stage" id="stage" tabindex="-1">
      <section class="lesson"></section>
      <section class="viz" data-view="${view}">
        <div class="viz-bar">
          <div class="seg views" role="group">
            <button type="button" data-view="network"></button><button type="button" data-view="sequence"></button><button type="button" data-view="both"></button>
          </div>
          <span class="viz-caption" aria-live="polite"></span>
        </div>
        <div class="viz-body">
          <div class="pane pane-network"><svg class="topology" role="img"></svg></div>
          <div class="pane pane-sequence"><svg class="sequence"></svg></div>
        </div>
      </section>
      <section class="transport">
        <div class="buttons">
          <button class="icon-btn" type="button" data-action="restart">${icon(ui.restart)}</button>
          <button class="icon-btn" type="button" data-action="previous">${icon(ui.previous)}</button>
          <button class="play" type="button" data-action="play"></button>
          <button class="icon-btn" type="button" data-action="next">${icon(ui.next)}</button>
        </div>
        <div class="scrub"><div class="ticks"></div><div class="scrub-track"><i></i></div></div>
        <span class="counter"></span>
        <div class="seg speed" role="group">${SPEEDS.map(s => `<button type="button" data-speed="${s}">${s}×</button>`).join('')}</div>
      </section>
      <section class="story" aria-live="polite"></section>
      <section class="log"></section>
      <p class="hint"></p>
    </main>
    <aside class="inspector" aria-live="off"></aside>
  </div>`;

const $ = <T extends Element = HTMLElement>(selector: string): T => app.querySelector<T>(selector)!;
const topology = new TopologyView($<SVGSVGElement>('.topology'), () => reduced.matches);
const log = new LogView($('.log'), i => { player.replay(i); });
const sequence = new SequenceView($<SVGSVGElement>('.sequence'), $('.pane-sequence'), i => { player.replay(i); });
const inspector = new InspectorView($('.inspector'));
const player = new Player(draw, () => reduced.matches);
player.speed = speed;
let shownIndex = -1;
let embedStarted = false;
const visitedEmbedSteps = new Set<number>();

function draw(frame: Frame): void {
  const event = scenario.events[frame.index];
  if (!event) return;
  topology.update(event, frame.index, frame.progress);
  sequence.update(frame.index, frame.progress);
  log.update(frame.index, frame.progress);
  inspector.render(scenario, event, frame.index, frame.progress >= 1);
  const arrived = frame.progress >= 1;
  if (arrived && frame.index > (progress[scenario.id] ?? -1)) {
    progress = { ...progress, [scenario.id]: frame.index };
    store.set('progress', JSON.stringify(progress));
    renderProgress();
  }
  if (embedded && embedStarted && arrived && !visitedEmbedSteps.has(frame.index)) {
    visitedEmbedSteps.add(frame.index);
    notifyParent('progress', { step: visitedEmbedSteps.size, currentStep: frame.index + 1, totalSteps: scenario.events.length, complete: visitedEmbedSteps.size === scenario.events.length });
  }
  const play = $<HTMLButtonElement>('.play');
  if (play.dataset.state !== String(frame.playing)) {
    play.dataset.state = String(frame.playing);
    play.innerHTML = icon(frame.playing ? ui.pause : ui.play) + `<span>${t(frame.playing ? 'pause' : 'play')}</span>`;
    play.setAttribute('aria-label', t(frame.playing ? 'pause' : 'play'));
  }
  $('.scrub-track i').style.width = `${(100 * frame.time / (frame.total || 1)).toFixed(2)}%`;
  if (frame.index !== shownIndex) {
    shownIndex = frame.index;
    $('.counter').textContent = `${t('step')} ${frame.index + 1} ${t('of')} ${scenario.events.length}`;
    $('.viz-caption').textContent = tx(event.title);
    const route = (id: string) => tx(scenario.topology.nodes.find(n => n.id === id)?.label ?? id);
    $('.story').className = `story tone-${event.tone}`;
    $('.story').innerHTML = `<span class="step-badge">${t('step')} ${frame.index + 1}</span>
      <span class="story-route">${esc(route(event.from))} → ${esc(route(event.to))}</span>
      <h2>${esc(tx(event.title))}</h2><p>${esc(tx(event.text))}</p>`;
    app.querySelectorAll<HTMLElement>('.tick').forEach((tick, i) => {
      tick.classList.toggle('is-done', i < frame.index);
      tick.classList.toggle('is-current', i === frame.index);
    });
  }
}

function renderRail(): void {
  const levels = ['', t('level1'), t('level2'), t('level3')];
  $('#rail').innerHTML = `<div class="rail-head"><h2>${t('lessons')}</h2>
    <button class="icon-btn rail-close" type="button" data-action="rail" aria-label="${esc(t('close'))}">${icon(ui.close)}</button></div>` +
    categories.map(c => `<section><h3>${esc(category(c))}</h3><ul>${scenarios.filter(s => s.category === c).map(s => {
      const done = Math.round(100 * ((progress[s.id] ?? -1) + 1) / s.events.length);
      return `<li><a href="#/${s.id}" class="lesson-link${s.id === scenario.id ? ' is-active' : ''}" data-id="${s.id}"
        ${s.id === scenario.id ? 'aria-current="page"' : ''} style="--done:${done}">
        <span class="ring" aria-hidden="true">${done === 100 ? icon(ui.check) : ''}</span>
        <span class="ll-text"><strong>${esc(s.name)}</strong><small>${esc(tx(s.tagline))}</small></span>
        <span class="ll-level" title="${esc(levels[s.level])}">${'●'.repeat(s.level)}${'○'.repeat(3 - s.level)}</span></a></li>`;
    }).join('')}</ul></section>`).join('');
}

function renderProgress(): void {
  const total = scenarios.reduce((n, s) => n + s.events.length, 0);
  const seen = scenarios.reduce((n, s) => n + (progress[s.id] ?? -1) + 1, 0);
  const pct = Math.round(100 * seen / total);
  $('.tp-bar i').style.width = pct + '%';
  $('.tp-value').textContent = pct + ' %';
  $('.top-progress').setAttribute('aria-label', `${t('progress')} ${pct} %`);
  app.querySelectorAll<HTMLElement>('.lesson-link').forEach(link => {
    const s = findScenario(link.dataset.id)!;
    const done = Math.round(100 * ((progress[s.id] ?? -1) + 1) / s.events.length);
    link.style.setProperty('--done', String(done));
    link.querySelector('.ring')!.innerHTML = done === 100 ? icon(ui.check) : '';
  });
}

function renderLesson(): void {
  const levels = ['', t('level1'), t('level2'), t('level3')];
  $('.lesson').innerHTML = `<div class="lesson-meta"><span>${esc(category(scenario.category))}</span><span class="dot">·</span><span>${levels[scenario.level]}</span>
    <span class="dot">·</span><span>${scenario.events.length} ${t('step').toLowerCase()}s</span></div>
    <h1>${esc(scenario.name)} <span>${esc(tx(scenario.tagline))}</span></h1>
    <p class="intro">${esc(tx(scenario.intro))}</p>
    <button type="button" class="more" data-action="more" aria-expanded="false">${t('readMore')}</button>`;
  $('.ticks').innerHTML = scenario.events.map((e, i) =>
    `<button type="button" class="tick tone-${e.tone}" data-index="${i}" aria-label="${esc(`${t('step')} ${i + 1} : ${tx(e.title)}`)}" title="${esc(`${i + 1}. ${tx(e.title)}`)}"></button>`).join('');
}

function renderChrome(): void {
  document.documentElement.lang = lang();
  document.documentElement.dataset.theme = theme;
  document.title = `${scenario.name} · ${t('brand')}`;
  app.querySelectorAll<HTMLElement>('[data-t]').forEach(n => { n.textContent = t(n.dataset.t as Parameters<typeof t>[0]); });
  app.querySelectorAll<HTMLElement>('[data-lang]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === lang())));
  $('.lang').setAttribute('aria-label', t('language'));
  const themeBtn = $('[data-action="theme"]');
  themeBtn.innerHTML = icon(theme === 'dark' ? ui.sun : ui.moon);
  themeBtn.setAttribute('aria-label', t('theme'));
  themeBtn.title = t('theme');
  $('.rail-toggle').setAttribute('aria-label', t('openLessons'));
  const names: Record<View, string> = { network: t('viewNetwork'), sequence: t('viewSequence'), both: t('viewBoth') };
  app.querySelectorAll<HTMLElement>('.views [data-view]').forEach(b => {
    const v = b.dataset.view as View;
    b.textContent = names[v];
    b.setAttribute('aria-pressed', String(v === view));
  });
  $('.views').setAttribute('aria-label', t('views'));
  $('.viz').dataset.view = view;
  app.querySelectorAll<HTMLElement>('[data-speed]').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.speed) === speed)));
  $('.speed').setAttribute('aria-label', t('speed'));
  for (const [action, key] of [['restart', 'restart'], ['previous', 'previous'], ['next', 'next']] as const) {
    const b = $(`[data-action="${action}"]`);
    b.setAttribute('aria-label', t(key));
    b.title = t(key);
  }
  $('.scrub').setAttribute('aria-label', t('timeline'));
  $('.hint').textContent = t('shortcuts');
  $('.play').dataset.state = '';
}

function open(next: Scenario, keepPlace = false): void {
  scenario = next;
  store.set('last', scenario.id);
  if (!embedded && location.hash !== `#/${scenario.id}`) history.replaceState(null, '', `#/${scenario.id}`);
  shownIndex = -1;
  embedStarted = false;
  visitedEmbedSteps.clear();
  renderChrome();
  renderRail();
  renderLesson();
  renderProgress();
  const hopCount = (e: Parameters<typeof hops>[1]) => hops(scenario.topology, e);
  const summaries = summarize(scenario, hopCount);
  topology.render(scenario, summaries);
  sequence.render(scenario, summaries, hopCount);
  log.render(scenario, summaries);
  const slots = schedule(scenario.events, e => hops(scenario.topology, e));
  const seen = progress[scenario.id] ?? -1;
  player.load(slots, embedded ? -1 : keepPlace ? player.frame().index : seen >= scenario.events.length - 1 ? -1 : seen);
  notifyParent('ready', { totalSteps: scenario.events.length });
}


function setRail(openRail: boolean): void {
  document.body.classList.toggle('rail-open', openRail);
  $('.rail-toggle').setAttribute('aria-expanded', String(openRail));
}

app.addEventListener('click', e => {
  const target = e.target as Element;
  const link = target.closest<HTMLAnchorElement>('.lesson-link');
  if (link) {
    e.preventDefault();
    setRail(false);
    const next = findScenario(link.dataset.id);
    if (next && next !== scenario) { open(next); player.play(); }
    $('#stage').focus({ preventScroll: true });
    return;
  }
  const button = target.closest<HTMLElement>('[data-action],[data-lang],[data-view],[data-speed],.tick');
  if (!button) return;
  if (button.classList.contains('tick')) { embedStarted = true; player.replay(Number(button.dataset.index)); return; }
  if (button.dataset.lang) { setLang(button.dataset.lang as Lang); store.set('lang', lang()); open(scenario, true); return; }
  if (button.dataset.view && button.closest('.views')) { setView(button.dataset.view as View); return; }
  if (button.dataset.speed) {
    speed = Number(button.dataset.speed);
    player.speed = speed;
    store.set('speed', String(speed));
    renderChrome();
    return;
  }
  switch (button.dataset.action) {
    case 'theme': theme = theme === 'dark' ? 'light' : 'dark'; store.set('theme', theme); renderChrome(); break;
    case 'rail': setRail(!document.body.classList.contains('rail-open')); break;
    case 'restart': embedStarted = true; player.seek(0); player.play(); break;
    case 'previous': embedStarted = true; player.previous(); break;
    case 'next': embedStarted = true; player.next(); break;
    case 'play': embedStarted = true; player.toggle(); break;
    case 'more': {
      const open = $('.lesson').classList.toggle('is-open');
      button.setAttribute('aria-expanded', String(open));
      button.textContent = t(open ? 'readLess' : 'readMore');
      break;
    }
  }
});

function setView(next: View): void {
  view = next;
  store.set('view', view);
  renderChrome();
}

$('.scrub-track').addEventListener('pointerdown', e => {
  const track = e.currentTarget as HTMLElement;
  const seek = (x: number) => {
    const box = track.getBoundingClientRect();
    player.seek(((x - box.left) / box.width) * player.total);
  };
  seek(e.clientX);
  const move = (m: PointerEvent) => seek(m.clientX);
  const up = () => { removeEventListener('pointermove', move); removeEventListener('pointerup', up); };
  addEventListener('pointermove', move);
  addEventListener('pointerup', up);
});

document.addEventListener('keydown', e => {
  if (embedded && !e.altKey && !e.ctrlKey && !e.metaKey) embedStarted = true;
  if (e.altKey || e.ctrlKey || e.metaKey) return;
  const target = e.target as HTMLElement;
  if (target.closest('input, textarea, select, [contenteditable]')) return;
  const onControl = !!target.closest('button, a, [role="button"]');
  if (e.key === ' ' && !onControl) { e.preventDefault(); player.toggle(); }
  else if (e.key === 'ArrowRight') { e.preventDefault(); player.next(); }
  else if (e.key === 'ArrowLeft') { e.preventDefault(); player.previous(); }
  else if (e.key === 'Home' && !onControl) { player.seek(0); }
  else if (e.key === 'Escape') { setRail(false); }
  else if (e.key === '1') setView('network');
  else if (e.key === '2') setView('sequence');
  else if (e.key === '3') setView('both');
});

addEventListener('hashchange', () => {
  if (embedded) return;
  const next = findScenario(location.hash.slice(2));
  if (next && next !== scenario) open(next);
});
prefersDark.addEventListener('change', e => {
  if (embedded || store.get('theme')) return;
  theme = e.matches ? 'dark' : 'light';
  renderChrome();
});
document.addEventListener('visibilitychange', () => { if (document.hidden) player.pause(); });
if (embedded) {
  window.addEventListener('message', e => {
    if (e.source !== window.parent || !parentOrigin || e.origin !== parentOrigin) return;
    const msg = e.data;
    if (!msg || typeof msg !== 'object' || msg.source !== 'sentinel-campus' || msg.version !== 1 || msg.scenarioId !== scenario.id) return;
    switch (msg.type) {
      case 'hello': notifyParent('ready', { totalSteps: scenario.events.length }); break;
      case 'restore':
        if (Array.isArray(msg.visited) && msg.visited.length <= scenario.events.length &&
            msg.visited.every((step: unknown) => Number.isInteger(step) && (step as number) >= 1 && (step as number) <= scenario.events.length)) {
          for (const step of msg.visited as number[]) visitedEmbedSteps.add(step - 1);
        }
        break;
      case 'pause': player.pause(); break;
      case 'play': embedStarted = true; player.play(); break;
      case 'restart': embedStarted = true; player.seek(0); player.play(); break;
      case 'theme':
        if (msg.value === 'light' || msg.value === 'dark') { theme = msg.value; renderChrome(); }
        break;
      case 'lang':
        if (msg.value === 'fr' || msg.value === 'en') { setLang(msg.value); open(scenario, true); }
        break;
    }
  });
}

open(scenario);
if (embedded && !findScenario(requestedEmbeddedScenario)) notifyParent('error', { code: 'unknown-scenario' });
