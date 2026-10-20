import type { TierId } from '../levels/definitions';

/**
 * The construction worker's wardrobe: every cosmetic item, which slot it fills and what
 * unlocks it. Items only change how the worker looks, never how the game plays.
 *
 * To add an item: append it here (ids are stable; the saved outfit refers to them) and
 * give it artwork in `src/render/hero.ts`; the compiler insists on both.
 */

export type SlotId = 'helmet' | 'shirt' | 'sticker' | 'tool';

/** Display order of the slots in the wardrobe. */
export const SLOTS: readonly SlotId[] = ['helmet', 'shirt', 'sticker', 'tool'];

export type Unlock =
  /** Worn from the start; the safe fallback for its slot. */
  | { readonly kind: 'start' }
  /** This many levels completed, across all tiers. */
  | { readonly kind: 'levels'; readonly count: number }
  /** Every level of a tier completed. */
  | { readonly kind: 'tier'; readonly tier: TierId }
  /** This many stars in total (best result per level): a bonus for playing well. */
  | { readonly kind: 'stars'; readonly count: number };

export interface RewardItem {
  readonly id: string;
  readonly slot: SlotId;
  /** Dutch name, for screen readers only; the wardrobe itself shows pictures. */
  readonly name: string;
  readonly unlock: Unlock;
}

/**
 * In wardrobe order per slot. Rewards come mainly from completed levels, early and often
 * at first; finishing a tier and collecting stars give a few extras.
 */
export const ITEMS = [
  { id: 'helmet-yellow', slot: 'helmet', name: 'Gele helm', unlock: { kind: 'start' } },
  { id: 'helmet-red', slot: 'helmet', name: 'Rode helm', unlock: { kind: 'levels', count: 3 } },
  { id: 'helmet-blue', slot: 'helmet', name: 'Blauwe helm', unlock: { kind: 'levels', count: 16 } },
  {
    id: 'helmet-gold',
    slot: 'helmet',
    name: 'Gouden helm',
    unlock: { kind: 'tier', tier: 'medium' },
  },
  { id: 'shirt-orange', slot: 'shirt', name: 'Oranje shirt', unlock: { kind: 'start' } },
  { id: 'shirt-green', slot: 'shirt', name: 'Groen shirt', unlock: { kind: 'levels', count: 8 } },
  { id: 'shirt-purple', slot: 'shirt', name: 'Paars shirt', unlock: { kind: 'levels', count: 25 } },
  { id: 'shirt-pink', slot: 'shirt', name: 'Roze shirt', unlock: { kind: 'stars', count: 100 } },
  { id: 'sticker-none', slot: 'sticker', name: 'Geen sticker', unlock: { kind: 'start' } },
  {
    id: 'sticker-star',
    slot: 'sticker',
    name: 'Stersticker',
    unlock: { kind: 'levels', count: 1 },
  },
  {
    id: 'sticker-heart',
    slot: 'sticker',
    name: 'Hartjessticker',
    unlock: { kind: 'levels', count: 12 },
  },
  {
    id: 'sticker-flower',
    slot: 'sticker',
    name: 'Bloemensticker',
    unlock: { kind: 'levels', count: 30 },
  },
  { id: 'tool-none', slot: 'tool', name: 'Geen gereedschap', unlock: { kind: 'start' } },
  { id: 'tool-hammer', slot: 'tool', name: 'Hamer', unlock: { kind: 'levels', count: 5 } },
  { id: 'tool-wrench', slot: 'tool', name: 'Moersleutel', unlock: { kind: 'levels', count: 20 } },
  { id: 'tool-shovel', slot: 'tool', name: 'Schep', unlock: { kind: 'tier', tier: 'easy' } },
] as const satisfies readonly RewardItem[];

export type ItemId = (typeof ITEMS)[number]['id'];

/** What the worker wears: one item per slot. */
export type Outfit = { readonly [S in SlotId]: ItemId };

/** The original look; every slot falls back to it. */
export const DEFAULT_OUTFIT: Outfit = {
  helmet: 'helmet-yellow',
  shirt: 'shirt-orange',
  sticker: 'sticker-none',
  tool: 'tool-none',
};

const BY_ID = new Map<string, RewardItem>(ITEMS.map((item) => [item.id, item]));

export function itemById(id: string): RewardItem | undefined {
  return BY_ID.get(id);
}

export function itemsInSlot(slot: SlotId): readonly RewardItem[] {
  return ITEMS.filter((item) => item.slot === slot);
}

/** The outfit as one readable string, for test hooks: `helmet-red shirt-orange …`. */
export function outfitKey(outfit: Outfit): string {
  return SLOTS.map((slot) => outfit[slot]).join(' ');
}

export function isItemId(id: string): id is ItemId {
  return BY_ID.has(id);
}
