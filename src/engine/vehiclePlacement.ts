// Harkonnen vehicle placement (round phase 1), Mahdi solo. Pure & deterministic.
//
// Source: rulebook p38 + fan summary p9. Harvesters fill the round's harvesting sector by a
// 4-tier priority; carryalls protect the most harvesters; ornithopters threaten sietches and
// cover the target sector. This module covers HARVESTERS first (the intricate part); carryalls
// and ornithopters follow.

import { AREAS, ADJACENCY, type SectorId } from './board';
import type { GameState, TacticalSector } from './state';

const CENTRAL: SectorId[] = ['s5', 's6', 's7', 's8'];

/** Areas belonging to a tactical-sector selection ('central' = all 4 central sectors). */
export function areasInSector(sel: TacticalSector): string[] {
  const inSel = (s: SectorId) => (sel === 'central' ? CENTRAL.includes(s) : s === sel);
  return Object.values(AREAS)
    .filter((a) => inSel(a.sector))
    .map((a) => a.id);
}

/** Sectors ground-adjacent to a selection (some area in one borders an area in the other). */
export function sectorsAdjacentTo(sel: TacticalSector): SectorId[] {
  const selSectors = new Set<SectorId>(sel === 'central' ? CENTRAL : [sel]);
  const out = new Set<SectorId>();
  for (const a of Object.keys(ADJACENCY)) {
    if (!selSectors.has(AREAS[a].sector)) continue;
    for (const n of ADJACENCY[a]) {
      const ns = AREAS[n].sector;
      if (!selSectors.has(ns) && ns !== 'np') out.add(ns);
    }
  }
  return [...out];
}

// --- area predicates -------------------------------------------------------

interface PlacementCtx {
  atreidesAreas: Set<string>; // areas with an Atreides legion
  sietchAreas: Set<string>; // live sietch areas (Atreides settlements)
  sandwormAreas: Set<string>;
  occupied: Set<string>; // any figure/token present (for "empty")
}

function buildCtx(s: GameState): PlacementCtx {
  const atreidesAreas = new Set(s.legions.filter((l) => l.faction === 'atreides').map((l) => l.area));
  const sietchAreas = new Set(s.sietches.filter((si) => !si.destroyed).map((si) => si.area));
  const sandwormAreas = new Set(s.sandworms.map((w) => w.area));
  const occupied = new Set<string>();
  for (const l of s.legions) occupied.add(l.area);
  for (const v of s.vehicles) occupied.add(v.location);
  for (const w of s.wormsigns) occupied.add(w.area);
  for (const w of s.sandworms) occupied.add(w.area);
  for (const st of s.settlements) if (!st.destroyed) occupied.add(st.area);
  for (const si of s.sietches) if (!si.destroyed) occupied.add(si.area);
  for (const t of s.testingStations) occupied.add(t.area);
  return { atreidesAreas, sietchAreas, sandwormAreas, occupied };
}

const isDesert = (a: string) => AREAS[a].terrain === 'desert';
const isDeep = (a: string) => AREAS[a].deep === true;

/** Free for the Harkonnen: no Atreides legion, no sietch, no sandworm. */
function isFree(ctx: PlacementCtx, a: string): boolean {
  return !ctx.atreidesAreas.has(a) && !ctx.sietchAreas.has(a) && !ctx.sandwormAreas.has(a);
}

/** Empty: nothing of any kind present. */
function isEmpty(ctx: PlacementCtx, a: string): boolean {
  return !ctx.occupied.has(a);
}

/** Adjacent (normal ground) to an Atreides legion or a sietch. */
function adjacentToAtreides(ctx: PlacementCtx, a: string): boolean {
  return (ADJACENCY[a] ?? []).some((n) => ctx.atreidesAreas.has(n) || ctx.sietchAreas.has(n));
}

// --- harvester placement ---------------------------------------------------

/**
 * Decide where the Harkonnen place `count` harvesters. Harvesters go in desert areas of the
 * harvesting sector by priority:
 *   1. empty deep desert not adjacent to an Atreides legion/sietch
 *   2. empty desert not adjacent to an Atreides legion/sietch
 *   3. remaining free deep desert
 *   4. remaining free desert
 * 1 per area. If the harvesting sector runs out, overflow into an adjacent sector (never the
 * target sietch's sector), same priority. Returns the chosen area ids in placement order.
 */
export function placeHarvesters(s: GameState, count: number): string[] {
  if (count <= 0 || !s.harvestingSector) return [];
  const ctx = buildCtx(s);
  const placed: string[] = [];
  const used = new Set<string>();

  const tiers = (areas: string[]): string[][] => {
    const desert = areas.filter(isDesert);
    return [
      desert.filter((a) => isDeep(a) && isEmpty(ctx, a) && !adjacentToAtreides(ctx, a)),
      desert.filter((a) => !isDeep(a) && isEmpty(ctx, a) && !adjacentToAtreides(ctx, a)),
      desert.filter((a) => isDeep(a) && isFree(ctx, a)),
      desert.filter((a) => !isDeep(a) && isFree(ctx, a)),
    ];
  };

  const fillFrom = (areas: string[]) => {
    for (const tier of tiers(areas)) {
      for (const a of tier.sort()) {
        if (placed.length >= count) return;
        if (used.has(a)) continue;
        used.add(a);
        placed.push(a);
      }
    }
  };

  fillFrom(areasInSector(s.harvestingSector));
  if (placed.length < count) {
    const targetSector = s.targetSietchId ? AREAS[s.targetSietchId].sector : null;
    const overflow = sectorsAdjacentTo(s.harvestingSector)
      .filter((sec) => sec !== targetSector)
      .flatMap((sec) => areasInSector(sec));
    fillFrom(overflow);
  }
  return placed;
}
