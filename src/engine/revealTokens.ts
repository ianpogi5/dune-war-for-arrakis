// Revealing deployment tokens at the start of a battle.
//
// Rulebook (Battle Rounds Sequence, p24): "flip any Deployment tokens involved in the battle,
// replacing them with the corresponding Units." A token is facedown until it fights — its hidden
// side shows the units it stands for, which only the player can read off the physical token, so the
// caller supplies the revealed composition.
//
// This closes a correctness gap: combat.ts only ever removes units/leaders as casualties (never
// deployment tokens), so a legion that entered a battle with tokens still on it could never be
// ground down. Tokens must therefore become units before `beginBattle`.
//
// Harkonnen marker tokens return to the solo pool when revealed (p42: "Revealed Deployment tokens
// are shuffled back in the pool"). Atreides tokens are removed from the game (p18), so no pool is
// credited for them.

import type { GameState, Legion, UnitType } from './state';

export const HARKONNEN_TOKEN_POOL = 12; // the two sets of Harkonnen Starting Deployment tokens

/**
 * Reveal a legion's deployment tokens, replacing them with `revealed` units. Returns a new state
 * with that legion's `deploymentTokens` cleared and its units increased; for the Harkonnen, the
 * freed token markers return to the reserve pool (capped at the pool size). A no-op if the legion
 * has no tokens (or isn't found).
 */
export function revealDeploymentTokens(
  s: GameState,
  area: string,
  faction: Legion['faction'],
  revealed: Record<UnitType, number>,
): GameState {
  const target = s.legions.find((l) => l.faction === faction && l.area === area);
  if (!target || target.deploymentTokens === 0) return s;

  const legions = s.legions.map((l) =>
    l === target
      ? {
          ...l,
          deploymentTokens: 0,
          units: {
            regular: l.units.regular + revealed.regular,
            elite: l.units.elite + revealed.elite,
            special_elite: l.units.special_elite + revealed.special_elite,
          },
        }
      : l,
  );

  let harkonnenReserve = s.harkonnenReserve;
  if (faction === 'harkonnen') {
    harkonnenReserve = {
      ...harkonnenReserve,
      deploymentTokens: Math.min(
        HARKONNEN_TOKEN_POOL,
        harkonnenReserve.deploymentTokens + target.deploymentTokens,
      ),
    };
  }

  return { ...s, legions, harkonnenReserve };
}
