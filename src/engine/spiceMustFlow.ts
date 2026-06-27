// The Spice Must Flow board: per-row dice/vehicle availability, imperium bans, and the solo
// spice-harvesting allocation. Data read off the physical SMF board (not in the rulebook PDF).
//
// Layout: 5 rows. Row 1 = top (imperium markers start here, highest step); row 5 = bottom (Imperium
// Ban). The "active row" is the row of the LOWEST imperium marker; the Harkonnen read their dice +
// vehicle counts off that row. Markers move per spice spent: 3 spice = raise (up), 2 = keep, 0 = drop.

import type { ImperiumPower, SpiceMustFlow } from './state';

export interface SmfRow {
  /** 1 (top, markers high) .. 5 (bottom, ban). */
  row: number;
  /** Harkonnen action dice available when this is the active row.
   *  User-confirmed: all 8 dice at the top row (no slot); the "Dice Set Aside" column sets aside
   *  1 die per row from row 2 down (rows 2-5 each have a slot), so available = 8 − (row − 1). */
  diceAvailable: number;
  harvesters: number;
  ornithopters: number;
  carryalls: number;
  /** The bottom row activates an imperium ban for any track whose marker reaches it. */
  banRow: boolean;
}

export const SMF_ROWS: readonly SmfRow[] = [
  { row: 1, diceAvailable: 8, harvesters: 3, ornithopters: 2, carryalls: 1, banRow: false },
  { row: 2, diceAvailable: 7, harvesters: 4, ornithopters: 2, carryalls: 1, banRow: false },
  { row: 3, diceAvailable: 6, harvesters: 5, ornithopters: 3, carryalls: 1, banRow: false },
  { row: 4, diceAvailable: 5, harvesters: 5, ornithopters: 4, carryalls: 2, banRow: false },
  { row: 5, diceAvailable: 4, harvesters: 6, ornithopters: 4, carryalls: 2, banRow: true },
];

export const TOP_ROW = 1;
export const BOTTOM_ROW = SMF_ROWS.length; // 5
/** Spice costs (from the board's spending key). */
export const KEEP_COST = 2;
export const RAISE_COST = 3;

const rowData = (row: number): SmfRow => SMF_ROWS[Math.min(Math.max(row, TOP_ROW), BOTTOM_ROW) - 1];

/** The active row = the row of the lowest imperium marker (largest row number). */
export function activeRow(markers: Record<ImperiumPower, number>): number {
  return Math.max(...Object.values(markers));
}

/** Dice + vehicle availability for the current marker positions (read off the active row). */
export function availability(markers: Record<ImperiumPower, number>): SmfRow {
  return rowData(activeRow(markers));
}

/** Imperium powers whose marker sits on the bottom (ban) row. */
export function activeBans(markers: Record<ImperiumPower, number>): ImperiumPower[] {
  return (Object.keys(markers) as ImperiumPower[]).filter((p) => markers[p] >= BOTTOM_ROW);
}

// ---------------------------------------------------------------------------
// Spice harvesting (Mahdi solo)
// ---------------------------------------------------------------------------

/** Spice a surviving harvester collects: 2 on deep desert, 1 on (shallow) desert. */
export function harvesterSpice(deep: boolean): number {
  return deep ? 2 : 1;
}

export interface SpiceOutcome {
  markers: Record<ImperiumPower, number>;
  /** Supremacy points gained (the all-markers-at-top, 7+ spice case). */
  supremacyGained: number;
  /** Spice carried over (max 1). */
  reserve: 0 | 1;
  /** Powers whose marker is on the ban row after harvesting. */
  activeBans: ImperiumPower[];
}

/**
 * Allocate harvested spice for the solo Harkonnen (fan summary p9):
 *   1. Always spend (collected + reserve) to prevent markers from decreasing, lowermost first
 *      (keep = 2 each). Unkept markers drop 1 step.
 *   2. If more than enough to keep all, raise the lowermost markers (3 each, max 1 step each).
 *   3. If all markers are already at the top and there is 7+ spice, score 1 supremacy instead.
 *   4. No stockpiling. Up to 1 leftover spice goes to the reserve.
 * Markers are clamped to [top, bottom].
 */
export function resolveSpiceHarvesting(
  markers: Record<ImperiumPower, number>,
  collectedSpice: number,
  reserve: 0 | 1 = 0,
): SpiceOutcome {
  const m = { ...markers };
  const powers = Object.keys(m) as ImperiumPower[];
  // Lowermost first = largest row number first.
  const lowmostFirst = [...powers].sort((a, b) => m[b] - m[a]);
  let spice = collectedSpice + reserve;
  let supremacy = 0;

  const keepAllCost = KEEP_COST * powers.length;
  if (spice >= keepAllCost) {
    spice -= keepAllCost; // keep all markers in place
    const allTop = powers.every((p) => m[p] === TOP_ROW);
    // Raise lowermost markers one step each while affordable.
    for (const p of lowmostFirst) {
      if (m[p] > TOP_ROW && spice >= RAISE_COST) {
        m[p] -= 1;
        spice -= RAISE_COST;
      }
    }
    if (allTop && spice >= 1) {
      supremacy = 1; // can't raise above the top → convert the surplus to 1 supremacy
      spice -= 1;
    }
  } else {
    // Not enough to keep all: keep the lowermost first; the rest drop a step.
    for (const p of lowmostFirst) {
      if (spice >= KEEP_COST) spice -= KEEP_COST;
      else m[p] = Math.min(BOTTOM_ROW, m[p] + 1);
    }
  }

  const newReserve: 0 | 1 = spice >= 1 ? 1 : 0;
  return { markers: m, supremacyGained: supremacy, reserve: newReserve, activeBans: activeBans(m) };
}

/** Convenience: total spice from a set of surviving harvesters, given each area's deep flag. */
export function totalHarvesterSpice(harvesters: { deep: boolean }[]): number {
  return harvesters.reduce((n, h) => n + harvesterSpice(h.deep), 0);
}

/** Sync a SpiceMustFlow state's `activeBans` to its marker positions. */
export function withUpdatedBans(smf: SpiceMustFlow): SpiceMustFlow {
  return { ...smf, activeBans: activeBans(smf.markers) };
}
