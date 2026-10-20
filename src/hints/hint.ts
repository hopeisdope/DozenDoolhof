import { tryMove } from '../engine/move';
import { isSolved, type Direction, type GameState, type Level } from '../engine/state';
import { parseSolution } from '../levels/solution';

/**
 * Pure hint logic: turns a solution from the current state into what the three hint
 * stages show. Nothing here touches the real game; every function only reads.
 *
 * 1. Which box to move next, and the goal it ends up on.
 * 2. Where to stand and which way to push that box.
 * 3. A short preview: the walk to the box and the first pushes, played by a ghost.
 */

export type HintStage = 1 | 2 | 3;

/** At most this many pushes of the same box in a row are shown in the preview. */
export const PREVIEW_PUSHES = 3;

export interface HintPlan {
  /** The box to move next (cell index). */
  readonly box: number;
  /** The goal that box ends up on in the solution. */
  readonly goal: number;
  /** Cell the player pushes from, and the push direction. */
  readonly pushFrom: number;
  readonly direction: Direction;
  /** Preview steps in LURD notation, from the current state. */
  readonly preview: string;
  /** Player cell after each preview step. */
  readonly playerRoute: readonly number[];
  /** Box cell after each preview step (the same cell while the player walks). */
  readonly boxRoute: readonly number[];
}

function samePosition(a: Pick<GameState, 'player' | 'boxes'>, b: GameState): boolean {
  return (
    a.player === b.player &&
    a.boxes.length === b.boxes.length &&
    a.boxes.every((box, index) => box === b.boxes[index])
  );
}

/**
 * The rest of a known solution (the level's stored one) when `state` lies on its path,
 * so a hint at the start, or after following the solution, needs no search.
 */
export function remainingSolution(level: Level, solution: string, state: GameState): string | null {
  let current = level.start;
  const steps = parseSolution(solution);
  for (let index = 0; index <= steps.length; index++) {
    if (samePosition(current, state)) return solution.slice(index);
    const step = steps[index];
    if (!step) break;
    const result = tryMove(level, current, step.direction);
    if (result === null) return null;
    current = result.state;
  }
  return null;
}

/**
 * The solution left after playing `direction`, if that move is the first step of
 * `solution`; otherwise `null` (the player went their own way).
 */
export function followSolution(solution: string, direction: Direction): string | null {
  const first = solution[0];
  if (first === undefined) return null;
  return parseSolution(first)[0]?.direction === direction ? solution.slice(1) : null;
}

/**
 * Plans the hint for `state` from a solution that starts there. Returns `null` when the
 * level is already solved, or when the solution does not actually solve the level from
 * `state`: a hint is never invented.
 */
export function planHint(level: Level, state: GameState, solution: string): HintPlan | null {
  if (isSolved(level, state)) return null;
  const steps = parseSolution(solution);

  // Replay the whole solution, checking every step, and follow the first pushed box.
  let current = state;
  let firstPush: { from: number; box: number; direction: Direction } | null = null;
  let tracked = -1;
  for (const step of steps) {
    const result = tryMove(level, current, step.direction);
    if (result === null || (result.push !== null) !== step.push) return null;
    if (result.push !== null) {
      if (firstPush === null) {
        firstPush = {
          from: current.player,
          box: result.push.from,
          direction: step.direction,
        };
        tracked = result.push.from;
      }
      if (result.push.from === tracked) tracked = result.push.to;
    }
    current = result.state;
  }
  if (firstPush === null || !isSolved(level, current)) return null;

  // Preview: walk to the box, then up to PREVIEW_PUSHES pushes of it in the same direction.
  const playerRoute: number[] = [];
  const boxRoute: number[] = [];
  let box = firstPush.box;
  let pushes = 0;
  let preview = '';
  current = state;
  for (const step of steps) {
    if (pushes > 0 && (!step.push || step.direction !== firstPush.direction)) break;
    if (pushes === PREVIEW_PUSHES) break;
    const result = tryMove(level, current, step.direction);
    if (result === null) return null;
    if (result.push !== null) {
      box = result.push.to;
      pushes++;
    }
    preview += solution[preview.length];
    playerRoute.push(result.state.player);
    boxRoute.push(box);
    current = result.state;
  }

  return {
    box: firstPush.box,
    goal: tracked,
    pushFrom: firstPush.from,
    direction: firstPush.direction,
    preview,
    playerRoute,
    boxRoute,
  };
}
