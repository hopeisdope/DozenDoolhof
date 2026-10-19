import { describe, expect, it } from 'vitest';
import { createGame, isGameSolved, move } from '../../src/engine/history';
import { LEVEL_DEFINITIONS, LEVELS } from '../../src/levels/definitions';
import { parseSolution } from '../../src/levels/solution';

describe('shipped levels', () => {
  it('has at least three levels with unique ids', () => {
    expect(LEVELS.length).toBeGreaterThanOrEqual(3);
    expect(new Set(LEVELS.map((level) => level.id)).size).toBe(LEVELS.length);
  });

  it('gets harder: known solutions never get shorter', () => {
    const lengths = LEVEL_DEFINITIONS.map((definition) => definition.solution.length);
    expect(lengths).toEqual([...lengths].sort((a, b) => a - b));
  });

  it('stays small enough for a phone screen', () => {
    for (const level of LEVELS) {
      expect(level.width).toBeLessThanOrEqual(10);
      expect(level.height).toBeLessThanOrEqual(10);
    }
  });

  describe.each(LEVEL_DEFINITIONS.map((definition, index) => [definition.id, index] as const))(
    '%s',
    (_id, index) => {
      it('is solved by its known solution, with every step legal', () => {
        const definition = LEVEL_DEFINITIONS[index]!;
        let game = createGame(LEVELS[index]!);
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
    },
  );
});

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
