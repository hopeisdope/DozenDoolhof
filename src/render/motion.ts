import { toPosition, type Direction, type GameState, type Level } from '../engine/state';

/** How the player sprite should look after a state change. */
export interface Motion {
  readonly facing: Direction;
  /** The player stepped to a neighbouring cell (play the walk cycle). */
  readonly walking: boolean;
  /** The player has its hands on a box: it pushed one, or an undo pulled one back. */
  readonly pushing: boolean;
}

const OPPOSITE: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};

function stepDirection(level: Level, from: number, to: number): Direction | null {
  const a = toPosition(level, from);
  const b = toPosition(level, to);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  if (Math.abs(dx) + Math.abs(dy) !== 1) return null;
  if (dx === 1) return 'right';
  if (dx === -1) return 'left';
  return dy === 1 ? 'down' : 'up';
}

/**
 * Derives the sprite pose purely from two consecutive states, so moves, undo and
 * restart all animate consistently without the renderer knowing which happened.
 */
export function describeMotion(
  level: Level,
  previous: GameState,
  next: GameState,
  previousFacing: Direction,
): Motion {
  const direction = stepDirection(level, previous.player, next.player);
  if (direction === null) {
    // Restart or no player movement: face the camera after a restart, else keep looking.
    const facing = next === level.start ? 'down' : previousFacing;
    return { facing, walking: false, pushing: false };
  }

  const delta = next.player - previous.player;
  const pushed = previous.boxes.includes(next.player) && next.boxes.includes(next.player + delta);
  if (pushed) return { facing: direction, walking: true, pushing: true };

  // Undoing a push walks backwards while the box follows: keep facing the box.
  const pulled =
    previous.boxes.includes(previous.player - delta) &&
    next.boxes.includes(previous.player) &&
    !next.boxes.includes(previous.player - delta);
  if (pulled) return { facing: OPPOSITE[direction], walking: true, pushing: true };

  return { facing: direction, walking: true, pushing: false };
}
