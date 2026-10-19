import { describe, expect, it } from 'vitest';
import {
  canUndo,
  createGame,
  isGameSolved,
  move,
  restart,
  undo,
  type Game,
} from '../../src/engine/history';
import type { Direction } from '../../src/engine/state';
import { level } from '../helpers/level';

const LEVEL = level(`
########
#      #
#@ $  .#
#      #
########`);

function play(game: Game, directions: Direction[]): Game {
  return directions.reduce(move, game);
}

describe('move', () => {
  it('records the previous state in the history', () => {
    const game = createGame(LEVEL);
    const next = move(game, 'right');
    expect(next.history).toEqual([game.state]);
    expect(next.state.moves).toBe(1);
  });

  it('returns the identical game for a blocked move, leaving state and history untouched', () => {
    const start = createGame(LEVEL);
    expect(move(start, 'left')).toBe(start); // wall

    const walked = play(start, ['up']);
    const blocked = move(walked, 'up'); // wall
    expect(blocked).toBe(walked);
    expect(blocked.state).toBe(walked.state);
    expect(blocked.history).toHaveLength(1);
  });

  it('returns the identical game when a box cannot be pushed', () => {
    const lvl = level(`
######
#@$#.#
#    #
######`);
    const game = createGame(lvl);
    expect(move(game, 'right')).toBe(game);
  });

  it('ignores moves once the level is solved', () => {
    const solved = play(createGame(LEVEL), ['right', 'right', 'right', 'right']);
    expect(isGameSolved(solved)).toBe(true);
    expect(move(solved, 'left')).toBe(solved);
  });
});

describe('undo', () => {
  it('restores the exact previous state', () => {
    const game = play(createGame(LEVEL), ['right', 'right', 'up']);
    const undone = undo(game);
    expect(undone.state).toBe(game.history.at(-1));
    expect(undone.state).toEqual(play(createGame(LEVEL), ['right', 'right']).state);
    expect(undone.history).toHaveLength(2);
  });

  it('restores pushed boxes and counters', () => {
    const before = play(createGame(LEVEL), ['right']);
    const afterPush = move(before, 'right');
    expect(afterPush.state.pushes).toBe(1);
    expect(undo(afterPush).state).toEqual(before.state);
  });

  it('walks all the way back to the start', () => {
    let game = play(createGame(LEVEL), ['right', 'down', 'right', 'up', 'left']);
    while (canUndo(game)) game = undo(game);
    expect(game.state).toBe(LEVEL.start);
    expect(game.history).toEqual([]);
  });

  it('does nothing when there is nothing to undo', () => {
    const game = createGame(LEVEL);
    expect(canUndo(game)).toBe(false);
    expect(undo(game)).toBe(game);
  });
});

describe('restart', () => {
  it('puts the level back to its start state', () => {
    const game = play(createGame(LEVEL), ['right', 'right', 'down']);
    const restarted = restart(game);
    expect(restarted.state).toBe(LEVEL.start);
    expect(restarted.state.moves).toBe(0);
  });

  it('can itself be undone', () => {
    const game = play(createGame(LEVEL), ['right', 'right', 'down']);
    expect(undo(restart(game)).state).toBe(game.state);
  });

  it('is a no-op on an untouched level', () => {
    const game = createGame(LEVEL);
    expect(restart(game)).toBe(game);
  });
});
