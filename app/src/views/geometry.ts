import type { NetEvent, Topology } from '../model.ts';

export interface Point { x: number; y: number }

/** Shortest path through the links, as node ids (BFS: links are unweighted). */
export function route(topology: Topology, from: string, to: string): string[] {
  const previous = new Map<string, string | null>([[from, null]]);
  const queue = [from];
  while (queue.length) {
    const here = queue.shift()!;
    if (here === to) break;
    for (const [a, b] of topology.links) {
      const next = a === here ? b : b === here ? a : null;
      if (next && !previous.has(next)) { previous.set(next, here); queue.push(next); }
    }
  }
  if (!previous.has(to)) return [];
  const path: string[] = [];
  for (let at: string | null = to; at !== null; at = previous.get(at) ?? null) path.unshift(at);
  return path;
}

export const hops = (topology: Topology, event: NetEvent): number => Math.max(1, route(topology, event.from, event.to).length - 1);

export function points(topology: Topology, path: string[]): Point[] {
  return path.map(id => topology.nodes.find(n => n.id === id)!).map(n => ({ x: n.x, y: n.y }));
}

export function lengthOf(pts: Point[]): number {
  let total = 0;
  for (let i = 1; i < pts.length; i++) total += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  return total;
}

/** Position at fraction f of the polyline’s length, with the segment’s heading. */
export function along(pts: Point[], f: number): Point & { angle: number } {
  const total = lengthOf(pts);
  let left = Math.max(0, Math.min(1, f)) * total;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    const seg = Math.hypot(b.x - a.x, b.y - a.y);
    if (left <= seg || i === pts.length - 1) {
      const k = seg === 0 ? 0 : Math.min(1, left / seg);
      return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, angle: Math.atan2(b.y - a.y, b.x - a.x) };
    }
    left -= seg;
  }
  return { ...pts[0], angle: 0 };
}

export const ease = (t: number): number => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
