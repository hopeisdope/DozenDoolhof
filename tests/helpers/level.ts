import type { Level } from '../../src/engine/state';
import { parseLevel } from '../../src/levels/parser';

/** Parses an inline test map. */
export function level(map: string, id = 'test'): Level {
  return parseLevel(map, { id, name: id });
}

/** Cell index of column `x`, row `y`. */
export function at(lvl: Level, x: number, y: number): number {
  return y * lvl.width + x;
}

/** Recursively freezes a value so accidental mutation throws in strict mode. */
export function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
