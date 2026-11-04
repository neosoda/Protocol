export type Lang = 'fr' | 'en';
export interface Text { fr: string; en: string }
export const T = (fr: string, en: string): Text => ({ fr, en });

/** A protocol header or payload, with every field mapped onto its own bytes. */
export type PartKind =
  | 'ip' | 'icmp' | 'udp' | 'tcp' | 'dns' | 'dhcp' | 'http'
  | 'tls' | 'ssh' | 'smtp' | 'pop3' | 'imap' | 'ftp' | 'data';
export interface Field { name: string; value: string | Text; offset: number; length: number; note: Text }
export interface Part { kind: PartKind; title: string; bytes: Uint8Array; fields: Field[]; encrypted?: boolean }
/** A part placed in a packet: field offsets are then absolute. */
export interface Layer extends Part { offset: number }
export interface Packet { bytes: Uint8Array; layers: Layer[] }

export type NodeKind = 'laptop' | 'phone' | 'router' | 'cloud' | 'server' | 'dns' | 'mail' | 'switch';
export interface NetNode { id: string; kind: NodeKind; label: Text; ip?: string; x: number; y: number }
export interface Topology { nodes: NetNode[]; links: [string, string][] }

export type Tone = 'control' | 'data' | 'secure' | 'alert' | 'broadcast';
export interface NetEvent {
  id: string;
  from: string;
  to: string;
  /** Short on-the-wire label drawn on the travelling packet. */
  label: string;
  title: Text;
  text: Text;
  tone: Tone;
  packet: Packet;
  /** The packet is lost on the way and never arrives. */
  drop?: boolean;
  /** Other nodes that also receive a copy (broadcast). */
  also?: string[];
}

export type Category = 'foundations' | 'services' | 'web' | 'mail' | 'remote';
export interface Scenario {
  id: string;
  name: string;
  category: Category;
  level: 1 | 2 | 3;
  tagline: Text;
  intro: Text;
  topology: Topology;
  /** Lifelines of the sequence view, left to right. */
  actors: string[];
  events: NetEvent[];
}
