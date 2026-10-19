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

/** A LURD solution in all eight orientations, to spot the same puzzle in another room. */
function solutionForms(solution: string): string[] {
  const rotate: Record<string, string> = { u: 'r', r: 'd', d: 'l', l: 'u' };
  const mirror: Record<string, string> = { u: 'u', d: 'd', l: 'r', r: 'l' };
  const map = (text: string, table: Record<string, string>) =>
    [...text]
      .map((c) => (c === c.toUpperCase() ? table[c.toLowerCase()]!.toUpperCase() : table[c]!))
      .join('');
  const forms: string[] = [];
  for (let current of [solution, map(solution, mirror)]) {
    for (let i = 0; i < 4; i++) {
      forms.push(current);
      current = map(current, rotate);
    }
  }
  return forms;
}

const median = (values: number[]) => [...values].sort((a, b) => a - b)[values.length >> 1]!;
const effort = new Map(LEVELS.map((level) => [level.id, solve(level)!.explored]));

describe('tier structure', () => {
  it('has three tiers, Makkelijk, Gemiddeld and Moeilijk, of forty levels each', () => {
    expect(TIERS.map((tier) => [tier.id, tier.name, tier.stars, tier.levels.length])).toEqual([
      ['easy', 'Makkelijk', 1, 40],
      ['medium', 'Gemiddeld', 2, 40],
      ['hard', 'Moeilijk', 3, 40],
    ]);
    expect(LEVELS).toHaveLength(120);
  });

  it('uses unique ids and names', () => {
    expect(new Set(LEVEL_DEFINITIONS.map((d) => d.id)).size).toBe(120);
    expect(new Set(LEVEL_DEFINITIONS.map((d) => d.name)).size).toBe(120);
  });

  it('gives every tier the stable ids <tier>-01 to <tier>-40', () => {
    for (const tier of TIERS) {
      const expected = Array.from(
        { length: 40 },
        (_, i) => `${tier.id}-${String(i + 1).padStart(2, '0')}`,
      );
      expect([...tier.definitions.map((d) => d.id)].sort(), tier.id).toEqual(expected);
    }
  });

  it('keeps the first level of each tier in place', () => {
    expect(TIERS.map((tier) => tier.definitions[0]!.id)).toEqual([
      'easy-01',
      'medium-01',
      'hard-01',
    ]);
  });

  it('contains no puzzle that is solved by the same moves as another, also rotated or mirrored', () => {
    // easy-10 and easy-14 predate this check; they are kept so their ids stay valid.
    const known = new Set(['easy-10', 'easy-14']);
    const seen = new Map<string, string>();
    for (const definition of LEVEL_DEFINITIONS) {
      const forms = solutionForms(definition.solution);
      const other = forms.map((form) => seen.get(form)).find((id) => id !== undefined);
      if (!(other && known.has(other) && known.has(definition.id))) {
        expect(other, `${definition.id} is solved like ${other}`).toBeUndefined();
      }
      seen.set(forms[0]!, definition.id);
    }
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

  it('keeps Makkelijk to one or two boxes, Gemiddeld to at most two, Moeilijk to two to four', () => {
    const [easy, medium, hard] = TIERS;
    const boxes = (level: (typeof LEVELS)[number]) => level.start.boxes.length;
    for (const level of easy!.levels) expect(boxes(level), level.id).toBeLessThanOrEqual(2);
    for (const level of medium!.levels) expect(boxes(level), level.id).toBeLessThanOrEqual(2);
    for (const level of hard!.levels) {
      expect(boxes(level), level.id).toBeGreaterThanOrEqual(2);
      expect(boxes(level), level.id).toBeLessThanOrEqual(4);
    }
    // Mostly one box in Makkelijk; mostly three in Moeilijk.
    expect(easy!.levels.filter((level) => boxes(level) === 1).length).toBeGreaterThanOrEqual(28);
    expect(hard!.levels.filter((level) => boxes(level) >= 3).length).toBeGreaterThanOrEqual(28);
  });

  it('gets harder from tier to tier (median search effort of the solver)', () => {
    const medians = TIERS.map((tier) => median(tier.levels.map((level) => effort.get(level.id)!)));
    expect(medians[0]).toBeLessThan(medians[1]!);
    expect(medians[1]).toBeLessThan(medians[2]!);
  });

  it('gets harder within each tier (first half against second half)', () => {
    for (const tier of TIERS) {
      const efforts = tier.levels.map((level) => effort.get(level.id)!);
      const pushes = tier.levels.map((level) => solve(level)!.pushes);
      const half = efforts.length / 2;
      expect(median(efforts.slice(0, half)), tier.id).toBeLessThan(median(efforts.slice(half)));
      expect(median(pushes.slice(0, half)), tier.id).toBeLessThanOrEqual(
        median(pushes.slice(half)),
      );
    }
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
