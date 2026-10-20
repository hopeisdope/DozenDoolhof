import { describe, expect, it } from 'vitest';
import heroSvg from '../../src/assets/pieces/player.svg?raw';
import { heroMarkup, itemIcon } from '../../src/render/hero';
import { DEFAULT_OUTFIT, ITEMS, type Outfit } from '../../src/rewards/catalog';

/** The colours `hero.ts` swaps: the yellow helmet and the orange shirt of `player.svg`. */
const HELMET_COLOURS = [
  '#ffe866',
  '#ffc61a',
  '#f0a400',
  '#d99100',
  '#ffe680',
  '#e0a000',
  '#f2b000',
  '#fff8c4',
];
const SHIRT_COLOURS = ['#ff8a3d', '#e5500f'];

const FANCY: Outfit = {
  helmet: 'helmet-gold',
  shirt: 'shirt-purple',
  sticker: 'sticker-heart',
  tool: 'tool-wrench',
};

const count = (text: string, part: string) => text.split(part).length - 1;

describe('heroMarkup', () => {
  it('draws the default outfit exactly as player.svg, apart from the id prefix', () => {
    const markup = heroMarkup(DEFAULT_OUTFIT, 'p1');
    const expected = heroSvg
      .replace(/id="hero-/g, 'id="p1-')
      .replace(/url\(#hero-/g, 'url(#p1-')
      .replace(
        /<g class="(hero__(?:deco|tool) hero__(?:deco|tool)--\w+)"\/>/g,
        '<g class="$1"></g>',
      );
    expect(markup).toBe(expected);
  });

  it('finds every colour it swaps in player.svg, used for nothing else', () => {
    for (const colour of [...HELMET_COLOURS, ...SHIRT_COLOURS]) {
      expect(heroSvg.toLowerCase()).toContain(`"${colour}"`);
    }
    // Each swapped colour sits only inside the helmet or the shirt gradient: replacing them
    // must leave skin, hair, trousers and shoes as they were.
    const fancy = heroMarkup({ ...FANCY, sticker: 'sticker-none', tool: 'tool-none' }, 'p');
    for (const colour of [...HELMET_COLOURS, ...SHIRT_COLOURS]) {
      expect(fancy.toLowerCase()).not.toContain(`"${colour}"`);
    }
    for (const kept of ['#ffd9b3', '#4a8cf0', '#8a5130', '#7d4524']) {
      expect(count(fancy, kept)).toBe(count(heroSvg, kept));
    }
  });

  it('gives every copy its own gradient ids, so different outfits can share a page', () => {
    const a = heroMarkup(DEFAULT_OUTFIT);
    const b = heroMarkup(FANCY);
    const ids = (markup: string) => [...markup.matchAll(/id="([^"]+)"/g)].map((m) => m[1]);
    expect(ids(a).length).toBeGreaterThan(0);
    expect(ids(a).filter((id) => ids(b).includes(id))).toEqual([]);
    for (const markup of [a, b]) {
      expect(markup).not.toContain('#hero-');
      for (const [, ref] of markup.matchAll(/url\(#([^)]+)\)/g)) expect(ids(markup)).toContain(ref);
    }
  });

  it('puts the sticker and tool in all three views, and sparkles on the gold helmet', () => {
    const markup = heroMarkup(FANCY, 'p');
    expect(count(markup, 'class="hero__sticker"')).toBe(3);
    expect(count(markup, 'class="hero__sparkle"')).toBe(6);
    for (const view of ['front', 'back', 'side']) {
      expect(markup).toMatch(new RegExp(`hero__tool--${view}"><g transform="[^"]+"`));
      expect(markup).toMatch(new RegExp(`hero__deco--${view}">\\s*<g class="hero__sparkle"`));
    }
    const plain = heroMarkup(DEFAULT_OUTFIT, 'p');
    expect(plain).not.toContain('hero__sticker"');
    expect(plain).not.toContain('hero__sparkle');
  });

  it('keeps the tool in the idle hands, so it disappears while pushing', () => {
    const markup = heroMarkup(FANCY, 'p');
    for (const view of ['front', 'back']) {
      const idle = markup.indexOf(`<g class="hero__tool hero__tool--${view}">`);
      const arms = markup.lastIndexOf('<g class="hero__arms--idle">', idle);
      expect(arms).toBeGreaterThan(-1);
      expect(markup.indexOf('hero__arms--push', arms)).toBeGreaterThan(idle);
    }
  });
});

describe('itemIcon', () => {
  it('draws a picture for every item, and a dark silhouette when locked', () => {
    for (const item of ITEMS) {
      const icon = itemIcon(item);
      expect(icon).toMatch(/^<svg class="item-icon"/);
      expect(icon).not.toContain('undefined');
      const locked = itemIcon(item, true);
      const colours = new Set(
        [...locked.matchAll(/(?:fill|stroke|stop-color)="(#[0-9a-f]{6})"/gi)].map((m) => m[1]),
      );
      for (const colour of colours) expect(['#3b1d0e', '#4d6a8a']).toContain(colour);
    }
  });

  it('gives different items different pictures', () => {
    const strip = (svg: string) => svg.replace(/icon\d+/g, 'icon');
    const pictures = ITEMS.map((item) => strip(itemIcon(item)));
    expect(new Set(pictures).size).toBe(ITEMS.length - 1); // both "nothing" items share one
  });
});
