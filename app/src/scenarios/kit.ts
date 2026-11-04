import { T, type NetEvent, type NetNode, type NodeKind, type Part, type Text, type Tone, type Topology } from '../model.ts';
import { assemble } from '../packets/bytes.ts';

/** Addresses: RFC 1918 at home, RFC 5737 documentation ranges elsewhere. */
export const IP = {
  laptop: '192.168.1.23',
  phone: '192.168.1.31',
  box: '192.168.1.1',
  boxWan: '198.51.100.7',
  isp: '198.51.100.1',
  core: '192.0.2.254',
  web: '203.0.113.10',
  mail: '203.0.113.25',
  shell: '203.0.113.22',
  files: '203.0.113.21',
  time: '203.0.113.123',
  resolver: '192.0.2.53',
  root: '198.41.0.4',
  tld: '192.5.6.30',
  auth: '203.0.113.53'
} as const;
export const MAC = '3c:22:fb:4a:91:07';

export const node = (id: string, kind: NodeKind, label: Text, x: number, y: number, ip?: string): NetNode =>
  ({ id, kind, label, x, y, ...(ip ? { ip } : {}) });

export const laptop = (x = 110, y = 300): NetNode => node('client', 'laptop', T('Ordinateur', 'Laptop'), x, y, IP.laptop);
export const box = (x = 330, y = 300): NetNode => node('box', 'router', T('Box Internet', 'Home router'), x, y, IP.box);
export const cloud = (x = 590, y = 200): NetNode => node('internet', 'cloud', T('Internet', 'Internet'), x, y);

/** Laptop → home router → Internet → one remote server: the shape of most lessons. */
export function toServer(kind: NodeKind, label: Text, ip: string): Topology {
  return {
    nodes: [laptop(), box(), cloud(), node('server', kind, label, 870, 300, ip)],
    links: [['client', 'box'], ['box', 'internet'], ['internet', 'server']]
  };
}

export interface EventSpec {
  from: string; to: string; label: string; title: Text; text: Text; tone?: Tone;
  parts: Part[]; drop?: boolean; also?: string[];
}

/** Each scenario numbers its own events from 1. */
export function events(scenario: string, specs: EventSpec[]): NetEvent[] {
  return specs.map((spec, i) => ({
    id: `${scenario}-${i + 1}`,
    from: spec.from, to: spec.to, label: spec.label, title: spec.title, text: spec.text,
    tone: spec.tone ?? 'control', packet: assemble(spec.parts),
    ...(spec.drop ? { drop: true } : {}), ...(spec.also ? { also: spec.also } : {})
  }));
}
