import type { NodeKind } from '../model.ts';

/** Line icons on a 24 × 24 grid, drawn for this project. */
export const nodeIcon: Record<NodeKind, string> = {
  laptop: 'M4.5 6.5A1.5 1.5 0 0 1 6 5h12a1.5 1.5 0 0 1 1.5 1.5V15h-15zM2.5 18h19l-1.3 1.6H3.8z',
  phone: 'M8.2 2.8h7.6a1.6 1.6 0 0 1 1.6 1.6v15.2a1.6 1.6 0 0 1-1.6 1.6H8.2a1.6 1.6 0 0 1-1.6-1.6V4.4a1.6 1.6 0 0 1 1.6-1.6zM11 18h2',
  router: 'M3.5 13h17a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-17a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1zM6.5 16h.01M9.5 16h.01M17 13l1.8-7.5M7 13 5.2 5.5',
  'network-router': 'M3 8h18v9H3zM6 11h2v3H6zM10 11h2v3h-2zM14 11h2v3h-2zM18 11h1v3h-1zM5 20h14',
  cloud: 'M7 18.5a4.5 4.5 0 0 1-.6-8.96A6 6 0 0 1 17.8 8.6 4.5 4.5 0 0 1 17 18.5z',
  server: 'M4.5 3.5h15a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1zM4.5 13.5h15a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1zM7 7h.01M7 17h.01M11 7h6M11 17h6',
  dns: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3.2 12h17.6M12 3c2.4 2.6 3.6 5.6 3.6 9s-1.2 6.4-3.6 9M12 3c-2.4 2.6-3.6 5.6-3.6 9s1.2 6.4 3.6 9',
  mail: 'M3.5 5.5h17a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1h-17a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1zM3 6.5l9 6.5 9-6.5',
  switch: 'M2.5 9a13.5 13.5 0 0 1 19 0M5.6 12.2a9 9 0 0 1 12.8 0M8.7 15.4a4.6 4.6 0 0 1 6.6 0M12 19h.01'
};

export const ui = {
  lock: 'M7.5 11V8a4.5 4.5 0 0 1 9 0v3M6 11h12a1 1 0 0 1 1 1v7.5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V12a1 1 0 0 1 1-1z',
  play: 'M8 5.2v13.6L19 12z',
  pause: 'M7 5h3.5v14H7zM13.5 5H17v14h-3.5z',
  next: 'M5.5 5.5v13l9-6.5zM17 5.5v13',
  previous: 'M18.5 5.5v13l-9-6.5zM7 5.5v13',
  restart: 'M4.5 12a7.5 7.5 0 1 0 2.2-5.3M4.5 4.5V9H9',
  sun: 'M12 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9zM12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4',
  moon: 'M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z',
  menu: 'M4 7h16M4 12h16M4 17h16',
  close: 'M6 6l12 12M18 6 6 18',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  cross: 'M7 7l10 10M17 7 7 17'
} as const;

export const icon = (d: string, cls = 'icon'): string =>
  `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${d}"/></svg>`;

/** Protocol: packet route over two protocol layers, observed by a cyan arc. */
export const mark = `<svg class="mark" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
<defs><linearGradient id="protocol-cyan" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#00E5FF"/><stop offset="1" stop-color="#247CF4"/></linearGradient>
<linearGradient id="protocol-teal" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#14C8A6"/><stop offset="1" stop-color="#00E5FF"/></linearGradient>
<linearGradient id="protocol-violet" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#5274EC"/><stop offset="1" stop-color="#8B5CF6"/></linearGradient></defs>
<rect width="96" height="96" rx="22" fill="#0B1026"/>
<path d="M17 42a31 31 0 0 1 56-19" fill="none" stroke="url(#protocol-cyan)" stroke-width="4.5" stroke-linecap="round"/>
<path d="M48 7v6M29 14l3 5M19 29l6 3" fill="none" stroke="#00E5FF" stroke-width="2.6" stroke-linecap="round"/>
<path d="M72 17l11 3-9 10z" fill="#8B5CF6"/>
<path d="M16 65l31-16 33 14-31 17z" fill="url(#protocol-violet)" stroke="#A89BFF" stroke-width="1.2" stroke-linejoin="round"/>
<path d="M16 49l31-16 33 14-31 17z" fill="url(#protocol-teal)" stroke="#56F5EC" stroke-width="1.2" stroke-linejoin="round"/>
<path d="M30 49l18 9 18-10" fill="none" stroke="#F8FAFF" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
<circle cx="30" cy="49" r="4.8" fill="#F8FAFF"/><circle cx="48" cy="58" r="4.8" fill="#F8FAFF"/><circle cx="66" cy="48" r="4.8" fill="#F8FAFF"/>
</svg>`;
