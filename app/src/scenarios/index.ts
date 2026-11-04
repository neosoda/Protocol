import type { Category, Scenario } from '../model.ts';
import { icmp, ip, tcpScenario, udpScenario } from './foundations.ts';
import { dhcpScenario, dnsScenario } from './services.ts';
import { http, https, tls } from './web.ts';
import { imap, pop3, smtp } from './mail.ts';
import { ftp, ssh } from './remote.ts';

export const scenarios: readonly Scenario[] = [
  ip, icmp, udpScenario, tcpScenario,
  dhcpScenario, dnsScenario,
  http, tls, https,
  smtp, pop3, imap,
  ssh, ftp
];
export const categories: readonly Category[] = ['foundations', 'services', 'web', 'mail', 'remote'];
export const findScenario = (id: string | null | undefined): Scenario | undefined => scenarios.find(s => s.id === id);
