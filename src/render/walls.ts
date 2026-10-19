import { toPosition, type Level } from '../engine/state';

/**
 * Wall autotiling. Every wall cell becomes one rounded brick whose shape depends on
 * its four neighbours: sides that touch another wall get a thin mortar joint, free
 * sides get the thick outline, and the outside corner of a bend gets a big curve so
 * the border reads as one continuous brick rim (as in the moodboard).
 *
 * Geometry is in "cell units" of 100, so a level of W×H cells is drawn in a
 * `0 0 W*100 H*100` viewBox and scales with the board.
 */

const CELL = 100;
/** Half the mortar joint between two neighbouring bricks. */
const JOINT = 4;
/** Height of the darker front face visible below a brick's top face. */
const DEPTH = 14;
/** Inset of the glossy highlight inside the top face. */
const GLOSS_INSET = 6;

export const RADIUS = {
  /** Outer corner of a bend (exactly two perpendicular neighbours). */
  bend: 72,
  /** Any other corner where both sides face the outside of the level. */
  outer: 30,
  /** Corner where both sides are free but at least one faces the floor. */
  inner: 22,
  /** Corner next to a mortar joint. */
  joint: 12,
} as const;

/** Corner order everywhere: north-west, north-east, south-east, south-west. */
export type Corners = readonly [number, number, number, number];

type Side = 'wall' | 'floor' | 'outside';

export interface Brick {
  readonly x: number;
  readonly y: number;
  readonly sides: { readonly n: Side; readonly e: Side; readonly s: Side; readonly w: Side };
  /** Radii of the mortar backing, which also carries the outline. */
  readonly backing: Corners;
  /** Radii of the brick itself. */
  readonly brick: Corners;
}

function corners(radius: (corner: 0 | 1 | 2 | 3) => number): Corners {
  return [radius(0), radius(1), radius(2), radius(3)];
}

function sideAt(level: Level, x: number, y: number): Side {
  if (x < 0 || y < 0 || x >= level.width || y >= level.height) return 'outside';
  const index = y * level.width + x;
  if (level.walls[index]) return 'wall';
  return level.floor[index] ? 'floor' : 'outside';
}

/** Describes the brick for the wall cell at `index`. */
export function describeBrick(level: Level, index: number): Brick {
  const { x, y } = toPosition(level, index);
  const sides = {
    n: sideAt(level, x, y - 1),
    e: sideAt(level, x + 1, y),
    s: sideAt(level, x, y + 1),
    w: sideAt(level, x - 1, y),
  };
  const isBend =
    [sides.n, sides.e, sides.s, sides.w].filter((side) => side === 'wall').length === 2 &&
    (sides.n === 'wall') !== (sides.s === 'wall');

  // Each corner is formed by two sides: NW = n+w, NE = n+e, SE = s+e, SW = s+w.
  const cornerSides: readonly (readonly [Side, Side])[] = [
    [sides.n, sides.w],
    [sides.n, sides.e],
    [sides.s, sides.e],
    [sides.s, sides.w],
  ];
  const backing = corners((corner) => {
    const [a, b] = cornerSides[corner]!;
    if (a !== 'outside' || b !== 'outside') return 0;
    return isBend ? RADIUS.bend : RADIUS.outer;
  });
  const brick = corners((corner) => {
    const [a, b] = cornerSides[corner]!;
    if (a === 'wall' || b === 'wall') return RADIUS.joint;
    return backing[corner] || RADIUS.inner;
  });
  return { x, y, sides, backing, brick };
}

export function describeWalls(level: Level): Brick[] {
  const bricks: Brick[] = [];
  level.walls.forEach((isWall, index) => {
    if (isWall) bricks.push(describeBrick(level, index));
  });
  return bricks;
}

/** SVG path for a rectangle with per-corner radii, clamped so they always fit. */
export function roundedRectPath(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  radii: Corners,
): string {
  const width = x1 - x0;
  const height = y1 - y0;
  const [nw, ne, se, sw] = radii;
  const scale = Math.min(
    1,
    width / Math.max(nw + ne, 1e-9),
    width / Math.max(sw + se, 1e-9),
    height / Math.max(nw + sw, 1e-9),
    height / Math.max(ne + se, 1e-9),
  );
  const [a, b, c, d] = corners((corner) => round(radii[corner] * scale));
  return [
    `M${round(x0 + a)} ${y0}`,
    `H${round(x1 - b)}`,
    `A${b} ${b} 0 0 1 ${x1} ${round(y0 + b)}`,
    `V${round(y1 - c)}`,
    `A${c} ${c} 0 0 1 ${round(x1 - c)} ${y1}`,
    `H${round(x0 + d)}`,
    `A${d} ${d} 0 0 1 ${x0} ${round(y1 - d)}`,
    `V${round(y0 + a)}`,
    `A${a} ${a} 0 0 1 ${round(x0 + a)} ${y0}`,
    'Z',
  ].join('');
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function shrink(radii: Corners, by: number): Corners {
  return corners((corner) => Math.max(radii[corner] - by, 2));
}

/**
 * Builds the complete wall layer as SVG markup. Drawing order: drop shadows, mortar
 * backing, bricks (front face, top face, gloss), and finally the outline on top so
 * the thick contour is never covered.
 */
export function wallLayerSvg(level: Level): string {
  const bricks = describeWalls(level);
  const shadows: string[] = [];
  const backings: string[] = [];
  const faces: string[] = [];
  const outlines: string[] = [];

  for (const brick of bricks) {
    const x0 = brick.x * CELL;
    const y0 = brick.y * CELL;
    const x1 = x0 + CELL;
    const y1 = y0 + CELL;
    const backing = roundedRectPath(x0, y0, x1, y1, brick.backing);
    shadows.push(`<path d="${backing}"/>`);
    backings.push(`<path d="${backing}"/>`);
    outlines.push(`<path d="${backing}"/>`);

    const inset = (side: Side): number => (side === 'wall' ? JOINT : 0);
    const bx0 = x0 + inset(brick.sides.w);
    const bx1 = x1 - inset(brick.sides.e);
    const by0 = y0 + inset(brick.sides.n);
    const by1 = y1 - inset(brick.sides.s);
    faces.push(
      `<path fill="#b5341a" d="${roundedRectPath(bx0, by0, bx1, by1, brick.brick)}"/>`,
      `<path fill="url(#wall-top)" d="${roundedRectPath(bx0, by0, bx1, by1 - DEPTH, brick.brick)}"/>`,
      `<path fill="url(#wall-gloss)" d="${roundedRectPath(
        bx0 + GLOSS_INSET,
        by0 + GLOSS_INSET,
        bx1 - GLOSS_INSET,
        by1 - DEPTH - GLOSS_INSET,
        shrink(brick.brick, GLOSS_INSET),
      )}"/>`,
    );
  }

  return `<svg class="board__walls" viewBox="0 0 ${level.width * CELL} ${level.height * CELL}"
    preserveAspectRatio="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="wall-top" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ff7a3d"/><stop offset="1" stop-color="#e2461f"/>
    </linearGradient>
    <linearGradient id="wall-gloss" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffb07a" stop-opacity="0.95"/>
      <stop offset="0.45" stop-color="#ff9a5c" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <g fill="#2b0f05" fill-opacity="0.3" transform="translate(4 10)">${shadows.join('')}</g>
  <g fill="#6e1c0a">${backings.join('')}</g>
  <g>${faces.join('')}</g>
  <g fill="none" stroke="#4a1606" stroke-width="6" stroke-linejoin="round">${outlines.join('')}</g>
</svg>`;
}
