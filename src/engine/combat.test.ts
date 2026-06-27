import { describe, it, expect } from 'vitest';
import {
  combatDiceCount,
  harkonnenShouldContinueAttack,
  applyHarkonnenHits,
  MAX_COMBAT_DICE,
} from './combat';
import { emptyLegion, type Legion, type Leader } from './state';

const gen: Leader = { kind: 'generic', faction: 'harkonnen' };
const named = (name: string): Leader => ({ kind: 'named', faction: 'harkonnen', name });

function leg(over: Partial<Legion>): Legion {
  return { ...emptyLegion('harkonnen', 'carthag'), ...over };
}

describe('combatDiceCount', () => {
  it('= units + discards + defender settlement rank, capped at 6', () => {
    expect(combatDiceCount(3)).toBe(3);
    expect(combatDiceCount(3, { discards: 2 })).toBe(5);
    expect(combatDiceCount(2, { defendingSettlementRank: 3 })).toBe(5);
    expect(combatDiceCount(5, { discards: 4 })).toBe(MAX_COMBAT_DICE); // capped
  });
});

describe('harkonnenShouldContinueAttack', () => {
  it('continues while fine power > half the opponent', () => {
    const strong = leg({ units: { regular: 3, elite: 0, special_elite: 0 } }); // fine 6
    const weak = leg({ faction: 'atreides', area: 'sihaya_ridge', units: { regular: 1, elite: 0, special_elite: 0 } }); // fine 2
    expect(harkonnenShouldContinueAttack(strong, weak)).toBe(true); // 6 > 1
  });

  it('ceases when fine power <= half the opponent', () => {
    const h = leg({ units: { regular: 1, elite: 0, special_elite: 0 } }); // fine 2
    const a = leg({ faction: 'atreides', area: 'sihaya_ridge', units: { regular: 2, elite: 0, special_elite: 0 } }); // fine 4
    expect(harkonnenShouldContinueAttack(h, a)).toBe(false); // 2 <= 2
  });
});

describe('applyHarkonnenHits', () => {
  it('sheds extra leaders (Bashar first), keeping a named leader', () => {
    const l = leg({ units: { regular: 2, elite: 0, special_elite: 0 }, leaders: [gen, named('Rabban'), gen] });
    const { legion, casualties } = applyHarkonnenHits(l, 2);
    expect(legion.leaders).toHaveLength(1);
    expect(legion.leaders[0]).toEqual(named('Rabban'));
    expect(casualties.genericLeaders).toBe(2);
    expect(legion.units.regular).toBe(2); // units untouched
  });

  it('downgrades elite then special_elite to regular before removing regulars', () => {
    const l = leg({ units: { regular: 1, elite: 1, special_elite: 1 } });
    const { legion } = applyHarkonnenHits(l, 2);
    // hit1: elite->regular ; hit2: special_elite->regular
    expect(legion.units).toEqual({ regular: 3, elite: 0, special_elite: 0 });
  });

  it('removes a regular when more than one remains', () => {
    const l = leg({ units: { regular: 3, elite: 0, special_elite: 0 } });
    const { legion, casualties } = applyHarkonnenHits(l, 1);
    expect(legion.units.regular).toBe(2);
    expect(casualties.units).toBe(1);
  });

  it('eliminates the leader instead of the last regular', () => {
    const l = leg({ units: { regular: 1, elite: 0, special_elite: 0 }, leaders: [named('Feyd')] });
    const { legion, casualties } = applyHarkonnenHits(l, 1);
    expect(legion.units.regular).toBe(1); // regular kept
    expect(legion.leaders).toHaveLength(0); // leader taken instead
    expect(casualties.namedLeaders).toBe(1);
  });

  it('removes surviving leaders once all units are gone (named -> regen)', () => {
    const l = leg({ units: { regular: 1, elite: 0, special_elite: 0 }, leaders: [named('Feyd')] });
    const { legion, casualties } = applyHarkonnenHits(l, 2);
    // hit1: leader taken (would clear last regular); hit2: removes the regular -> 0 units
    expect(legion.units.regular).toBe(0);
    expect(legion.leaders).toHaveLength(0);
    expect(casualties.units).toBe(1);
    expect(casualties.namedLeaders).toBe(1);
  });

  it('does not over-remove when hits exceed the legion', () => {
    const l = leg({ units: { regular: 1, elite: 0, special_elite: 0 } });
    const { legion } = applyHarkonnenHits(l, 10);
    expect(legion.units.regular).toBe(0);
    expect(legion.leaders).toHaveLength(0);
  });
});
