// Shared area-label helper used by both the engine (card effects) and the UI.
//
// Named areas show their proper name. Unnamed areas (the 73 `sX_n` deserts/ergs/etc.) used to show
// only their opaque id, which players can't find on the board. Instead we describe each by its
// terrain and the named landmark(s) it touches ("Deep desert by Gara Kulon") — players read those
// off the physical board. Where several unnamed areas ring the same landmark and would collide, we
// append the id as a disambiguator so dropdown options stay distinct.

import { AREAS, ADJACENCY, AIR_ZONES } from './board';
import type { Area } from './board';

function terrainWord(a: Area): string {
  if (a.deep) return 'Deep desert';
  switch (a.terrain) {
    case 'desert':
      return 'Desert';
    case 'minor_erg':
      return 'Minor erg';
    case 'plateau':
      return 'Plateau';
    case 'mountain':
      return 'Mountain';
    default:
      return 'Area';
  }
}

const isNamed = (id: string): boolean => !!AREAS[id]?.name;

/** Nearest named areas to `id`: adjacent ones if any, else the closest via BFS. `dist` is hops. */
function nearestNamed(id: string): { dist: number; names: string[] } {
  const seen = new Set<string>([id]);
  let frontier = [id];
  let dist = 0;
  while (frontier.length) {
    dist++;
    const next: string[] = [];
    const found: string[] = [];
    for (const cur of frontier) {
      for (const nb of ADJACENCY[cur] ?? []) {
        if (seen.has(nb)) continue;
        seen.add(nb);
        if (isNamed(nb)) found.push(AREAS[nb].name as string);
        next.push(nb);
      }
    }
    if (found.length) return { dist, names: found.sort() };
    frontier = next;
  }
  return { dist: 0, names: [] };
}

function baseLabel(id: string): string {
  const a = AREAS[id];
  const terrain = terrainWord(a);
  const { dist, names } = nearestNamed(id);
  if (!names.length) return `${terrain} (${a.sector})`;
  const where = dist === 1 ? 'by' : 'near';
  return `${terrain} ${where} ${names.slice(0, 2).join(' & ')}`;
}

// Precompute labels once: build descriptive labels, then add the id to any that collide.
const LABELS: Record<string, string> = (() => {
  const out: Record<string, string> = {};
  const base: Record<string, string> = {};
  const counts: Record<string, number> = {};
  for (const id of Object.keys(AREAS)) {
    if (isNamed(id)) continue;
    const b = baseLabel(id);
    base[id] = b;
    counts[b] = (counts[b] ?? 0) + 1;
  }
  for (const id of Object.keys(base)) {
    out[id] = counts[base[id]] > 1 ? `${base[id]} · ${id}` : base[id];
  }
  return out;
})();

/** Display label for an area: its proper name, or a locating description for unnamed areas. */
export function areaLabel(id: string): string {
  const a = AREAS[id];
  if (!a) return id;
  return a.name ?? LABELS[id] ?? id;
}

/**
 * Human label for an air zone (carryall/ornithopter location) — named after the areas it covers,
 * so "az3" reads as e.g. "Air zone over Hagga Basin & …". Falls back to the id if unknown.
 */
export function airZoneLabel(id: string): string {
  const az = AIR_ZONES.find((z) => z.id === id);
  if (!az) return id;
  const named = [...new Set(az.areas.filter((a) => AREAS[a]?.name).map((a) => AREAS[a].name as string))];
  if (named.length) return `Air zone over ${named.slice(0, 3).join(' & ')}`;
  // No named member — anchor to the nearby named landmarks instead.
  const landmarks: string[] = [];
  for (const a of az.areas) {
    for (const n of nearestNamed(a).names) if (!landmarks.includes(n)) landmarks.push(n);
  }
  return landmarks.length ? `Air zone near ${landmarks.slice(0, 2).join(' & ')}` : id;
}

/**
 * Desert (incl. Deep Desert) areas — the only places wormsigns and sandworms may be (rulebook:
 * wormsigns go "1 in each Desert Area"; sandworms move "up to 2 Desert Areas"). Deep Desert is a
 * Desert subtype, so `terrain === 'desert'` covers both; Mountain/Plateau/Minor Erg are excluded.
 */
export function isDesertArea(id: string): boolean {
  return AREAS[id]?.terrain === 'desert';
}
