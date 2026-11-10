import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';

/** Renders the PNG icons and the sharing card from public/favicon.svg. Run: node scripts/brand-assets.mjs */
const pub = resolve(import.meta.dirname, '..', 'public');
const mark = await readFile(resolve(pub, 'favicon.svg'), 'utf8');
// Any local Chromium works: set PW_CHANNEL=msedge or chrome to skip Playwright's download.
const browser = await chromium.launch(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {});
const page = await browser.newPage();

for (const [file, size, pad] of [['icon-192.png', 192, 0], ['icon-512.png', 512, 0], ['apple-touch-icon.png', 180, 0]]) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<style>html,body{margin:0;background:#0B1026}svg{display:block;width:${size - 2 * pad}px;height:${size - 2 * pad}px;margin:${pad}px}</style>${mark}`);
  await page.screenshot({ path: resolve(pub, file) });
}

const packet = (x, y, label, color) => `<g transform="translate(${x} ${y})"><rect x="-58" y="-17" width="116" height="34" rx="17" fill="${color}"/>
  <text y="6" text-anchor="middle" font-family="Consolas,monospace" font-weight="700" font-size="17" fill="#fff">${label}</text></g>`;
await page.setViewportSize({ width: 1200, height: 630 });
await page.setContent(`<style>html,body{margin:0}body{width:1200px;height:630px;background:radial-gradient(90% 80% at 70% 40%,#173B5B,#0B1026 70%);
  font-family:"Segoe UI",system-ui,sans-serif;color:#e9eefa;position:relative;overflow:hidden}
  .logo{position:absolute;left:72px;top:68px;display:flex;align-items:center;gap:18px;font-size:30px;font-weight:700}
  .logo svg{width:64px;height:64px}
  h1{position:absolute;left:72px;top:190px;margin:0;font-size:64px;line-height:1.05;letter-spacing:-1.5px;max-width:620px}
  p{position:absolute;left:72px;top:360px;margin:0;font-size:26px;color:#a6b2cd;max-width:560px;line-height:1.4}
  .chips{position:absolute;left:72px;bottom:64px;display:flex;gap:10px;font:600 18px Consolas,monospace;color:#a6b2cd}
  .chips span{padding:6px 12px;border-radius:10px;background:rgba(150,172,232,.1)}
  svg.map{position:absolute;right:40px;top:60px}</style>
  <div class="logo">${mark}Protocol.techsentinel.fr</div>
  <h1>Les protocoles, paquet par paquet</h1>
  <p>17 leçons animées, chaque octet décodé.</p>
  <div class="chips"><span>TCP</span><span>DNS</span><span>TLS 1.3</span><span>HTTP</span><span>OSPF</span><span>BGP</span></div>
  <svg class="map" width="470" height="520" viewBox="0 0 470 520">
    <g stroke="rgba(150,172,232,.25)" stroke-width="3" fill="none"><path d="M70 420L230 260L400 380M230 260L330 100"/></g>
    <path d="M70 420L230 260L330 100" stroke="#00E5FF" stroke-width="5" fill="none" stroke-linecap="round"/>
    ${[[70, 420], [230, 260], [400, 380], [330, 100]].map(([x, y]) => `<rect x="${x - 34}" y="${y - 34}" width="68" height="68" rx="20" fill="#131c31" stroke="rgba(150,172,232,.3)" stroke-width="2"/>`).join('')}
    ${packet(285, 175, 'SYN, ACK', '#00E5FF')}${packet(150, 340, 'GET /', '#14C8A6')}
  </svg>`);
await page.screenshot({ path: resolve(pub, 'og.png') });
await browser.close();
console.log('Icons and og.png written to public/');
