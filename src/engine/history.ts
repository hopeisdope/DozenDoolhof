import { tryMove } from './move';
import { isSolved, type Direction, type GameState, type Level } from './state';

/** A level being played: the current state plus every earlier state for undo. */
export interface Game {
  readonly level: Level;
  readonly state: GameState;
  readonly history: readonly GameState[];
}

export function createGame(level: Level): Game {
  return { level, state: level.start, history: [] };
}

export function isGameSolved(game: Game): boolean {
  return isSolved(game.level, game.state);
}

/**
 * Applies a move. A blocked move, or any move after the level is solved, returns
 * the very same `game` object so callers can detect "no change" by identity.
 */
export function move(game: Game, direction: Direction): Game {
  if (isGameSolved(game)) return game;
  const result = tryMove(game.level, game.state, direction);
  if (result === null) return game;
  return {
    level: game.level,
    state: result.state,
    history: [...game.history, game.state],
  };
}

export function canUndo(game: Game): boolean {
  return game.history.length > 0;
}

/** Restores the exact previous state. Returns `game` unchanged when there is nothing to undo. */
export function undo(game: Game): Game {
  const previous = game.history.at(-1);
  if (previous === undefined) return game;
  return { level: game.level, state: previous, history: game.history.slice(0, -1) };
}

/**
 * Puts the level back to its start. The restart is itself undoable, so a child who
 * taps the button by accident loses nothing. Restarting an untouched level is a no-op.
 */
export function restart(game: Game): Game {
  if (game.state === game.level.start) return game;
  return {
    level: game.level,
    state: game.level.start,
    history: [...game.history, game.state],
  };
}
