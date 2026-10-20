import { neighbour } from './move';
import { DIRECTIONS, type Direction, type GameState, type Level } from './state';

/**
 * The shortest walk from the player to `target` that pushes nothing: around walls and
 * boxes, one direction per step. `[]` when the player already stands there; `null` when
 * the target is a wall, a box or cannot be reached without pushing. The state is only read.
 */
export function walkPath(level: Level, state: GameState, target: number): Direction[] | null {
  const free = (cell: number) => level.floor[cell] === true && !state.boxes.includes(cell);
  if (target === state.player) return [];
  if (target < 0 || target >= level.width * level.height || !free(target)) return null;

  const from = new Map<number, { readonly previous: number; readonly direction: Direction }>();
  const queue = [state.player];
  for (let head = 0; head < queue.length; head++) {
    const cell = queue[head]!;
    for (const direction of DIRECTIONS) {
      const next = neighbour(level, cell, direction);
      if (next === null || next === state.player || from.has(next) || !free(next)) continue;
      from.set(next, { previous: cell, direction });
      if (next === target) {
        const path: Direction[] = [];
        for (let at = target; at !== state.player;) {
          const step = from.get(at)!;
          path.push(step.direction);
          at = step.previous;
        }
        return path.reverse();
      }
      queue.push(next);
    }
  }
  return null;
}

/** The direction from `from` to a neighbouring `to`, or `null` when they are not neighbours. */
export function directionTo(level: Level, from: number, to: number): Direction | null {
  return DIRECTIONS.find((direction) => neighbour(level, from, direction) === to) ?? null;
}
