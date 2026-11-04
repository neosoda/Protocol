import type { Layer, NetEvent, Scenario } from '../model.ts';
import { tx } from '../i18n.ts';

export interface Summary {
  proto: string;
  src: string;
  dst: string;
  ports: string;
  info: string;
  /** Simulated capture time, in seconds since the first packet. */
  time: number;
}

const u16 = (b: Uint8Array, at: number) => (b[at] << 8) | b[at + 1];
const u32 = (b: Uint8Array, at: number) => ((b[at] << 24) | (b[at + 1] << 16) | (b[at + 2] << 8) | b[at + 3]) >>> 0;
const ip4 = (b: Uint8Array, at: number) => `${b[at]}.${b[at + 1]}.${b[at + 2]}.${b[at + 3]}`;
const flagNames: [number, string][] = [[2, 'SYN'], [16, 'ACK'], [8, 'PSH'], [1, 'FIN'], [4, 'RST']];

const names: Partial<Record<Layer['kind'], string>> = {
  icmp: 'ICMP', dns: 'DNS', dhcp: 'DHCP', http: 'HTTP', tls: 'TLS', ssh: 'SSH', smtp: 'SMTP', pop3: 'POP3', imap: 'IMAP', ftp: 'FTP'
};
const fieldText = (layer: Layer, name: string): string | undefined => {
  const f = layer.fields.find(x => x.name === name);
  return f ? tx(f.value) : undefined;
};

/** Short, capture-tool style description of every packet of a scenario. */
export function summarize(scenario: Scenario, hops: (e: NetEvent) => number): Summary[] {
  const base = new Map<string, number>();
  let clock = 0;
  return scenario.events.map((event, i) => {
    const bytes = event.packet.bytes;
    const ip = event.packet.layers[0];
    const src = ip4(bytes, 12), dst = ip4(bytes, 16);
    const transport = event.packet.layers[1];
    const app = event.packet.layers.slice(2);
    const top = [...event.packet.layers].reverse().find(l => names[l.kind]) ?? (app[0]?.title === 'NTP' ? app[0] : undefined);
    let proto = top ? (top.title === 'NTP' ? 'NTP' : names[top.kind]!) : transport?.kind.toUpperCase() ?? 'IP';
    let ports = '';
    let info = event.label;
    if (transport && (transport.kind === 'tcp' || transport.kind === 'udp')) {
      const t = bytes.subarray(transport.offset);
      const sport = u16(t, 0), dport = u16(t, 2);
      ports = `${sport} → ${dport}`;
      if (transport.kind === 'tcp') {
        const flags = flagNames.filter(([bit]) => t[13] & bit).map(([, n]) => n);
        const seq = u32(t, 4), ack = u32(t, 8);
        const len = bytes.length - transport.offset - (t[12] >> 4) * 4;
        const me = `${src}:${sport}`, peer = `${dst}:${dport}`;
        // Sequence numbers relative to each side's first number, as capture tools show them.
        if (!base.has(me)) base.set(me, flags.includes('SYN') ? seq : seq - 1);
        if (!base.has(peer) && flags.includes('ACK')) base.set(peer, ack - 1);
        const rel = (n: number, key: string) => (n - (base.get(key) ?? n)) >>> 0;
        const tcpInfo = `[${flags.join(', ')}] Seq=${rel(seq, me)}${flags.includes('ACK') ? ` Ack=${rel(ack, peer)}` : ''} Len=${len}`;
        if (!top) { proto = 'TCP'; info = `${ports} ${tcpInfo}`; }
      }
    }
    if (top) info = describeApp(top, event) ?? info;
    if (proto === 'ICMP') info = describeIcmp(bytes.subarray(event.packet.layers[1].offset));
    const time = clock;
    clock += 0.004 + hops(event) * 0.006 + (i % 3) * 0.0013;
    return { proto, src, dst, ports, info, time };
  });
}

function describeApp(layer: Layer, event: NetEvent): string | undefined {
  switch (layer.kind) {
    case 'dns': {
      const id = fieldText(layer, 'Transaction ID');
      const q = fieldText(layer, 'QNAME');
      const response = (fieldText(layer, 'Flags') ?? '').startsWith('Response');
      const answer = layer.fields.find(f => f.name.startsWith('Answer'));
      const referral = layer.fields.find(f => f.name.startsWith('Authority'));
      if (!response) return `Query ${id} A ${q}`;
      if (answer) return `Response ${id} A ${tx(answer.value).split('→ ')[1]}`;
      return `Response ${id} NS ${referral ? tx(referral.value).split('→ ')[1] : ''}`;
    }
    case 'dhcp': return `DHCP ${fieldText(layer, 'Option 53 · Message Type')} · xid ${fieldText(layer, 'xid')}`;
    case 'tls': case 'ssh': return layer.title.split('· ')[1] ?? event.label;
    case 'http': case 'smtp': case 'pop3': case 'imap': case 'ftp': {
      const first = layer.fields[0];
      return first ? tx(first.value) : event.label;
    }
    case 'data': return layer.title === 'NTP' ? `NTP v4 ${tx(layer.fields[0].value).split(', ')[1]}` : undefined;
    default: return undefined;
  }
}

function describeIcmp(b: Uint8Array): string {
  if (b[0] === 11) return 'Time-to-live exceeded';
  const id = u16(b, 4), seq = u16(b, 6);
  return `Echo (ping) ${b[0] === 8 ? 'request' : 'reply'} id=0x${id.toString(16).padStart(4, '0')} seq=${seq}`;
}
