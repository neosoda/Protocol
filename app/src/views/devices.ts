import type { NodeKind } from '../model.ts';

/**
 * Device illustrations, drawn for this project in an oblique 3D projection:
 * every solid is a front face, a top face receding up-right and a side face.
 * Shapes are centred on (0, 0) with the floor around y = 30.
 */
const K = 0.6; // vertical rise of the receding axis

function solid(x: number, y: number, w: number, h: number, d: number, cls = ''): string {
  const r = d * K;
  return `<g class="solid ${cls}">
    <path class="f-side" d="M${x + w} ${y}L${x + w + d} ${y - r}V${y + h - r}L${x + w} ${y + h}Z"/>
    <path class="f-top" d="M${x} ${y}L${x + d} ${y - r}H${x + w + d}L${x + w} ${y}Z"/>
    <rect class="f-front" x="${x}" y="${y}" width="${w}" height="${h}"/></g>`;
}

/** Maps (u along the width, v in 0..1 across the depth) onto a top face. */
const onTop = (x: number, y: number, d: number, inner: string): string =>
  `<g transform="matrix(1 0 ${d} ${-d * K} ${x} ${y})">${inner}</g>`;

const shadow = (w: number, y = 30): string => `<ellipse class="dev-shadow" cx="6" cy="${y}" rx="${w / 2}" ry="${w / 9}"/>`;

const leds = (x: number, y: number, n: number, gap = 9): string =>
  Array.from({ length: n }, (_, i) => `<circle class="led led-${i % 3}" cx="${x + i * gap}" cy="${y}" r="2.6"/>`).join('');

const badges: Partial<Record<NodeKind, string>> = {
  dns: 'M0-7a7 7 0 1 0 0 14A7 7 0 0 0 0-7zM-7 0h14M0-7c2 2 3 4.5 3 7s-1 5-3 7M0-7c-2 2-3 4.5-3 7s1 5 3 7',
  mail: 'M-7-5h14v10h-14zM-7-5l7 5.5 7-5.5'
};

function laptop(): string {
  const x = -66, y = 10, w = 112, d = 24, r = d * K;
  const keys = Array.from({ length: 3 }, (_, row) => Array.from({ length: 10 }, (_, col) =>
    `<rect class="key" x="${10 + col * 9.4}" y="${0.22 + row * 0.2}" width="7" height="0.13" rx="0.04"/>`).join('')).join('');
  const backY = y - r, lx = x + d, top = backY - 74;
  return shadow(150, 30) + solid(x, y, w, 8, d, 'deck') +
    onTop(x, y, d, keys + '<rect class="pad" x="44" y="0.02" width="26" height="0.16" rx="0.05"/>') +
    `<path class="lid" d="M${lx} ${backY}H${lx + w}L${lx + w + 7} ${top}H${lx + 7}Z"/>
     <path class="screen" d="M${lx + 6} ${backY - 6}H${lx + w - 6}L${lx + w + 1} ${top + 6}H${lx + 13}Z"/>
     <g class="screen-ui" transform="translate(${lx + 14} ${top + 13})">
       <rect class="ui-bar" width="${w - 22}" height="9" rx="4.5"/>
       <rect class="ui-line" y="18" width="60" height="5" rx="2.5"/><rect class="ui-line" y="29" width="80" height="5" rx="2.5"/>
       <rect class="ui-line" y="40" width="44" height="5" rx="2.5"/></g>`;
}

function router(): string {
  const x = -54, y = -2, w = 96, h = 26, d = 22, r = d * K;
  const antenna = (ax: number) => `<path class="antenna" d="M${ax} ${y - r + 4}L${ax - 5} ${y - r - 40}"/><circle class="antenna-tip" cx="${ax - 5}" cy="${y - r - 42}" r="3.4"/>`;
  return shadow(140) + antenna(x + d + 12) + antenna(x + w + d - 14) + solid(x, y, w, h, d) +
    leds(x + 14, y + 13, 4) +
    `<path class="vent" d="M${x + w - 34} ${y + 8}v10M${x + w - 27} ${y + 8}v10M${x + w - 20} ${y + 8}v10M${x + w - 13} ${y + 8}v10"/>`;
}

function rack(kind: NodeKind): string {
  const x = -44, w = 76, h = 22, d = 20, r = d * K;
  // Bottom unit first, so each unit's top face sits under the one above.
  const units = [-2, -26, -50].map(y => solid(x, y, w, h, d) + leds(x + 11, y + 11, 2, 8) +
    `<path class="slot" d="M${x + 34} ${y + 8}h30M${x + 34} ${y + 14}h22"/>`).join('');
  const glyph = badges[kind];
  const badge = glyph ? `<g class="badge" transform="translate(${x + w + d - 2} ${-50 - r - 6})"><circle r="13"/><path d="${glyph}"/></g>` : '';
  return shadow(128) + units + badge;
}

function phone(): string {
  const x = -20, y = -54, w = 38, h = 78, d = 9;
  return shadow(70) + solid(x, y, w, h, d) +
    `<rect class="screen" x="${x + 4}" y="${y + 6}" width="${w - 8}" height="${h - 16}" rx="3"/>
     <rect class="ui-line" x="${x + 9}" y="${y + 14}" width="20" height="4" rx="2"/><rect class="ui-line" x="${x + 9}" y="${y + 23}" width="14" height="4" rx="2"/>`;
}

function cloud(): string {
  return `<ellipse class="dev-shadow" cx="0" cy="34" rx="78" ry="12"/>
    <path class="cloud" d="M-62 26c-22 0-30-26-10-36-4-22 22-36 40-22 8-24 48-26 58 2 22-8 44 10 34 32 18 6 14 24-4 24z"/>
    <g class="globe"><circle cx="2" cy="2" r="20"/><path d="M-18 2h40M2-18c7 5 10 12 10 20s-3 15-10 20M2-18c-7 5-10 12-10 20s3 15 10 20"/></g>`;
}

function accessPoint(): string {
  const x = -40, y = 4, w = 70, h = 14, d = 18;
  return shadow(110) + solid(x, y, w, h, d) + leds(x + 12, y + 7, 1) +
    `<g class="waves"><path class="wave w1" d="M-13 -12a18 18 0 0 1 26 0"/><path class="wave w2" d="M-23 -22a32 32 0 0 1 46 0"/>
     <path class="wave w3" d="M-33 -32a46 46 0 0 1 66 0"/></g>`;
}

export function device(kind: NodeKind): string {
  switch (kind) {
    case 'laptop': return laptop();
    case 'phone': return phone();
    case 'router': return router();
    case 'cloud': return cloud();
    case 'switch': return accessPoint();
    case 'server': case 'dns': case 'mail': return rack(kind);
  }
}
