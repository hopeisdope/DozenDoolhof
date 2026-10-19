import { toIndex, toPosition, type Direction, type GameState, type Level } from './state';

const OFFSETS: Record<Direction, { readonly dx: number; readonly dy: number }> = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
};

export interface MoveResult {
  readonly state: GameState;
  /** Box index before and after the push, when a box was pushed. */
  readonly push: { readonly from: number; readonly to: number } | null;
}

/** Returns the neighbouring cell index, or `null` when it lies outside the grid. */
export function neighbour(level: Level, index: number, direction: Direction): number | null {
  const { x, y } = toPosition(level, index);
  const { dx, dy } = OFFSETS[direction];
  const nx = x + dx;
  const ny = y + dy;
  if (nx < 0 || ny < 0 || nx >= level.width || ny >= level.height) return null;
  return toIndex(level, nx, ny);
}

function isFree(level: Level, boxes: readonly number[], index: number | null): index is number {
  return index !== null && level.floor[index] === true && !boxes.includes(index);
}

/**
 * Tries to move the player one cell. A box in the way is pushed one cell when the
 * cell behind it is free. Returns `null` for a blocked move; the input state is
 * never modified.
 */
export function tryMove(level: Level, state: GameState, direction: Direction): MoveResult | null {
  const target = neighbour(level, state.player, direction);
  if (target === null || level.floor[target] !== true) return null;

  if (!state.boxes.includes(target)) {
    return {
      state: { ...state, player: target, moves: state.moves + 1 },
      push: null,
    };
  }

  const behind = neighbour(level, target, direction);
  if (!isFree(level, state.boxes, behind)) return null;

  const boxes = state.boxes.map((box) => (box === target ? behind : box)).sort((a, b) => a - b);
  return {
    state: {
      player: target,
      boxes,
      moves: state.moves + 1,
      pushes: state.pushes + 1,
    },
    push: { from: target, to: behind },
  };
}
