import { describe, expect, it } from 'vitest';
import { createGame, isGameSolved, move } from '../../src/engine/history';
import { parseSolution } from '../../src/levels/solution';
import { liveCells, solve } from '../../src/solver/solver';
import { at, level } from '../helpers/level';

function replays(lvl: ReturnType<typeof level>, solution: string): boolean {
  let game = createGame(lvl);
  for (const { direction } of parseSolution(solution)) {
    const next = move(game, direction);
    if (next === game) return false;
    game = next;
  }
  return isGameSolved(game);
}

describe('solve', () => {
  it('solves a straight push', () => {
    const lvl = level(`
#######
#@ $ .#
#######`);
    expect(solve(lvl)).toMatchObject({ solution: 'rRR', moves: 3, pushes: 2 });
  });

  it('walks around the box when needed and finds a legal solution', () => {
    const lvl = level(`
########
#      #
#@ .$  #
#      #
########`);
    const result = solve(lvl)!;
    expect(result.pushes).toBe(1);
    expect(replays(lvl, result.solution)).toBe(true);
  });

  it('respects the push order for two boxes in a row', () => {
    const lvl = level(`
#########
#       #
#       #
#@ $$ ..#
#       #
#       #
#########`);
    const result = solve(lvl)!;
    expect(replays(lvl, result.solution)).toBe(true);
  });

  it('returns null for an unsolvable level', () => {
    // The box can only slide along the top wall and never reach the goal below it.
    const lvl = level(`
######
#$   #
#  @ #
#  . #
######`);
    expect(solve(lvl)).toBeNull();
  });

  it('gives up when the state budget is exceeded', () => {
    const lvl = level(`
#########
#       #
#@ $$ ..#
#       #
#       #
#########`);
    expect(solve(lvl, 1)).toBeNull();
  });
});

describe('liveCells', () => {
  it('marks corners without a goal as dead and goals as live', () => {
    const lvl = level(`
######
#@   #
# $  #
#   .#
######`);
    const live = liveCells(lvl);
    expect(live[at(lvl, 4, 3)]).toBe(true); // goal
    expect(live[at(lvl, 1, 1)]).toBe(false); // corner
    expect(live[at(lvl, 2, 2)]).toBe(true);
  });
});
