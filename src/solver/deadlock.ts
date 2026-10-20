import type { GameState, Level } from '../engine/state';
import { liveCells } from './solver';

/**
 * Detects boxes that can provably never reach a goal again, using only patterns whose
 * hopelessness follows from the rules alone, so the game never warns about a level that
 * can still be solved:
 *
 * - **Dead cell**: no sequence of pushes, even on an otherwise empty board, takes a box
 *   from this cell onto a goal (corners, and edges along a wall without a goal). These are
 *   the same cells the solver never pushes onto (`liveCells`).
 * - **Frozen box**: a box that cannot move along either axis, blocked by walls and by
 *   other boxes that are themselves frozen (two boxes side by side along a wall, a 2×2
 *   block, …). A frozen box off a goal never reaches one.
 *
 * Anything subtler (boxes that only block each other later, closed-off areas) is left
 * alone: the hint search still finds those when asked. Pure, never modifies its input.
 */

/** A box that is stuck, and why. */
export interface StuckBox {
  readonly cell: number;
  readonly reason: 'dead-cell' | 'frozen';
}

const liveCache = new WeakMap<Level, readonly boolean[]>();

function live(level: Level): readonly boolean[] {
  let cells = liveCache.get(level);
  if (cells === undefined) {
    cells = liveCells(level);
    liveCache.set(level, cells);
  }
  return cells;
}

/** Boxes in `state` that can never reach a goal, sorted by cell. Empty when unsure. */
export function findStuckBoxes(level: Level, state: Pick<GameState, 'boxes'>): StuckBox[] {
  const alive = live(level);
  const goals = new Set(level.goals);
  const boxes = new Set(state.boxes);
  const stuck = new Map<number, StuckBox['reason']>();

  for (const box of state.boxes) {
    if (!alive[box]) stuck.set(box, 'dead-cell');
  }

  const solid = (cell: number) => level.floor[cell] !== true;
  const dead = (cell: number) => !solid(cell) && !alive[cell];

  /**
   * The boxes that keep `cell` from ever moving, including `cell` itself, or `null` when
   * it may still move. Boxes on `path` are being checked further up and count as walls:
   * whichever box of the group would move first finds its way blocked.
   */
  const frozen = (cell: number, path: Set<number>): Set<number> | null => {
    path.add(cell);
    const group = new Set([cell]);
    for (const step of [1, level.width]) {
      const sides = [cell - step, cell + step] as const;
      // A wall, or a box that stays put, on either side blocks pushes along this axis.
      if (sides.some((side) => solid(side) || path.has(side))) continue;
      // Pushing either way would put the box on a dead cell, which is hopeless too.
      if (sides.every(dead)) continue;
      let blocker: Set<number> | null = null;
      for (const side of sides) {
        if (boxes.has(side)) blocker = frozen(side, path);
        if (blocker !== null) break;
      }
      if (blocker === null) {
        path.delete(cell);
        return null;
      }
      for (const other of blocker) group.add(other);
    }
    path.delete(cell);
    return group;
  };

  for (const box of state.boxes) {
    if (stuck.has(box)) continue;
    const group = frozen(box, new Set());
    if (group === null) continue;
    for (const member of group) {
      if (!goals.has(member) && !stuck.has(member)) stuck.set(member, 'frozen');
    }
  }

  return [...stuck].map(([cell, reason]) => ({ cell, reason })).sort((a, b) => a.cell - b.cell);
}

/** Whether any box in `state` is provably stuck. */
export function hasStuckBox(level: Level, state: Pick<GameState, 'boxes'>): boolean {
  return findStuckBoxes(level, state).length > 0;
}
