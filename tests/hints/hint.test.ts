import { describe, expect, it } from 'vitest';
import { createGame, move, undo, type Game } from '../../src/engine/history';
import { isSolved, type Direction, type GameState } from '../../src/engine/state';
import { followSolution, planHint, remainingSolution } from '../../src/hints/hint';
import { LEVEL_DEFINITIONS, LEVELS } from '../../src/levels/definitions';
import { parseSolution } from '../../src/levels/solution';
import { search } from '../../src/solver/solver';
import { at, deepFreeze, level } from '../helpers/level';

// Box in the middle, goal on the right; the player starts left of the box.
const ROOM_MAP = `
########
#      #
#@ $  .#
#      #
########`;
const ROOM = level(ROOM_MAP);

function play(game: Game, lurd: string): Game {
  for (const { direction } of parseSolution(lurd)) game = move(game, direction);
  return game;
}

function solutionFrom(state: GameState): string {
  const outcome = search(ROOM, state);
  if (outcome.kind !== 'solved') throw new Error('expected a solution');
  return outcome.result.solution;
}

/** Plays a solution from `state` and reports whether it solves the level. */
function solves(lvl: typeof ROOM, state: GameState, solution: string): boolean {
  let game: Game = { level: lvl, state, history: [] };
  for (const { direction } of parseSolution(solution)) {
    const next = move(game, direction);
    if (next === game) return false;
    game = next;
  }
  return isSolved(lvl, game.state);
}

describe('planHint', () => {
  it('plans from the level start: box, goal, push position and a short preview', () => {
    const plan = planHint(ROOM, ROOM.start, 'rRRR')!;
    expect(plan).toMatchObject({
      box: at(ROOM, 3, 2),
      goal: at(ROOM, 6, 2),
      pushFrom: at(ROOM, 2, 2),
      direction: 'right',
      preview: 'rRRR',
    });
    expect(plan.playerRoute).toEqual([
      at(ROOM, 2, 2),
      at(ROOM, 3, 2),
      at(ROOM, 4, 2),
      at(ROOM, 5, 2),
    ]);
    expect(plan.boxRoute).toEqual([at(ROOM, 3, 2), at(ROOM, 4, 2), at(ROOM, 5, 2), at(ROOM, 6, 2)]);
  });

  it('plans from a changed but solvable state, found by the solver', () => {
    // Walk around the box: now the player is right of it and must go back.
    const game = play(createGame(ROOM), 'urrrd');
    const solution = solutionFrom(game.state);
    expect(solves(ROOM, game.state, solution)).toBe(true);
    const plan = planHint(ROOM, game.state, solution)!;
    expect(plan.box).toBe(at(ROOM, 3, 2));
    expect(plan.goal).toBe(at(ROOM, 6, 2));
    expect(plan.direction).toBe('right');
    expect(plan.pushFrom).toBe(at(ROOM, 2, 2));
    // The preview starts where the player stands now.
    expect(plan.playerRoute.length).toBe(plan.preview.length);
  });

  it('plans after walking, pushing and undoing', () => {
    let game = play(createGame(ROOM), 'rR'); // walk, then push once
    let plan = planHint(ROOM, game.state, solutionFrom(game.state))!;
    expect(plan.box).toBe(at(ROOM, 4, 2));
    expect(plan.pushFrom).toBe(game.state.player);

    game = undo(game); // the box is back
    plan = planHint(ROOM, game.state, solutionFrom(game.state))!;
    expect(plan.box).toBe(at(ROOM, 3, 2));
    expect(plan.pushFrom).toBe(game.state.player);
  });

  it('limits the preview to the walk and a few pushes in one direction', () => {
    const wide = level(`
###########
#@ $     .#
###########`);
    const plan = planHint(wide, wide.start, 'rRRRRRR')!;
    expect(plan.preview).toBe('rRRR');
  });

  it('never accepts a solution that does not work from the state', () => {
    expect(planHint(ROOM, ROOM.start, 'lLL')).toBeNull(); // walks into the wall
    expect(planHint(ROOM, ROOM.start, 'rRR')).toBeNull(); // stops short of the goal
    expect(planHint(ROOM, ROOM.start, 'rrRR')).toBeNull(); // a push marked as a walk
    expect(planHint(ROOM, ROOM.start, '')).toBeNull();
  });

  it('gives no hint for a solved level', () => {
    const solved = play(createGame(ROOM), 'rRRR');
    expect(isSolved(ROOM, solved.state)).toBe(true);
    expect(planHint(ROOM, solved.state, '')).toBeNull();
  });

  it('only reads: the state, its moves and the level stay untouched', () => {
    const frozenLevel = deepFreeze(level(ROOM_MAP));
    const state = deepFreeze(play(createGame(frozenLevel), 'u').state);
    const before = JSON.stringify(state);
    const outcome = search(frozenLevel, state);
    expect(outcome.kind).toBe('solved');
    if (outcome.kind === 'solved') planHint(frozenLevel, state, outcome.result.solution);
    expect(JSON.stringify(state)).toBe(before);
    expect(state.moves).toBe(1);
    expect(state.pushes).toBe(0);
  });
});

describe('remainingSolution / followSolution', () => {
  it('finds the rest of the known solution along its path', () => {
    const game = play(createGame(ROOM), 'rR');
    expect(remainingSolution(ROOM, 'rRRR', ROOM.start)).toBe('rRRR');
    expect(remainingSolution(ROOM, 'rRRR', game.state)).toBe('RR');
    // Off the path: the solver has to help.
    expect(remainingSolution(ROOM, 'rRRR', play(createGame(ROOM), 'u').state)).toBeNull();
  });

  it('follows only the first step of the solution', () => {
    expect(followSolution('rRR', 'right')).toBe('RR');
    expect(followSolution('rRR', 'up')).toBeNull();
    expect(followSolution('', 'right')).toBeNull();
  });
});

describe('hints for all 120 levels', () => {
  it('the known solution gives a valid hint from every level start', () => {
    expect(LEVELS).toHaveLength(120);
    for (const [index, lvl] of LEVELS.entries()) {
      const definition = LEVEL_DEFINITIONS[index]!;
      const rest = remainingSolution(lvl, definition.solution, lvl.start);
      expect(rest, lvl.id).toBe(definition.solution);
      const plan = planHint(lvl, lvl.start, rest!);
      expect(plan, lvl.id).not.toBeNull();
      expect(lvl.start.boxes, lvl.id).toContain(plan!.box);
      expect(lvl.goals, lvl.id).toContain(plan!.goal);
    }
  });

  it('a solution found after a detour gives a valid hint in every level', () => {
    for (const lvl of LEVELS) {
      // A detour: the first legal walk (no push) away from the start.
      let game = createGame(lvl);
      for (const direction of ['up', 'down', 'left', 'right'] as Direction[]) {
        const next = move(game, direction);
        if (next !== game && next.state.pushes === 0) {
          game = next;
          break;
        }
      }
      const outcome = search(lvl, game.state, 60_000);
      expect(outcome.kind, lvl.id).toBe('solved');
      if (outcome.kind !== 'solved') continue;
      expect(solves(lvl, game.state, outcome.result.solution), lvl.id).toBe(true);
      expect(planHint(lvl, game.state, outcome.result.solution), lvl.id).not.toBeNull();
    }
  });
});
