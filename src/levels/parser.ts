import type { GameState, Level } from '../engine/state';

/**
 * Parser for the standard Sokoban text format:
 *
 *   #  wall          @  player          $  box          .  goal
 *   (space) floor    +  player on goal  *  box on goal
 */

export class LevelParseError extends Error {
  constructor(levelId: string, detail: string) {
    super(`Invalid level "${levelId}": ${detail}`);
    this.name = 'LevelParseError';
  }
}

export interface LevelMeta {
  readonly id: string;
  readonly name: string;
}

export function parseLevel(source: string, meta: LevelMeta): Level {
  function fail(detail: string): never {
    throw new LevelParseError(meta.id, detail);
  }

  const allLines = source.split(/\r?\n/).map((line) => line.trimEnd());
  const first = allLines.findIndex((line) => line.length > 0);
  if (first === -1) fail('the level is empty');
  let last = allLines.length - 1;
  while (allLines[last] === '') last--;
  const lines = allLines.slice(first, last + 1);
  const where = (x: number, y: number): string => `line ${first + y + 1}, column ${x + 1}`;

  const height = lines.length;
  const width = Math.max(...lines.map((line) => line.length));
  const size = width * height;
  const walls: boolean[] = new Array<boolean>(size).fill(false);
  const goals: number[] = [];
  const boxes: number[] = [];
  const players: number[] = [];

  lines.forEach((line, y) => {
    [...line].forEach((char, x) => {
      const index = y * width + x;
      switch (char) {
        case '#':
          walls[index] = true;
          break;
        case ' ':
          break;
        case '@':
          players.push(index);
          break;
        case '+':
          players.push(index);
          goals.push(index);
          break;
        case '$':
          boxes.push(index);
          break;
        case '*':
          boxes.push(index);
          goals.push(index);
          break;
        case '.':
          goals.push(index);
          break;
        default:
          fail(`unexpected character "${char}" at ${where(x, y)}`);
      }
    });
  });

  const player = players[0];
  if (player === undefined) fail('there is no player (@ or +)');
  if (players.length > 1) fail(`there are ${players.length} players; exactly one is required`);
  if (boxes.length === 0) fail('there are no boxes ($ or *)');
  if (boxes.length !== goals.length) {
    fail(`there are ${boxes.length} boxes but ${goals.length} goals; they must be equal`);
  }

  const floor = floodFill(width, height, walls, player);
  if (floor === null) fail('it is not enclosed by walls; the player can walk off the board');

  for (const [label, cells] of [
    ['box', boxes],
    ['goal', goals],
  ] as const) {
    for (const cell of cells) {
      if (floor[cell] !== true) {
        fail(`the ${label} at ${where(cell % width, Math.floor(cell / width))} cannot be reached`);
      }
    }
  }

  if (boxes.every((box) => goals.includes(box))) fail('it is already solved at the start');

  const start: GameState = {
    player,
    boxes: boxes.sort((a, b) => a - b),
    moves: 0,
    pushes: 0,
  };

  return {
    id: meta.id,
    name: meta.name,
    width,
    height,
    walls,
    floor,
    goals: goals.sort((a, b) => a - b),
    start,
  };
}

/**
 * Marks every non-wall cell reachable from `from`. Returns `null` when the walk
 * reaches the edge of the grid, meaning the level is not enclosed.
 */
function floodFill(
  width: number,
  height: number,
  walls: readonly boolean[],
  from: number,
): boolean[] | null {
  const seen: boolean[] = new Array<boolean>(width * height).fill(false);
  const stack = [from];
  seen[from] = true;
  while (stack.length > 0) {
    const cell = stack.pop() as number;
    const x = cell % width;
    const y = Math.floor(cell / width);
    if (x === 0 || y === 0 || x === width - 1 || y === height - 1) return null;
    for (const next of [cell - 1, cell + 1, cell - width, cell + width]) {
      if (!walls[next] && !seen[next]) {
        seen[next] = true;
        stack.push(next);
      }
    }
  }
  return seen;
}
