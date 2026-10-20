import type { StorageLike } from '../ui/progress';
import { StoredRecord } from '../ui/stored-record';
import { isItemId, itemById, SLOTS, type ItemId, type SlotId } from './catalog';

export const WARDROBE_KEY = 'dozendoolhof.wardrobe';
export const WARDROBE_VERSION = 1;

/**
 * Storage format, version 1: the chosen item per slot and the rewards the player has
 * already been shown. Which rewards are unlocked is not stored: it follows from the
 * saved progress (see `Rewards`), so the two can never disagree.
 */
export interface WardrobeDataV1 {
  readonly version: 1;
  readonly equipped: Partial<Record<SlotId, ItemId>>;
  readonly seen: readonly ItemId[];
}

/**
 * The saved wardrobe choices. Reading is defensive: unknown ids, items in the wrong slot
 * and damaged data are skipped, so the worker always has something valid to wear.
 */
export class Wardrobe {
  private readonly record: StoredRecord;
  private readonly equipped = new Map<SlotId, ItemId>();
  private readonly seen = new Set<ItemId>();

  constructor(storage: StorageLike | null) {
    this.record = new StoredRecord(storage, WARDROBE_KEY, WARDROBE_VERSION);
    const data = this.record.read();
    if (!data) return;
    const equipped = data.equipped;
    if (typeof equipped === 'object' && equipped !== null && !Array.isArray(equipped)) {
      for (const slot of SLOTS) {
        const id = (equipped as Record<string, unknown>)[slot];
        if (typeof id === 'string' && itemById(id)?.slot === slot && isItemId(id)) {
          this.equipped.set(slot, id);
        }
      }
    }
    if (Array.isArray(data.seen)) {
      for (const id of data.seen) {
        if (typeof id === 'string' && isItemId(id)) this.seen.add(id);
      }
    }
  }

  get persistent(): boolean {
    return this.record.persistent;
  }

  /** The chosen item for a slot, or `undefined` when none was chosen. */
  chosen(slot: SlotId): ItemId | undefined {
    return this.equipped.get(slot);
  }

  choose(id: ItemId): void {
    const item = itemById(id);
    if (!item || this.equipped.get(item.slot) === id) return;
    this.equipped.set(item.slot, id);
    this.save();
  }

  hasSeen(id: ItemId): boolean {
    return this.seen.has(id);
  }

  markSeen(ids: readonly ItemId[]): void {
    const fresh = ids.filter((id) => !this.seen.has(id));
    if (fresh.length === 0) return;
    for (const id of fresh) this.seen.add(id);
    this.save();
  }

  /** Forgets every choice, in memory and in storage. */
  clear(): void {
    this.equipped.clear();
    this.seen.clear();
    this.record.remove();
  }

  toData(): WardrobeDataV1 {
    const equipped: Partial<Record<SlotId, ItemId>> = {};
    for (const slot of SLOTS) {
      const id = this.equipped.get(slot);
      if (id) equipped[slot] = id;
    }
    return { version: WARDROBE_VERSION, equipped, seen: [...this.seen].sort() };
  }

  private save(): void {
    const { equipped, seen } = this.toData();
    this.record.write({ equipped, seen });
  }
}
