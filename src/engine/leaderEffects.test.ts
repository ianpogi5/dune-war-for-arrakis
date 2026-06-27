import { describe, it, expect } from 'vitest';
import { resolveLeaderSpecial, hasLeaderEncoding, NAMED_LEADER_NAMES } from './leaderEffects';
import { applyEffectSteps } from './effectSteps';
import { sampleState } from '../ui/sampleState';
import { NAMED_LEADERS } from './leaders';

describe('resolveLeaderSpecial', () => {
  it('returns null for an unknown leader', () => {
    expect(resolveLeaderSpecial('Duncan Idaho', sampleState())).toBeNull();
  });

  it('has a structured encoding for every named leader', () => {
    const s = sampleState();
    for (const l of NAMED_LEADERS) {
      expect(hasLeaderEncoding(l.name)).toBe(true);
      const r = resolveLeaderSpecial(l.name, s)!;
      expect(r.steps.length).toBeGreaterThan(0);
      expect(r.steps.every((st) => st.text.length > 0)).toBe(true);
      expect(() => applyEffectSteps(s, r.steps)).not.toThrow();
    }
  });

  it("auto-draws for Thufir Hawat's special (3 House Harkonnen cards)", () => {
    const s = sampleState();
    const r = resolveLeaderSpecial('Thufir Hawat', s)!;
    expect(r.steps[0].auto).toBe(true);
    const next = applyEffectSteps(s, r.steps);
    expect(next.decks.planning.house_harkonnen).toBe(s.decks.planning.house_harkonnen - 3);
  });

  it('leaves move/attack specials player-resolved (no state change)', () => {
    const s = sampleState();
    const r = resolveLeaderSpecial('Feyd-Rautha', s)!;
    expect(r.steps.every((st) => !st.auto)).toBe(true);
    expect(applyEffectSteps(s, r.steps)).toEqual(s);
  });

  it('exposes all named-leader names', () => {
    expect(NAMED_LEADER_NAMES).toContain('Beast Rabban');
    expect(NAMED_LEADER_NAMES.length).toBe(NAMED_LEADERS.length);
  });
});
