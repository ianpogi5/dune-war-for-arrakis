import { describe, it, expect } from 'vitest';
import {
  SMF_ROWS,
  activeRow,
  availability,
  activeBans,
  harvesterSpice,
  totalHarvesterSpice,
  resolveSpiceHarvesting,
  BOTTOM_ROW,
} from './spiceMustFlow';
import type { ImperiumPower } from './state';

const M = (choam: number, spacing_guild: number, landsraad: number): Record<ImperiumPower, number> => ({
  choam,
  spacing_guild,
  landsraad,
});

describe('SMF board data', () => {
  it('has 5 rows; only the bottom is the ban row', () => {
    expect(SMF_ROWS).toHaveLength(5);
    expect(SMF_ROWS.filter((r) => r.banRow).map((r) => r.row)).toEqual([5]);
  });

  it('vehicle counts match the board', () => {
    expect(SMF_ROWS.map((r) => r.harvesters)).toEqual([3, 4, 5, 5, 6]);
    expect(SMF_ROWS.map((r) => r.ornithopters)).toEqual([2, 2, 3, 4, 4]);
    expect(SMF_ROWS.map((r) => r.carryalls)).toEqual([1, 1, 1, 2, 2]);
  });
});

describe('active row & availability', () => {
  it('active row is the lowest marker (largest row number)', () => {
    expect(activeRow(M(1, 3, 2))).toBe(3);
    expect(activeRow(M(1, 1, 1))).toBe(1);
  });

  it('availability reads off the active row', () => {
    const a = availability(M(1, 5, 2)); // lowest at row 5
    expect(a.harvesters).toBe(6);
    expect(a.carryalls).toBe(2);
  });

  it('reports bans for markers on the bottom row', () => {
    expect(activeBans(M(5, 1, 5))).toEqual(['choam', 'landsraad']);
    expect(activeBans(M(1, 2, 3))).toEqual([]);
  });
});

describe('harvester spice', () => {
  it('deep desert 2, desert 1', () => {
    expect(harvesterSpice(true)).toBe(2);
    expect(harvesterSpice(false)).toBe(1);
    expect(totalHarvesterSpice([{ deep: true }, { deep: false }, { deep: true }])).toBe(5);
  });
});

describe('resolveSpiceHarvesting', () => {
  it('keeps all markers when spice exactly covers it (6)', () => {
    const out = resolveSpiceHarvesting(M(2, 3, 4), 6);
    expect(out.markers).toEqual(M(2, 3, 4)); // unchanged
    expect(out.reserve).toBe(0);
    expect(out.supremacyGained).toBe(0);
  });

  it('drops unkept markers (lowermost kept first) when spice is short', () => {
    // 2 spice keeps only the single lowermost marker; the other two drop a step.
    const out = resolveSpiceHarvesting(M(2, 3, 4), 2);
    expect(out.markers.landsraad).toBe(4); // lowest, kept
    expect(out.markers.spacing_guild).toBe(4); // dropped 3 -> 4
    expect(out.markers.choam).toBe(3); // dropped 2 -> 3
  });

  it('raises lowermost markers with surplus after keeping all', () => {
    // keep all = 6; surplus 3 raises the lowermost one step.
    const out = resolveSpiceHarvesting(M(2, 3, 4), 9);
    expect(out.markers.landsraad).toBe(3); // 4 -> 3 raised
    expect(out.markers.choam).toBe(2);
    expect(out.markers.spacing_guild).toBe(3);
  });

  it('reserves 1 leftover spice', () => {
    const out = resolveSpiceHarvesting(M(1, 1, 2), 7); // keep all 6, 1 left (can raise landsraad? costs 3, can't) -> reserve 1
    expect(out.reserve).toBe(1);
  });

  it('scores 1 supremacy when all markers are at the top with 7+ spice', () => {
    const out = resolveSpiceHarvesting(M(1, 1, 1), 7);
    expect(out.supremacyGained).toBe(1);
    expect(out.markers).toEqual(M(1, 1, 1));
  });

  it('spends the existing reserve too', () => {
    // 5 collected + 1 reserve = 6 -> keeps all
    const out = resolveSpiceHarvesting(M(2, 2, 2), 5, 1);
    expect(out.markers).toEqual(M(2, 2, 2));
  });

  it('flags bans when a marker is forced onto the bottom row', () => {
    const out = resolveSpiceHarvesting(M(4, 4, 4), 0); // nothing kept -> all drop to 5
    expect(out.markers).toEqual(M(BOTTOM_ROW, BOTTOM_ROW, BOTTOM_ROW));
    expect(out.activeBans.sort()).toEqual(['choam', 'landsraad', 'spacing_guild']);
  });
});
