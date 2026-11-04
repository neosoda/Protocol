export type Category = 'network' | 'web' | 'security';
export type Layer = 'network' | 'transport' | 'application' | 'security';
export interface Participant { id: string; name: string; role: string }
export interface PacketField { layer: Layer; name: string; value: string; explanation: string; /** Offsets into sample UTF-8 bytes only; omit when not verified. */ sampleRange?: { offset: number; length: number } }
export interface NetworkEvent {
  id: string;
  from: string;
  to: string;
  title: string;
  description: string;
  fields: PacketField[];
  /** Optional original example string; UTF-8 bytes are derived, never claimed as captured traffic. */
  sample?: string;
}
export interface ProtocolScenario {
  id: string;
  name: string;
  category: Category;
  level: 'initial' | 'intermediate' | 'advanced';
  minutes: number;
  summary: string;
  objective: string;
  /** Explicitly modelled scenario; not a pcap or live capture. */
  modelled: true;
  participants: Participant[];
  events: NetworkEvent[];
}
