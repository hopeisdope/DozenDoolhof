import type { Tier, TierId } from '../levels/definitions';
import type { Progress, Stars } from '../ui/progress';
import {
  DEFAULT_OUTFIT,
  ITEMS,
  itemById,
  SLOTS,
  type ItemId,
  type Outfit,
  type RewardItem,
  type SlotId,
} from './catalog';
import type { Wardrobe } from './wardrobe';

/** The numbers rewards are unlocked by, all derived from the saved progress. */
export interface RewardStats {
  /** Completed levels across all tiers (only ids that still exist count). */
  readonly levels: number;
  /** Sum of the best stars per completed level. */
  readonly stars: number;
  /** Completed and total levels per tier. */
  readonly tiers: ReadonlyMap<TierId, { readonly done: number; readonly total: number }>;
}

export function rewardStats(
  progress: Pick<Progress, 'stars'>,
  tiers: readonly Pick<Tier, 'id' | 'levels'>[],
): RewardStats {
  let levels = 0;
  let stars = 0;
  const perTier = new Map<TierId, { done: number; total: number }>();
  for (const tier of tiers) {
    let done = 0;
    for (const level of tier.levels) {
      const best = progress.stars(level.id);
      if (best > 0) done += 1;
      stars += best;
    }
    levels += done;
    perTier.set(tier.id, { done, total: tier.levels.length });
  }
  return { levels, stars, tiers: perTier };
}

/** How far along the way to `item` the player is, from 0 to 1 (1 = unlocked). */
export function unlockProgress(item: RewardItem, stats: RewardStats): number {
  const { unlock } = item;
  switch (unlock.kind) {
    case 'start':
      return 1;
    case 'levels':
      return Math.min(stats.levels / unlock.count, 1);
    case 'stars':
      return Math.min(stats.stars / unlock.count, 1);
    case 'tier': {
      const tier = stats.tiers.get(unlock.tier);
      return tier && tier.total > 0 ? tier.done / tier.total : 0;
    }
  }
}

export function isUnlocked(item: RewardItem, stats: RewardStats): boolean {
  return unlockProgress(item, stats) >= 1;
}

/**
 * Rewards for the construction worker: which items are unlocked (from the progress),
 * what the worker wears (from the wardrobe, falling back to the original look for any
 * slot whose choice is missing or locked) and which rewards are new.
 */
export class Rewards {
  constructor(
    private readonly progress: Progress,
    private readonly wardrobe: Wardrobe,
    private readonly tiers: readonly Pick<Tier, 'id' | 'levels'>[],
  ) {}

  stats(): RewardStats {
    return rewardStats(this.progress, this.tiers);
  }

  isUnlocked(id: ItemId, stats = this.stats()): boolean {
    const item = itemById(id);
    return item !== undefined && isUnlocked(item, stats);
  }

  /** What the worker wears now; locked or missing choices fall back to the default. */
  outfit(): Outfit {
    const stats = this.stats();
    const pick = (slot: SlotId): ItemId => {
      const chosen = this.wardrobe.chosen(slot);
      return chosen && this.isUnlocked(chosen, stats) ? chosen : DEFAULT_OUTFIT[slot];
    };
    return Object.fromEntries(SLOTS.map((slot) => [slot, pick(slot)])) as Record<SlotId, ItemId>;
  }

  /** Puts an item on; returns false (and changes nothing) when it is still locked. */
  choose(id: ItemId): boolean {
    if (!this.isUnlocked(id)) return false;
    this.wardrobe.choose(id);
    return true;
  }

  /** Unlocked rewards the player has not been shown yet. */
  unseen(): readonly RewardItem[] {
    const stats = this.stats();
    return ITEMS.filter(
      (item) =>
        item.unlock.kind !== 'start' && isUnlocked(item, stats) && !this.wardrobe.hasSeen(item.id),
    );
  }

  markSeen(items: readonly RewardItem[]): void {
    this.wardrobe.markSeen(items.map((item) => item.id as ItemId));
  }

  /**
   * Records a win (like `Progress.complete`) and returns the rewards it unlocked. Those
   * are put on straight away, so the worker shows them at once, and count as seen.
   */
  recordWin(levelId: string, stars: Stars): readonly RewardItem[] {
    const before = this.stats();
    if (!this.progress.complete(levelId, stars)) return [];
    const after = this.stats();
    const fresh = ITEMS.filter((item) => !isUnlocked(item, before) && isUnlocked(item, after));
    for (const item of fresh) this.wardrobe.choose(item.id);
    this.markSeen(fresh);
    return fresh;
  }

  /** Forgets the wardrobe choices; called together with wiping the progress. */
  clear(): void {
    this.wardrobe.clear();
  }
}
