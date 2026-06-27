// Harkonnen combat resolution (deterministic parts): casualty application, dice count, and
// the "cease attack" rule. Dice *rolling* (random faces) is injected by the caller.
//
// Source: rulebook Battles / Remove Casualties (p25-26) + fan summary p9 Harkonnen combat
// criteria. Combat operates on revealed legions — Harkonnen deployment tokens are flipped to
// units at the start of a battle, so a legion in combat has deploymentTokens === 0.

import type { Legion, Leader, UnitType } from './state';
import { fineCombatPower } from './combatPower';

/** Max combat dice a legion can ever roll. */
export const MAX_COMBAT_DICE = 6;

/**
 * Combat dice rolled = units in the legion + planning cards discarded this round, plus the
 * defending settlement's rank when defending in a settlement. Never exceeds 6.
 * (Deployment tokens are revealed to units before combat, so they're included via `units`.)
 */
export function combatDiceCount(
  unitsInLegion: number,
  opts: { discards?: number; defendingSettlementRank?: number } = {},
): number {
  const n = unitsInLegion + (opts.discards ?? 0) + (opts.defendingSettlementRank ?? 0);
  return Math.min(MAX_COMBAT_DICE, Math.max(0, n));
}

/**
 * The Harkonnen cease attacking only when, at the start of a combat round, their combat power
 * is ≤ half the opponent's (individual-unit / fine combat power). They never retreat.
 * Returns true if the Harkonnen should keep attacking.
 */
export function harkonnenShouldContinueAttack(harkonnen: Legion, opponent: Legion): boolean {
  return fineCombatPower(harkonnen) > fineCombatPower(opponent) / 2;
}

export interface Casualties {
  /** Regular/elite/special-elite figures removed (return to deployment pool). */
  units: number;
  /** Generic leaders removed (return to pool). */
  genericLeaders: number;
  /** Named leaders removed (go to the regeneration tank). */
  namedLeaders: number;
}

function cloneLegion(l: Legion): Legion {
  return { ...l, units: { ...l.units }, leaders: l.leaders.map((x) => ({ ...x })) };
}

function totalUnits(units: Record<UnitType, number>): number {
  return units.regular + units.elite + units.special_elite;
}

/** Remove one leader, preferring generic (Bashar) so a named leader is kept last. */
function removeOneLeader(leaders: Leader[], cas: Casualties): void {
  const genericIdx = leaders.findIndex((l) => l.kind === 'generic');
  const idx = genericIdx >= 0 ? genericIdx : 0;
  const [removed] = leaders.splice(idx, 1);
  if (removed.kind === 'named') cas.namedLeaders++;
  else cas.genericLeaders++;
}

/**
 * Apply `hits` to a Harkonnen legion following the solo casualty priority, one hit at a time:
 *   1. Eliminate extra leaders (Bashar first) until only 1 leader remains (named if possible).
 *   2. Replace an elite unit with a regular unit.
 *   3. Replace a Sardaukar (special elite) unit with a regular unit.
 *   4. Eliminate a regular unit — but if a leader still remains and this hit would remove the
 *      last regular, eliminate that leader instead.
 * If all units are eliminated, any surviving leaders are also removed.
 * Returns the resulting legion and the casualties taken.
 */
export function applyHarkonnenHits(legion: Legion, hits: number): { legion: Legion; casualties: Casualties } {
  const l = cloneLegion(legion);
  const cas: Casualties = { units: 0, genericLeaders: 0, namedLeaders: 0 };

  for (let h = 0; h < hits; h++) {
    if (totalUnits(l.units) === 0 && l.leaders.length === 0) break; // nothing left

    if (l.leaders.length > 1) {
      removeOneLeader(l.leaders, cas); // 1. shed extra leaders
    } else if (l.units.elite > 0) {
      l.units.elite--; // 2. elite -> regular
      l.units.regular++;
    } else if (l.units.special_elite > 0) {
      l.units.special_elite--; // 3. sardaukar -> regular
      l.units.regular++;
    } else if (l.units.regular > 0) {
      // 4. remove a regular, unless a leader remains and this would clear the last regular.
      if (l.leaders.length > 0 && l.units.regular === 1) {
        removeOneLeader(l.leaders, cas);
      } else {
        l.units.regular--;
        cas.units++;
      }
    } else if (l.leaders.length > 0) {
      removeOneLeader(l.leaders, cas); // only leaders left
    }
  }

  // If no units survive, remaining leaders are also removed.
  if (totalUnits(l.units) === 0 && l.leaders.length > 0) {
    while (l.leaders.length > 0) removeOneLeader(l.leaders, cas);
  }
  return { legion: l, casualties: cas };
}
