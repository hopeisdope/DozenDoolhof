import { describe, expect, it } from 'vitest';
import { createGame, move } from '../../src/engine/history';
import { tryMove } from '../../src/engine/move';
import { DIRECTIONS, type GameState, type Level } from '../../src/engine/state';
import { LEVELS, TIERS } from '../../src/levels/definitions';
import { parseSolution } from '../../src/levels/solution';
import { findStuckBoxes, hasStuckBox } from '../../src/solver/deadlock';
import { search } from '../../src/solver/solver';
import { at, deepFreeze, level } from '../helpers/level';

/** Stuck boxes as `x,y:reason`, for readable expectations. */
function stuck(lvl: Level, state: Pick<GameState, 'boxes'> = lvl.start): string[] {
  return findStuckBoxes(lvl, state).map(({ cell, reason }) => {
    return `${cell % lvl.width},${Math.floor(cell / lvl.width)}:${reason}`;
  });
}

describe('findStuckBoxes: dead cells', () => {
  it('flags a box in a corner without a goal', () => {
    const lvl = level(`
#####
#$  #
#   #
#@ .#
#####`);
    expect(stuck(lvl)).toEqual(['1,1:dead-cell']);
  });

  it('flags a box against a wall that has no goal along it', () => {
    const lvl = level(`
#######
#  $  #
#     #
#@   .#
#######`);
    expect(stuck(lvl)).toEqual(['3,1:dead-cell']);
  });

  it('leaves a box alone that can still slide along the wall to a goal', () => {
    const lvl = level(`
#######
#  $ .#
#     #
#@    #
#######`);
    expect(stuck(lvl)).toEqual([]);
  });

  it('never flags a box on a goal, even in a corner', () => {
    const lvl = level(`
######
#*   #
#  $ #
#@  .#
######`);
    expect(stuck(lvl)).toEqual([]);
  });

  it('flags the inner corner of an irregular room and only the stuck box', () => {
    const lvl = level(`
  #####
  #  .#
###   #
#$  $ #
#@  . #
#######`);
    // (1,3) is a corner made by the notch; the box at (4,3) can still be pushed around.
    expect(stuck(lvl)).toEqual(['1,3:dead-cell']);
  });

  it('flags every box that is on a dead cell', () => {
    const lvl = level(`
#######
#$   $#
#     #
#@ ...#
#  $  #
#######`);
    expect(stuck(lvl)).toEqual(['1,1:dead-cell', '5,1:dead-cell', '3,4:dead-cell']);
  });
});

describe('findStuckBoxes: frozen boxes', () => {
  it('flags two boxes side by side against a wall', () => {
    const lvl = level(`
#######
#.$$ .#
#     #
#@    #
#######`);
    expect(stuck(lvl)).toEqual(['2,1:frozen', '3,1:frozen']);
  });

  it('flags only the box off its goal when it is frozen against a box on a goal', () => {
    const lvl = level(`
########
# *$  .#
#      #
#@     #
########`);
    expect(stuck(lvl)).toEqual(['3,1:frozen']);
  });

  it('leaves frozen boxes alone when all of them stand on goals', () => {
    const lvl = level(`
########
# **   #
#   $ .#
#@     #
########`);
    expect(stuck(lvl)).toEqual([]);
  });

  it('flags a 2×2 block of boxes in the open', () => {
    const lvl = level(`
########
#      #
# $$  .#
# $$ ..#
#@    .#
########`);
    expect(stuck(lvl)).toEqual(['2,2:frozen', '3,2:frozen', '2,3:frozen', '3,3:frozen']);
  });

  it('leaves a 2×2 block on goals alone', () => {
    const lvl = level(`
########
#      #
# **   #
# ** $.#
#@     #
########`);
    expect(stuck(lvl)).toEqual([]);
  });

  it('flags two boxes that pin each other between walls above and below', () => {
    const lvl = level(`
########
#  #  .#
#  $$  #
#   # .#
#@     #
########`);
    expect(stuck(lvl)).toEqual(['3,2:frozen', '4,2:frozen']);
  });

  it('flags boxes that can only be pushed onto dead cells', () => {
    // Rows 1 and 3 have no goals, so pushing either box up or down is hopeless, and
    // side by side neither can be pushed sideways.
    const lvl = level(`
#########
#       #
#  $$ ..#
#   @   #
#########`);
    expect(stuck(lvl)).toEqual(['3,2:frozen', '4,2:frozen']);
  });

  it('leaves two boxes side by side in the open alone', () => {
    const lvl = level(`
#########
#       #
#  $$ ..#
#       #
#@      #
#########`);
    expect(stuck(lvl)).toEqual([]);
  });

  it('leaves a box against a wall alone while it can still move along it', () => {
    const lvl = level(`
#######
#. $ .#
#  $  #
#@    #
#######`);
    // The lower box can still be pushed sideways, so the upper one is not frozen.
    expect(stuck(lvl)).toEqual([]);
  });
});

describe('findStuckBoxes: conservative', () => {
  it('says nothing about an unsolvable position that matches no proven pattern', () => {
    // In the corridor the first box can only be pushed into the second one, but neither
    // is stuck yet on its own: the hint search reports this case instead.
    const lvl = level(`
#########
#@$ $ ..#
#########`);
    expect(search(lvl, lvl.start)).toEqual({ kind: 'unsolvable' });
    expect(stuck(lvl)).toEqual([]);
  });

  it('does not depend on where the player stands', () => {
    const lvl = level(`
#######
#.$$ .#
#     #
#@    #
#######`);
    for (const player of [at(lvl, 1, 3), at(lvl, 4, 1), at(lvl, 5, 2)]) {
      const state: GameState = { ...lvl.start, player };
      expect(hasStuckBox(lvl, state)).toBe(true);
    }
  });

  it('never modifies the level or the state', () => {
    const lvl = deepFreeze(
      level(`
#######
#.$$ .#
#     #
#@    #
#######`),
    );
    const state = deepFreeze({ ...lvl.start });
    expect(() => findStuckBoxes(lvl, state)).not.toThrow();
    expect(state).toEqual(lvl.start);
  });

  it('returns the same answer every time for the same state', () => {
    const lvl = level(`
#####
#$  #
#   #
#@ .#
#####`);
    expect(findStuckBoxes(lvl, lvl.start)).toEqual(findStuckBoxes(lvl, lvl.start));
  });
});

/** Independent of the solver: can a single box get from `from` onto a goal at all? */
function singleBoxCanReachGoal(lvl: Level, from: number): boolean {
  const goals = new Set(lvl.goals);
  const seen = new Set<string>();
  const queue: GameState[] = [];
  for (let player = 0; player < lvl.width * lvl.height; player++) {
    if (lvl.floor[player] && player !== from) {
      queue.push({ player, boxes: [from], moves: 0, pushes: 0 });
    }
  }
  for (let i = 0; i < queue.length; i++) {
    const state = queue[i]!;
    if (goals.has(state.boxes[0]!)) return true;
    const key = `${state.player}|${state.boxes[0]}`;
    if (seen.has(key)) continue;
    seen.add(key);
    for (const direction of DIRECTIONS) {
      const next = tryMove(lvl, state, direction);
      if (next) queue.push(next.state);
    }
  }
  return false;
}

describe('stuck boxes in the shipped levels', () => {
  it('flags nothing at the start or anywhere along the known solutions', () => {
    for (const tier of TIERS) {
      tier.levels.forEach((lvl, index) => {
        let game = createGame(lvl);
        expect(stuck(lvl), lvl.id).toEqual([]);
        for (const { direction } of parseSolution(tier.definitions[index]!.solution)) {
          game = move(game, direction);
          expect(stuck(lvl, game.state), lvl.id).toEqual([]);
        }
      });
    }
  });

  it('only ever flags positions that really cannot be solved any more', () => {
    // Explore up to a few thousand reachable positions per level, including pushes onto
    // dead cells. Every warning is checked independently of the detector.
    let flagged = 0;
    let frozen = 0;
    for (const lvl of LEVELS) {
      const reachable = new Map<number, boolean>();
      const canReach = (cell: number) => {
        if (!reachable.has(cell)) reachable.set(cell, singleBoxCanReachGoal(lvl, cell));
        return reachable.get(cell);
      };
      const seen = new Set<string>();
      const queue: GameState[] = [lvl.start];
      for (let i = 0; i < queue.length && seen.size < 4000; i++) {
        const state = queue[i]!;
        const key = `${state.player}|${state.boxes.join(',')}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const boxes = findStuckBoxes(lvl, state);
        if (boxes.length === 0) {
          for (const direction of DIRECTIONS) {
            const next = tryMove(lvl, state, direction);
            if (next) queue.push(next.state);
          }
          continue;
        }
        flagged++;
        for (const box of boxes) {
          expect(lvl.goals.includes(box.cell), `${lvl.id} ${key}`).toBe(false);
          if (box.reason === 'dead-cell') {
            expect(canReach(box.cell), `${lvl.id} ${key}`).toBe(false);
          }
        }
        if (boxes.every((box) => box.reason === 'frozen')) {
          frozen++;
          expect(search(lvl, state).kind, `${lvl.id} ${key}`).toBe('unsolvable');
        }
      }
    }
    // The detector does find things: a sanity check that the sweep is not vacuous.
    expect(flagged).toBeGreaterThan(1000);
    expect(frozen).toBeGreaterThan(100);
  }, 60_000);
});
