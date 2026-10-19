import { describe, expect, it } from 'vitest';
import { tryMove } from '../../src/engine/move';
import { DIRECTIONS, isSolved, type Direction } from '../../src/engine/state';
import { at, deepFreeze, level } from '../helpers/level';

const OPEN_ROOM = `
#####
#   #
# @ #
#  $#
#  .#
#####`;

describe('walking', () => {
  it.each<[Direction, number, number]>([
    ['up', 2, 1],
    ['down', 2, 3],
    ['left', 1, 2],
    ['right', 3, 2],
  ])('moves the player %s', (direction, x, y) => {
    const lvl = level(OPEN_ROOM);
    const result = tryMove(lvl, lvl.start, direction);
    expect(result?.state.player).toBe(at(lvl, x, y));
    expect(result?.state.moves).toBe(1);
    expect(result?.state.pushes).toBe(0);
    expect(result?.push).toBeNull();
    expect(result?.state.boxes).toEqual(lvl.start.boxes);
  });

  it('cannot walk into a wall', () => {
    const lvl = level(`
####
#@ #
# $#
# .#
####`);
    expect(tryMove(lvl, lvl.start, 'up')).toBeNull();
    expect(tryMove(lvl, lvl.start, 'left')).toBeNull();
  });

  it('can walk onto an empty goal', () => {
    const lvl = level(`
#####
#@. #
# $$#
#  .#
#####`);
    expect(tryMove(lvl, lvl.start, 'right')?.state.player).toBe(at(lvl, 2, 1));
  });

  it('never mutates the input state', () => {
    const lvl = level(OPEN_ROOM);
    const start = deepFreeze(structuredClone(lvl.start));
    for (const direction of DIRECTIONS) {
      expect(() => tryMove(lvl, start, direction)).not.toThrow();
    }
    expect(start).toEqual(lvl.start);
  });
});

describe('pushing', () => {
  it('pushes a box one cell when the cell behind it is free', () => {
    const lvl = level(`
#######
#@$  .#
#######`);
    const result = tryMove(lvl, lvl.start, 'right');
    expect(result?.state.player).toBe(at(lvl, 2, 1));
    expect(result?.state.boxes).toEqual([at(lvl, 3, 1)]);
    expect(result?.state.pushes).toBe(1);
    expect(result?.state.moves).toBe(1);
    expect(result?.push).toEqual({ from: at(lvl, 2, 1), to: at(lvl, 3, 1) });
  });

  it('cannot push a box into a wall', () => {
    const lvl = level(`
######
#@$#.#
#    #
######`);
    expect(tryMove(lvl, lvl.start, 'right')).toBeNull();
  });

  it('cannot push a box into another box', () => {
    const lvl = level(`
#######
#@$$..#
#######`);
    expect(tryMove(lvl, lvl.start, 'right')).toBeNull();
  });

  it('cannot push a box any further once it is against a wall', () => {
    const lvl = level(`
#####
#  .#
#  $#
#  @#
#####`);
    const pushed = tryMove(lvl, lvl.start, 'up');
    expect(pushed?.state.boxes).toEqual([at(lvl, 3, 1)]);
    expect(pushed && tryMove(lvl, pushed.state, 'up')).toBeNull();
  });

  it('keeps box positions sorted after a push', () => {
    const lvl = level(`
######
#@ $.#
# $  #
# .  #
######`);
    // Box at (2,2) moves to (2,3), past the box at (3,1) in index order.
    const walked = tryMove(lvl, lvl.start, 'right');
    const pushed = walked && tryMove(lvl, walked.state, 'down');
    expect(pushed?.state.boxes).toEqual([at(lvl, 3, 1), at(lvl, 2, 3)]);
  });

  it('can push a box onto a goal and off it again', () => {
    const lvl = level(`
#######
#@$. .#
#   $ #
#######`);
    const onGoal = tryMove(lvl, lvl.start, 'right');
    expect(onGoal?.state.boxes).toContain(at(lvl, 3, 1));
    const offGoal = onGoal && tryMove(lvl, onGoal.state, 'right');
    expect(offGoal?.state.boxes).toContain(at(lvl, 4, 1));
  });
});

describe('solving', () => {
  it('is solved only when every box is on a goal', () => {
    const lvl = level(`
########
#@$. $.#
########`);
    expect(isSolved(lvl, lvl.start)).toBe(false);
    const oneDone = tryMove(lvl, lvl.start, 'right');
    expect(oneDone && isSolved(lvl, oneDone.state)).toBe(false);

    const lvl2 = level(`
######
#@$.*#
######`);
    const done = tryMove(lvl2, lvl2.start, 'right');
    expect(done && isSolved(lvl2, done.state)).toBe(true);
  });
});
