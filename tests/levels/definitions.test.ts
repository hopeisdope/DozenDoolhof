import { describe, expect, it } from 'vitest';
import { createGame, isGameSolved, move } from '../../src/engine/history';
import { LEVEL_DEFINITIONS, LEVELS, TIERS } from '../../src/levels/definitions';
import { parseLevel } from '../../src/levels/parser';
import { parseSolution } from '../../src/levels/solution';
import { solve } from '../../src/solver/solver';

/** All eight rotations/mirrors of a map, as text, to spot duplicate puzzles. */
function symmetries(map: string): string[] {
  let grid = map
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .map((line) => [...line]);
  const width = Math.max(...grid.map((row) => row.length));
  grid = grid.map((row) => [...row, ...Array<string>(width - row.length).fill(' ')]);
  const rotate = (g: string[][]) => g[0]!.map((_, x) => g.map((row) => row[x]!).reverse());
  const forms: string[] = [];
  let current = grid;
  for (let i = 0; i < 4; i++) {
    forms.push(current.map((row) => row.join('')).join('\n'));
    forms.push(current.map((row) => [...row].reverse().join('')).join('\n'));
    current = rotate(current);
  }
  return forms;
}

describe('tier structure', () => {
  it('has three tiers, Makkelijk, Gemiddeld and Moeilijk, of twenty levels each', () => {
    expect(TIERS.map((tier) => [tier.id, tier.name, tier.stars, tier.levels.length])).toEqual([
      ['easy', 'Makkelijk', 1, 20],
      ['medium', 'Gemiddeld', 2, 20],
      ['hard', 'Moeilijk', 3, 20],
    ]);
    expect(LEVELS).toHaveLength(60);
  });

  it('uses unique ids and names', () => {
    expect(new Set(LEVEL_DEFINITIONS.map((d) => d.id)).size).toBe(60);
    expect(new Set(LEVEL_DEFINITIONS.map((d) => d.name)).size).toBe(60);
  });

  it('contains no duplicate puzzles, also not rotated or mirrored', () => {
    const seen = new Map<string, string>();
    for (const definition of LEVEL_DEFINITIONS) {
      for (const form of symmetries(definition.map)) {
        expect(seen.get(form), `${definition.id} duplicates ${seen.get(form)}`).toBeUndefined();
      }
      seen.set(symmetries(definition.map)[0]!, definition.id);
    }
  });

  it('keeps boards small enough for a phone (at most 10×10)', () => {
    for (const level of LEVELS) {
      expect(level.width, level.id).toBeLessThanOrEqual(10);
      expect(level.height, level.id).toBeLessThanOrEqual(10);
    }
  });

  it('keeps Makkelijk to one or two boxes and Gemiddeld to at most two', () => {
    const [easy, medium] = TIERS;
    for (const level of easy!.levels) expect(level.start.boxes.length).toBeLessThanOrEqual(2);
    for (const level of medium!.levels) expect(level.start.boxes.length).toBeLessThanOrEqual(2);
  });

  it('gets harder from tier to tier (median search effort of the solver)', () => {
    const median = (values: number[]) => values.sort((a, b) => a - b)[values.length >> 1]!;
    const effort = TIERS.map((tier) => median(tier.levels.map((level) => solve(level)!.explored)));
    expect(effort[0]).toBeLessThan(effort[1]!);
    expect(effort[1]).toBeLessThan(effort[2]!);
  });
});

describe.each(LEVEL_DEFINITIONS.map((definition) => [definition.id, definition] as const))(
  '%s',
  (_id, definition) => {
    const level = parseLevel(definition.map, definition);

    it('parses with as many boxes as goals', () => {
      expect(level.start.boxes.length).toBe(level.goals.length);
      expect(level.goals.length).toBeGreaterThan(0);
    });

    it('is solved by its stored solution, with every step legal', () => {
      let game = createGame(level);
      for (const [step, { direction, push }] of parseSolution(definition.solution).entries()) {
        expect(isGameSolved(game), `solved too early at step ${step + 1}`).toBe(false);
        const next = move(game, direction);
        expect(next, `step ${step + 1} (${direction}) is blocked`).not.toBe(game);
        expect(next.state.pushes - game.state.pushes, `push flag at step ${step + 1}`).toBe(
          push ? 1 : 0,
        );
        game = next;
      }
      expect(isGameSolved(game)).toBe(true);
    });

    it('is solvable according to the solver, in no more pushes than stored', () => {
      const result = solve(level);
      expect(result).not.toBeNull();
      const storedPushes = parseSolution(definition.solution).filter((s) => s.push).length;
      expect(result!.pushes).toBeLessThanOrEqual(storedPushes);
    });
  },
);

describe('parseSolution', () => {
  it('maps LURD letters to directions and pushes', () => {
    expect(parseSolution('uRdL')).toEqual([
      { direction: 'up', push: false },
      { direction: 'right', push: true },
      { direction: 'down', push: false },
      { direction: 'left', push: true },
    ]);
  });

  it('rejects other characters', () => {
    expect(() => parseSolution('ux')).toThrow('Invalid LURD character "x" at position 2');
  });
});
