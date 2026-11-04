import type { Field, Layer, Packet, Part, PartKind, Text } from '../model.ts';

/** Appends bytes and records which field each range belongs to. */
export class Writer {
  private out: number[] = [];
  readonly fields: Field[] = [];

  get length(): number { return this.out.length; }

  put(name: string, value: string | Text, bytes: ArrayLike<number>, note: Text): number {
    const offset = this.out.length;
    for (let i = 0; i < bytes.length; i++) this.out.push(bytes[i] & 0xff);
    this.fields.push({ name, value, offset, length: bytes.length, note });
    return offset;
  }
  u8(name: string, n: number, note: Text, value: string | Text = String(n)): number { return this.put(name, value, [n], note); }
  u16(name: string, n: number, note: Text, value: string | Text = String(n)): number { return this.put(name, value, u16(n), note); }
  u32(name: string, n: number, note: Text, value: string | Text = String(n)): number { return this.put(name, value, u32(n), note); }
  /** Splices another writer's bytes and fields in at the current position. */
  embed(other: Writer): void {
    const shift = this.out.length;
    this.out.push(...other.out);
    for (const f of other.fields) this.fields.push({ ...f, offset: f.offset + shift });
  }
  /** Describes bytes already written (for several fields sharing one byte). */
  mark(name: string, value: string | Text, offset: number, length: number, note: Text): void {
    this.fields.push({ name, value, offset, length, note });
  }
  patch16(offset: number, n: number): void { this.out[offset] = (n >> 8) & 0xff; this.out[offset + 1] = n & 0xff; }
  patchValue(offset: number, value: string): void {
    const field = this.fields.find(f => f.offset === offset);
    if (field) field.value = value;
  }
  bytes(): Uint8Array { return Uint8Array.from(this.out); }
  part(kind: PartKind, title: string, encrypted = false): Part {
    return { kind, title, bytes: this.bytes(), fields: this.fields.map(f => ({ ...f })), ...(encrypted ? { encrypted } : {}) };
  }
}

export const u16 = (n: number): number[] => [(n >> 8) & 0xff, n & 0xff];
export const u32 = (n: number): number[] => [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff];
export const ascii = (text: string): Uint8Array => new TextEncoder().encode(text);
/** A byte count, worded in both languages. */
export const size = (n: number): Text => ({ fr: `${n} octet${n > 1 ? 's' : ''}`, en: `${n} byte${n > 1 ? 's' : ''}` });
export const hex = (n: number, width = 4): string => '0x' + n.toString(16).padStart(width, '0');
export const ipBytes = (ip: string): number[] => ip.split('.').map(Number);

/** RFC 1071 one's-complement sum, as used by IPv4, ICMP, UDP and TCP. */
export function checksum(...chunks: ArrayLike<number>[]): number {
  let sum = 0;
  let odd = -1;
  for (const chunk of chunks) {
    for (let i = 0; i < chunk.length; i++) {
      if (odd < 0) odd = chunk[i];
      else { sum += (odd << 8) | chunk[i]; odd = -1; }
    }
  }
  if (odd >= 0) sum += odd << 8;
  while (sum > 0xffff) sum = (sum & 0xffff) + (sum >>> 16);
  return ~sum & 0xffff;
}

/** Deterministic filler for keys, nonces and ciphertext: same bytes on every load. */
export function noise(seed: string, length: number): Uint8Array {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  const out = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    out[i] = h & 0xff;
  }
  return out;
}

export const concat = (parts: Part[]): Uint8Array => {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.bytes.length, 0));
  let at = 0;
  for (const p of parts) { out.set(p.bytes, at); at += p.bytes.length; }
  return out;
};

export function assemble(parts: Part[]): Packet {
  let offset = 0;
  const layers: Layer[] = parts.map(part => {
    const layer: Layer = { ...part, offset, fields: part.fields.map(f => ({ ...f, offset: f.offset + offset })) };
    offset += part.bytes.length;
    return layer;
  });
  return { bytes: concat(parts), layers };
}
