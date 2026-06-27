// Board graph helpers (headless, pure-TS). Consumes the generated board.ts.
import { AREAS, ADJACENCY, IMPASSABLE, AIR_ZONES, type Area, type AirZone } from './board';

export function getArea(id: string): Area {
  const a = AREAS[id];
  if (!a) throw new Error(`Unknown area id: ${id}`);
  return a;
}

/** Passable ground neighbours of an area (white borders only; impassable excluded). */
export function neighbors(id: string): readonly string[] {
  return ADJACENCY[id] ?? [];
}

export function areAdjacent(a: string, b: string): boolean {
  return (ADJACENCY[a] ?? []).includes(b);
}

const undirectedKey = (a: string, b: string): string => (a < b ? `${a}|${b}` : `${b}|${a}`);
const impassableSet = new Set(IMPASSABLE.map(([a, b]) => undirectedKey(a, b)));

/** True if a red impassable border sits between these two areas. */
export function isImpassable(a: string, b: string): boolean {
  return impassableSet.has(undirectedKey(a, b));
}

/** Air zones that touch a given area. */
export function airZonesOf(id: string): readonly AirZone[] {
  return AIR_ZONES.filter((z) => z.areas.includes(id));
}

/** Breadth-first shortest path over passable ground edges. Returns null if unreachable. */
export function shortestGroundPath(from: string, to: string): string[] | null {
  if (!AREAS[from] || !AREAS[to]) throw new Error('Unknown area in path query');
  if (from === to) return [from];
  const prev = new Map<string, string>();
  const queue: string[] = [from];
  const seen = new Set<string>([from]);
  while (queue.length) {
    const cur = queue.shift()!;
    for (const nb of neighbors(cur)) {
      if (seen.has(nb)) continue;
      seen.add(nb);
      prev.set(nb, cur);
      if (nb === to) {
        const path = [to];
        let p = to;
        while (p !== from) {
          p = prev.get(p)!;
          path.push(p);
        }
        return path.reverse();
      }
      queue.push(nb);
    }
  }
  return null;
}
