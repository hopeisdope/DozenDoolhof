import heroSvg from '../assets/pieces/player.svg?raw';
import { DEFAULT_OUTFIT, type ItemId, type Outfit, type RewardItem } from '../rewards/catalog';

/**
 * The construction worker's artwork with the wardrobe applied. `player.svg` stays the
 * single source of the rig; this module recolours its helmet and shirt (a palette swap
 * on known colours) and fills its empty `hero__deco` / `hero__tool` groups. The result is
 * plain SVG with literal colours, so it renders the same everywhere (no CSS variables in
 * gradients, no filters). Markup is generated from constants only.
 */

type Hex = `#${string}`;

interface HelmetArt {
  readonly top: Hex;
  readonly mid: Hex;
  readonly bottom: Hex;
  readonly ridge: Hex;
  readonly ridgeLight: Hex;
  readonly seam: Hex;
  readonly brim: Hex;
  readonly shine: Hex;
  /** Twinkling sparkles around the helmet. */
  readonly sparkle?: boolean;
}

interface ShirtArt {
  readonly top: Hex;
  readonly bottom: Hex;
}

type HelmetId = Extract<ItemId, `helmet-${string}`>;
type ShirtId = Extract<ItemId, `shirt-${string}`>;
type StickerId = Extract<ItemId, `sticker-${string}`>;
type ToolId = Extract<ItemId, `tool-${string}`>;

const OUTLINE = '#3b1d0e';

/** The yellow helmet as drawn in `player.svg`; every other helmet replaces these. */
const HELMETS: Record<HelmetId, HelmetArt> = {
  'helmet-yellow': {
    top: '#ffe866',
    mid: '#ffc61a',
    bottom: '#f0a400',
    ridge: '#d99100',
    ridgeLight: '#ffe680',
    seam: '#e0a000',
    brim: '#f2b000',
    shine: '#fff8c4',
  },
  'helmet-red': {
    top: '#ff9a84',
    mid: '#f24a32',
    bottom: '#c9301c',
    ridge: '#a82512',
    ridgeLight: '#ffc2b4',
    seam: '#c7321e',
    brim: '#db3a24',
    shine: '#ffe5de',
  },
  'helmet-blue': {
    top: '#9ad8ff',
    mid: '#3fa2ec',
    bottom: '#1f72c6',
    ridge: '#195aa0',
    ridgeLight: '#c4e8ff',
    seam: '#1f68b5',
    brim: '#2b82d8',
    shine: '#eef9ff',
  },
  'helmet-gold': {
    top: '#fff4b8',
    mid: '#f5c02a',
    bottom: '#b87200',
    ridge: '#9a5f00',
    ridgeLight: '#fff8d6',
    seam: '#b07000',
    brim: '#d59400',
    shine: '#ffffff',
    sparkle: true,
  },
};

/** The orange shirt as drawn in `player.svg`. */
const SHIRTS: Record<ShirtId, ShirtArt> = {
  'shirt-orange': { top: '#ff8a3d', bottom: '#e5500f' },
  'shirt-green': { top: '#8be05a', bottom: '#3a9a1a' },
  'shirt-purple': { top: '#c290ff', bottom: '#7642d0' },
  'shirt-pink': { top: '#ff9fd0', bottom: '#e04a95' },
};

/** Stickers, drawn around (0, 0) within a radius of about 6.5. */
const STICKERS: Record<StickerId, string> = {
  'sticker-none': '',
  'sticker-star':
    '<path d="M0-6.8 2 -2.3 6.6-2.1 3.1 1 4.2 5.6 0 3.1-4.2 5.6-3.1 1-6.6-2.1-2-2.3z" ' +
    'fill="#ffcf24" stroke-linejoin="round"/>',
  'sticker-heart':
    '<path d="M0 5.6C-4.5 2.4-7 -0.4-7-3.1-7-5.4-5.3-6.8-3.4-6.8-1.9-6.8-0.6-5.9 0-4.6 ' +
    '0.6-5.9 1.9-6.8 3.4-6.8 5.3-6.8 7-5.4 7-3.1 7-0.4 4.5 2.4 0 5.6z" fill="#ff4f6d"/>' +
    '<path d="M-4.3-4.2q1-1 2.2-.6" fill="none" stroke="#ffd1da" stroke-width="1.2" ' +
    'stroke-linecap="round"/>',
  'sticker-flower':
    [0, 72, 144, 216, 288]
      .map(
        (angle) => `<circle cx="0" cy="-3.9" r="2.9" fill="#ff8fd6" transform="rotate(${angle})"/>`,
      )
      .join('') + '<circle r="2.4" fill="#ffcf24"/>',
};

/** Tools, drawn with the grip at (0, 0) and pointing up (negative y). */
const TOOLS: Record<ToolId, string> = {
  'tool-none': '',
  'tool-hammer':
    '<rect x="-2.3" y="-17" width="4.6" height="23" rx="2.3" fill="#c97d3c"/>' +
    '<path d="M-9-25.5h13.5q4.5 0 4.5 4.5t-4.5 4.5H-9z" fill="#aebbc8"/>' +
    '<path d="M-6-22.5h8.5" fill="none" stroke="#ffffff" stroke-width="1.6" ' +
    'stroke-linecap="round"/>',
  'tool-wrench':
    '<rect x="-2.4" y="-16" width="4.8" height="22" rx="2.4" fill="#c3ced8"/>' +
    '<path d="M-2.4-14 -6.6-18Q-8.8-24.5-4.4-28L-2.1-22.6H2.1L4.4-28Q8.8-24.5 6.6-18L2.4-14z" ' +
    'fill="#c3ced8" stroke-linejoin="round"/>' +
    '<path d="M-0.6-11v13" fill="none" stroke="#ffffff" stroke-width="1.4" ' +
    'stroke-linecap="round"/>',
  'tool-shovel':
    '<rect x="-2" y="-15" width="4" height="21" rx="2" fill="#c97d3c"/>' +
    '<path d="M-7-14h14v-6.5q0-6.5-7-10-7 3.5-7 10z" fill="#ef4b3a" stroke-linejoin="round"/>' +
    '<path d="M-3.8-22q.5-3 3-4.6" fill="none" stroke="#ffd0c8" stroke-width="1.5" ' +
    'stroke-linecap="round"/>',
};

/** A small four-pointed sparkle around (0, 0). */
const SPARKLE = '<path d="M0-4.2 1.1-1.1 4.2 0 1.1 1.1 0 4.2-1.1 1.1-4.2 0-1.1-1.1z"/>';

type View = 'front' | 'back' | 'side';

/** Where the decorations sit in each view, in the head group's coordinates. */
const STICKER_AT: Record<View, string> = {
  front: 'translate(61.5 27.5)',
  back: 'translate(61.5 27.5)',
  side: 'translate(64.5 27)',
};

const SPARKLES_AT: Record<View, readonly string[]> = {
  front: ['translate(27 21)', 'translate(74 17) scale(0.75)'],
  back: ['translate(27 21)', 'translate(74 17) scale(0.75)'],
  side: ['translate(30 21)', 'translate(78 19) scale(0.75)'],
};

/** Where the tool is held: in a hand of the idle pose, pointing up and away. */
const TOOL_AT: Record<View, string> = {
  front: 'translate(70.5 74) rotate(35)',
  back: 'translate(29.5 74) scale(-1 1) rotate(35)',
  side: 'translate(50.5 74) rotate(72)',
};

function helmetOf(outfit: Outfit): HelmetArt {
  return HELMETS[outfit.helmet as HelmetId] ?? HELMETS['helmet-yellow'];
}

function shirtOf(outfit: Outfit): ShirtArt {
  return SHIRTS[outfit.shirt as ShirtId] ?? SHIRTS['shirt-orange'];
}

/** Replaces each `from` colour (as a quoted attribute value) with its `to` colour. */
function swapColours(svg: string, pairs: readonly (readonly [Hex, Hex])[]): string {
  const map = new Map(pairs.map(([from, to]) => [from.toLowerCase(), to]));
  return svg.replace(/"(#[0-9a-f]{6})"/gi, (match, colour: string) => {
    const to = map.get(colour.toLowerCase());
    return to ? `"${to}"` : match;
  });
}

function decoration(outfit: Outfit, view: View): string {
  const parts: string[] = [];
  if (helmetOf(outfit).sparkle) {
    parts.push(
      ...SPARKLES_AT[view].map(
        (at) =>
          `<g class="hero__sparkle" transform="${at}" fill="#ffffff" stroke-width="1.1">${SPARKLE}</g>`,
      ),
    );
  }
  const sticker = STICKERS[outfit.sticker as StickerId] ?? '';
  if (sticker) {
    parts.push(`<g class="hero__sticker" transform="${STICKER_AT[view]}" stroke-width="1.4">
      ${sticker}</g>`);
  }
  return parts.join('');
}

function tool(outfit: Outfit, view: View): string {
  const shape = TOOLS[outfit.tool as ToolId] ?? '';
  return shape ? `<g transform="${TOOL_AT[view]}" stroke-width="2">${shape}</g>` : '';
}

let instances = 0;

/**
 * The worker's SVG wearing `outfit`. Gradient ids get a per-copy prefix (the SVG is
 * inlined, and ids are global to the page), so copies with different outfits can sit
 * side by side, as in the wardrobe.
 */
export function heroMarkup(outfit: Outfit = DEFAULT_OUTFIT, prefix = `hero${++instances}`): string {
  const helmet = helmetOf(outfit);
  const shirt = shirtOf(outfit);
  const base = HELMETS['helmet-yellow'];
  const baseShirt = SHIRTS['shirt-orange'];
  let svg = swapColours(heroSvg, [
    [base.top, helmet.top],
    [base.mid, helmet.mid],
    [base.bottom, helmet.bottom],
    [base.ridge, helmet.ridge],
    [base.ridgeLight, helmet.ridgeLight],
    [base.seam, helmet.seam],
    [base.brim, helmet.brim],
    [base.shine, helmet.shine],
    [baseShirt.top, shirt.top],
    [baseShirt.bottom, shirt.bottom],
  ]);
  svg = svg.replace(/id="hero-/g, `id="${prefix}-`).replace(/url\(#hero-/g, `url(#${prefix}-`);
  for (const view of ['front', 'back', 'side'] as const) {
    svg = svg
      .replace(
        `<g class="hero__deco hero__deco--${view}"/>`,
        `<g class="hero__deco hero__deco--${view}">${decoration(outfit, view)}</g>`,
      )
      .replace(
        `<g class="hero__tool hero__tool--${view}"/>`,
        `<g class="hero__tool hero__tool--${view}">${tool(outfit, view)}</g>`,
      );
  }
  return svg;
}

/** Every fill and colour except the outline becomes one flat colour: a locked item. */
function silhouette(svg: string): string {
  return svg.replace(/(fill|stroke|stop-color)="(#[0-9a-f]{6})"/gi, (match, attribute, colour) =>
    colour.toLowerCase() === OUTLINE ? match : `${attribute}="#4d6a8a"`,
  );
}

function gradient(id: string, top: Hex, bottom: Hex): string {
  return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/>
    </linearGradient></defs>`;
}

function iconBody(item: RewardItem, id: string): string {
  const key = item.id as ItemId;
  if (item.slot === 'helmet') {
    const art = HELMETS[key as HelmetId];
    return `${gradient(id, art.top, art.bottom)}<g transform="translate(20 22) scale(1.12) translate(-20 -22)">
      <path d="M7 27a13 13 0 0 1 26 0z" fill="url(#${id})"/>
      <path d="M20 12.5v13" stroke="${art.ridge}" stroke-width="4.5" stroke-linecap="round"/>
      <path d="M20 14v10" stroke="${art.ridgeLight}" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M4 27.5q0-3 4-3h24q4 0 4 3t-4 3H8q-4 0-4-3z" fill="${art.brim}"/>
      <path d="M11.5 21.5q1.2-4.5 5.5-6.5" fill="none" stroke="${art.shine}" stroke-width="2.2"
        stroke-linecap="round"/>
      ${art.sparkle ? `<g fill="#ffffff" stroke-width="1"><g transform="translate(7 12)">${SPARKLE}</g><g transform="translate(34 9) scale(0.8)">${SPARKLE}</g></g>` : ''}</g>`;
  }
  if (item.slot === 'shirt') {
    const art = SHIRTS[key as ShirtId];
    return `${gradient(id, art.top, art.bottom)}
      <path d="M14 8 5 13l3.5 7.5 4.5-2.2V33h14V18.3l4.5 2.2L35 13l-9-5q-1.5 4-6 4t-6-4z"
        fill="url(#${id})"/>
      <path d="M16 9.5q1.5 3 4 3t4-3" fill="none" stroke-width="1.6"/>`;
  }
  if (item.slot === 'sticker') {
    const shape = STICKERS[key as StickerId];
    return shape
      ? `<g transform="translate(20 20) scale(2.2)" stroke-width="1">${shape}</g>`
      : NOTHING;
  }
  const shape = TOOLS[key as ToolId];
  return shape
    ? `<g transform="translate(13.5 32.5) rotate(35) scale(0.95)" stroke-width="2">${shape}</g>`
    : NOTHING;
}

/** "Nothing in this slot": an empty dashed ring. */
const NOTHING = `<circle cx="20" cy="20" r="11" fill="none" stroke="#ffffff" stroke-width="3"
  stroke-dasharray="5 4.4" stroke-linecap="round"/>`;

/** A picture of one wardrobe item for its button; `locked` draws it as a silhouette. */
export function itemIcon(item: RewardItem, locked = false): string {
  const svg = `<svg class="item-icon" viewBox="0 0 40 40" aria-hidden="true"
    stroke="${OUTLINE}" stroke-width="2.4" stroke-linejoin="round">${iconBody(item, `icon${++instances}`)}</svg>`;
  return locked ? silhouette(svg) : svg;
}
