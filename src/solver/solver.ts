import type { Direction, Level } from '../engine/state';

/**
 * Sokoban solver: breadth-first search over box pushes, so the solution found has the
 * fewest possible pushes. Walking between pushes is filled in with shortest paths.
 * States are deduplicated on (box positions, area the player can reach), and boxes are
 * never pushed onto "dead" cells from which no goal can be reached.
 *
 * Used by the test suite to prove every level solvable and to measure difficulty.
 */

export interface SolveResult {
  /** LURD notation: `u d l r` walk, `U D L R` push. */
  readonly solution: string;
  readonly moves: number;
  readonly pushes: number;
  /** Number of distinct push states explored; a rough measure of puzzle complexity. */
  readonly explored: number;
}

const LETTERS: Record<Direction, string> = { up: 'u', down: 'd', left: 'l', right: 'r' };
const DIRS: readonly Direction[] = ['up', 'down', 'left', 'right'];

function offset(level: Level, direction: Direction): number {
  switch (direction) {
    case 'up':
      return -level.width;
    case 'down':
      return level.width;
    case 'left':
      return -1;
    case 'right':
      return 1;
  }
}

/** Cells from which a box can still be pushed onto some goal. */
export function liveCells(level: Level): boolean[] {
  const live = new Array<boolean>(level.width * level.height).fill(false);
  const queue = [...level.goals];
  for (const goal of queue) live[goal] = true;
  while (queue.length > 0) {
    const cell = queue.shift() as number;
    for (const direction of DIRS) {
      const d = offset(level, direction);
      // A box at `from` pushed by a player at `from - d` lands on `cell`.
      const from = cell - d;
      const player = from - d;
      if (level.floor[from] && level.floor[player] && !live[from]) {
        live[from] = true;
        queue.push(from);
      }
    }
  }
  return live;
}

interface Node {
  readonly boxes: readonly number[];
  readonly player: number;
  readonly parent: Node | null;
  /** Walk + push that led from the parent to this node. */
  readonly steps: string;
}

/** Shortest walking paths from `start`, avoiding walls and boxes. */
function reach(level: Level, boxes: ReadonlySet<number>, start: number): Map<number, string> {
  const paths = new Map<number, string>([[start, '']]);
  const queue = [start];
  for (let i = 0; i < queue.length; i++) {
    const cell = queue[i] as number;
    const path = paths.get(cell) as string;
    for (const direction of DIRS) {
      const next = cell + offset(level, direction);
      if (level.floor[next] && !boxes.has(next) && !paths.has(next)) {
        paths.set(next, path + LETTERS[direction]);
        queue.push(next);
      }
    }
  }
  return paths;
}

export function solve(level: Level, maxStates = 200_000): SolveResult | null {
  const live = liveCells(level);
  const goals = new Set(level.goals);
  const seen = new Set<string>();
  let frontier: Node[] = [
    { boxes: level.start.boxes, player: level.start.player, parent: null, steps: '' },
  ];

  while (frontier.length > 0) {
    const next: Node[] = [];
    for (const node of frontier) {
      const boxSet = new Set(node.boxes);
      const paths = reach(level, boxSet, node.player);
      const key = `${node.boxes.join(',')}|${Math.min(...paths.keys())}`;
      if (seen.has(key)) continue;
      seen.add(key);
      if (seen.size > maxStates) return null;

      if (node.boxes.every((box) => goals.has(box))) {
        let solution = '';
        for (let n: Node | null = node; n; n = n.parent) solution = n.steps + solution;
        return {
          solution,
          moves: solution.length,
          pushes: [...solution].filter((c) => c !== c.toLowerCase()).length,
          explored: seen.size,
        };
      }

      for (const box of node.boxes) {
        for (const direction of DIRS) {
          const d = offset(level, direction);
          const walk = paths.get(box - d);
          const target = box + d;
          if (walk === undefined || !live[target] || boxSet.has(target)) continue;
          const boxes = node.boxes.map((b) => (b === box ? target : b)).sort((a, b) => a - b);
          next.push({
            boxes,
            player: box,
            parent: node,
            steps: walk + LETTERS[direction].toUpperCase(),
          });
        }
      }
    }
    frontier = next;
  }
  return null;
}
