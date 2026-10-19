import type { Direction } from '../engine/state';

export interface SolutionStep {
  readonly direction: Direction;
  /** `true` when this step is expected to push a box. */
  readonly push: boolean;
}

const LURD: Record<string, Direction> = { u: 'up', d: 'down', l: 'left', r: 'right' };

/** Parses LURD notation (`u d l r` walk, `U D L R` push) into steps. */
export function parseSolution(solution: string): SolutionStep[] {
  return [...solution].map((char, index) => {
    const direction = LURD[char.toLowerCase()];
    if (direction === undefined) {
      throw new Error(`Invalid LURD character "${char}" at position ${index + 1}`);
    }
    return { direction, push: char !== char.toLowerCase() };
  });
}
