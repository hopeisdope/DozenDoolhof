import { describe, expect, it } from 'vitest';
import { TIERS } from '../../src/levels/definitions';
import {
  DEFAULT_OUTFIT,
  ITEMS,
  itemById,
  itemsInSlot,
  SLOTS,
  type ItemId,
} from '../../src/rewards/catalog';
import { Rewards, rewardStats, unlockProgress } from '../../src/rewards/rewards';
import { Wardrobe, WARDROBE_KEY } from '../../src/rewards/wardrobe';
import { Progress, STORAGE_KEY } from '../../src/ui/progress';
import { MemoryStorage } from '../helpers/storage';

const [EASY, MEDIUM] = TIERS as [(typeof TIERS)[number], (typeof TIERS)[number]];
const easyIds = EASY.levels.map((level) => level.id);
const mediumIds = MEDIUM.levels.map((level) => level.id);
const TOTAL_LEVELS = TIERS.reduce((sum, tier) => sum + tier.levels.length, 0);

function setup(storage = new MemoryStorage()) {
  const progress = new Progress(storage);
  const rewards = new Rewards(progress, new Wardrobe(storage), TIERS);
  return { storage, progress, rewards };
}

function item(id: ItemId) {
  const found = itemById(id);
  if (!found) throw new Error(id);
  return found;
}

describe('reward catalog', () => {
  it('has unique ids, each starting with its slot name', () => {
    const ids = ITEMS.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const entry of ITEMS) expect(entry.id.startsWith(`${entry.slot}-`)).toBe(true);
  });

  it('gives every slot exactly one item worn from the start: the default outfit', () => {
    for (const slot of SLOTS) {
      const starters = itemsInSlot(slot).filter((entry) => entry.unlock.kind === 'start');
      expect(starters.map((entry) => entry.id)).toEqual([DEFAULT_OUTFIT[slot]]);
      // The default comes first in its row of the wardrobe.
      expect(itemsInSlot(slot)[0]?.id).toBe(DEFAULT_OUTFIT[slot]);
    }
  });

  it('only asks for things that can be reached in the game', () => {
    for (const entry of ITEMS) {
      const { unlock } = entry;
      if (unlock.kind === 'levels') {
        expect(unlock.count).toBeGreaterThan(0);
        expect(unlock.count).toBeLessThanOrEqual(TOTAL_LEVELS);
      } else if (unlock.kind === 'stars') {
        expect(unlock.count).toBeLessThanOrEqual(TOTAL_LEVELS * 3);
      } else if (unlock.kind === 'tier') {
        expect(TIERS.map((tier) => tier.id)).toContain(unlock.tier);
      }
    }
  });

  it('is mostly about completed levels, with the first reward after the first win', () => {
    const rewards = ITEMS.filter((entry) => entry.unlock.kind !== 'start');
    const byLevels = rewards.filter((entry) => entry.unlock.kind === 'levels');
    expect(byLevels.length).toBeGreaterThan(rewards.length / 2);
    expect(Math.min(...byLevels.map((entry) => (entry.unlock as { count: number }).count))).toBe(1);
  });

  it('every item can be unlocked by playing everything with three stars', () => {
    const { progress, rewards } = setup();
    for (const tier of TIERS) for (const level of tier.levels) progress.complete(level.id, 3);
    for (const entry of ITEMS) expect(rewards.isUnlocked(entry.id)).toBe(true);
  });
});

describe('reward stats and unlocking', () => {
  it('counts completed levels, stars and finished tiers from the progress', () => {
    const { progress } = setup();
    progress.complete(easyIds[0]!, 3);
    progress.complete(easyIds[1]!, 1);
    progress.complete(mediumIds[0]!, 2);
    progress.complete('unknown-99', 3); // an id that no longer exists does not count
    const stats = rewardStats(progress, TIERS);
    expect(stats.levels).toBe(3);
    expect(stats.stars).toBe(6);
    expect(stats.tiers.get('easy')).toEqual({ done: 2, total: easyIds.length });
    expect(stats.tiers.get('medium')).toEqual({ done: 1, total: mediumIds.length });
  });

  it('measures the way to a locked item from 0 to 1', () => {
    const { progress } = setup();
    for (const id of easyIds.slice(0, 4)) progress.complete(id, 3);
    const stats = rewardStats(progress, TIERS);
    expect(unlockProgress(item('helmet-red'), stats)).toBe(1); // 3 levels
    expect(unlockProgress(item('shirt-green'), stats)).toBe(4 / 8);
    expect(unlockProgress(item('shirt-pink'), stats)).toBe(12 / 100); // stars
    expect(unlockProgress(item('tool-shovel'), stats)).toBe(4 / easyIds.length); // tier
    expect(unlockProgress(item('helmet-gold'), stats)).toBe(0);
    expect(unlockProgress(item('helmet-yellow'), stats)).toBe(1);
  });

  it('unlocks by levels, by finishing a tier and, as a bonus, by stars', () => {
    const { progress, rewards } = setup();
    expect(rewards.isUnlocked('sticker-star')).toBe(false);
    progress.complete(easyIds[0]!, 1);
    expect(rewards.isUnlocked('sticker-star')).toBe(true);

    for (const id of easyIds) progress.complete(id, 1);
    expect(rewards.isUnlocked('tool-shovel')).toBe(true); // all of Makkelijk
    expect(rewards.isUnlocked('helmet-gold')).toBe(false);
    expect(rewards.isUnlocked('shirt-pink')).toBe(false); // 40 stars so far
    for (const id of easyIds) progress.complete(id, 3);
    expect(rewards.isUnlocked('shirt-pink')).toBe(true); // 120 stars
  });
});

describe('Rewards', () => {
  it('wears the default outfit with no progress', () => {
    const { rewards } = setup();
    expect(rewards.outfit()).toEqual(DEFAULT_OUTFIT);
    expect(rewards.unseen()).toEqual([]);
  });

  it('refuses locked items and keeps unlocked choices', () => {
    const { progress, rewards } = setup();
    expect(rewards.choose('helmet-red')).toBe(false);
    expect(rewards.outfit().helmet).toBe('helmet-yellow');
    for (const id of easyIds.slice(0, 3)) progress.complete(id, 3);
    expect(rewards.choose('helmet-red')).toBe(true);
    expect(rewards.choose('sticker-star')).toBe(true);
    expect(rewards.outfit()).toEqual({
      ...DEFAULT_OUTFIT,
      helmet: 'helmet-red',
      sticker: 'sticker-star',
    });
    // Back to the default is always allowed.
    expect(rewards.choose('sticker-none')).toBe(true);
    expect(rewards.outfit().sticker).toBe('sticker-none');
  });

  it('a win that reaches a milestone returns the reward, puts it on and counts it as seen', () => {
    const { progress, rewards } = setup();
    expect(rewards.recordWin(easyIds[0]!, 3).map((entry) => entry.id)).toEqual(['sticker-star']);
    expect(progress.stars(easyIds[0]!)).toBe(3);
    expect(rewards.outfit().sticker).toBe('sticker-star');
    expect(rewards.unseen()).toEqual([]);

    // No milestone: nothing new. Replaying the same level the same way: nothing at all.
    expect(rewards.recordWin(easyIds[1]!, 3)).toEqual([]);
    expect(rewards.recordWin(easyIds[1]!, 3)).toEqual([]);
    expect(rewards.recordWin(easyIds[2]!, 2).map((entry) => entry.id)).toEqual(['helmet-red']);
    expect(rewards.outfit()).toEqual({
      ...DEFAULT_OUTFIT,
      helmet: 'helmet-red',
      sticker: 'sticker-star',
    });
  });

  it('a better replay can unlock a star bonus', () => {
    const { progress, rewards } = setup();
    for (const id of easyIds) progress.complete(id, 2); // 80 stars
    for (const id of mediumIds.slice(0, 9)) progress.complete(id, 2); // 98 stars
    expect(rewards.isUnlocked('shirt-pink')).toBe(false);
    expect(rewards.recordWin(easyIds[0]!, 3)).toEqual([]); // 99
    expect(rewards.recordWin(easyIds[1]!, 3).map((entry) => entry.id)).toEqual(['shirt-pink']);
    expect(rewards.outfit().shirt).toBe('shirt-pink');
  });

  it('existing progress unlocks rewards at once; they are new until shown', () => {
    const storage = new MemoryStorage();
    // Progress saved by the game before rewards existed.
    const bestStars = Object.fromEntries(easyIds.slice(0, 6).map((id) => [id, 3]));
    storage.items.set(STORAGE_KEY, JSON.stringify({ version: 1, bestStars }));
    const { rewards, progress } = setup(storage);
    expect(progress.countCompleted(easyIds)).toBe(6);
    expect(rewards.unseen().map((entry) => entry.id)).toEqual([
      'helmet-red',
      'sticker-star',
      'tool-hammer',
    ]);
    // Nothing is put on by itself.
    expect(rewards.outfit()).toEqual(DEFAULT_OUTFIT);
    rewards.markSeen(rewards.unseen());
    expect(rewards.unseen()).toEqual([]);
    // The saved progress itself is untouched.
    expect(storage.json(STORAGE_KEY)).toEqual({ version: 1, bestStars });
    expect(setup(storage).rewards.unseen()).toEqual([]);
  });

  it('keeps the outfit across a reload', () => {
    const { storage, rewards } = setup();
    rewards.recordWin(easyIds[0]!, 3);
    rewards.recordWin(easyIds[1]!, 3);
    rewards.recordWin(easyIds[2]!, 3);
    rewards.choose('sticker-none');
    const reloaded = setup(storage).rewards;
    expect(reloaded.outfit()).toEqual({ ...DEFAULT_OUTFIT, helmet: 'helmet-red' });
    expect(reloaded.unseen()).toEqual([]);
  });

  it('falls back to the default when a worn item gets locked again (progress wiped)', () => {
    const { storage, progress, rewards } = setup();
    for (const id of easyIds.slice(0, 3)) rewards.recordWin(id, 3);
    expect(rewards.outfit().helmet).toBe('helmet-red');
    progress.clear();
    expect(rewards.outfit()).toEqual(DEFAULT_OUTFIT);
    rewards.clear();
    expect(storage.items.has(WARDROBE_KEY)).toBe(false);
    expect(setup(storage).rewards.outfit()).toEqual(DEFAULT_OUTFIT);
  });

  it('works without any storage', () => {
    const progress = new Progress(null);
    const rewards = new Rewards(progress, new Wardrobe(null), TIERS);
    expect(rewards.recordWin(easyIds[0]!, 3).map((entry) => entry.id)).toEqual(['sticker-star']);
    expect(rewards.outfit().sticker).toBe('sticker-star');
  });
});
