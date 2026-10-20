import { describe, expect, it } from 'vitest';
import { createGame, isGameSolved, move, type Game } from '../../src/engine/history';
import { parseSolution } from '../../src/levels/solution';
import { liveCells, search, solve } from '../../src/solver/solver';
import { at, deepFreeze, level } from '../helpers/level';

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

describe('search from any state', () => {
  const lvl = level(`
#######
#     #
#@ $ .#
#     #
#######`);

  it('solves from a state the player reached, not only from the start', () => {
    // Walk round the box first: the player now stands right of it.
    const state = { ...lvl.start, player: at(lvl, 4, 2), moves: 4 };
    const outcome = search(lvl, state);
    expect(outcome.kind).toBe('solved');
    if (outcome.kind !== 'solved') return;
    let game: Game = { level: lvl, state, history: [] };
    for (const { direction } of parseSolution(outcome.result.solution))
      game = move(game, direction);
    expect(isGameSolved(game)).toBe(true);
  });

  it('agrees with solve() from the start', () => {
    const outcome = search(lvl, lvl.start);
    expect(outcome).toEqual({ kind: 'solved', result: solve(lvl) });
  });

  it('reports a box on a dead cell as unsolvable without searching', () => {
    const state = { ...lvl.start, boxes: [at(lvl, 1, 1)], player: at(lvl, 3, 2) };
    expect(search(lvl, state)).toEqual({ kind: 'unsolvable' });
  });

  it('tells an exhausted budget apart from an unsolvable level', () => {
    const big = level(`
#########
#       #
#@ $$ ..#
#       #
#       #
#########`);
    expect(search(big, big.start, 1)).toEqual({ kind: 'gave-up' });
  });

  it('reports an unsolvable state after a full search', () => {
    // Two boxes side by side against the top wall: each blocks the other, although both
    // stand on cells from which a single box could still reach a goal.
    const stuck = level(`
#######
#.   .#
#  $$ #
#@    #
#######`);
    const live = liveCells(stuck);
    const state = { ...stuck.start, boxes: [at(stuck, 2, 1), at(stuck, 3, 1)] };
    expect(state.boxes.every((box) => live[box])).toBe(true);
    expect(search(stuck, state)).toEqual({ kind: 'unsolvable' });
  });

  it('does not modify the state it searches from', () => {
    const state = deepFreeze({ ...lvl.start, player: at(lvl, 4, 2) });
    expect(() => search(lvl, state)).not.toThrow();
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
