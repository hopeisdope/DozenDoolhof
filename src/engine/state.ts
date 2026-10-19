/**
 * Core game types. Positions are stored as cell indices (`y * width + x`) so that
 * comparisons and lookups stay cheap and states are trivially serialisable.
 */

export type Direction = 'up' | 'down' | 'left' | 'right';

export const DIRECTIONS: readonly Direction[] = ['up', 'down', 'left', 'right'];

export interface Position {
  readonly x: number;
  readonly y: number;
}

/** Static, never-changing part of a level. */
export interface Level {
  readonly id: string;
  readonly name: string;
  readonly width: number;
  readonly height: number;
  /** `true` for wall cells. Length `width * height`. */
  readonly walls: readonly boolean[];
  /** `true` for cells inside the walls (floor the player could ever stand on). */
  readonly floor: readonly boolean[];
  /** Goal cell indices, sorted ascending. */
  readonly goals: readonly number[];
  /** The starting state of the level. */
  readonly start: GameState;
}

/** Dynamic part of a level: everything that changes while playing. */
export interface GameState {
  readonly player: number;
  /** Box cell indices, sorted ascending. */
  readonly boxes: readonly number[];
  readonly moves: number;
  readonly pushes: number;
}

export function toIndex(level: Pick<Level, 'width'>, x: number, y: number): number {
  return y * level.width + x;
}

export function toPosition(level: Pick<Level, 'width'>, index: number): Position {
  return { x: index % level.width, y: Math.floor(index / level.width) };
}

export function isSolved(level: Level, state: GameState): boolean {
  return state.boxes.every((box) => level.goals.includes(box));
}

export function countBoxesOnGoals(level: Level, state: GameState): number {
  return state.boxes.filter((box) => level.goals.includes(box)).length;
}
