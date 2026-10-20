import { describe, expect, it } from 'vitest';
import { Wardrobe, WARDROBE_KEY, WARDROBE_VERSION } from '../../src/rewards/wardrobe';
import { StoredRecord } from '../../src/ui/stored-record';
import { MemoryStorage } from '../helpers/storage';

describe('Wardrobe storage', () => {
  it('saves choices and seen rewards at once, versioned, and loads them again', () => {
    const storage = new MemoryStorage();
    const wardrobe = new Wardrobe(storage);
    expect(wardrobe.persistent).toBe(true);
    wardrobe.choose('helmet-red');
    wardrobe.choose('tool-hammer');
    wardrobe.markSeen(['tool-hammer', 'helmet-red']);
    expect(storage.json(WARDROBE_KEY)).toEqual({
      version: WARDROBE_VERSION,
      equipped: { helmet: 'helmet-red', tool: 'tool-hammer' },
      seen: ['helmet-red', 'tool-hammer'],
    });
    const reloaded = new Wardrobe(storage);
    expect(reloaded.chosen('helmet')).toBe('helmet-red');
    expect(reloaded.chosen('tool')).toBe('tool-hammer');
    expect(reloaded.chosen('shirt')).toBeUndefined();
    expect(reloaded.hasSeen('helmet-red')).toBe(true);
    expect(reloaded.hasSeen('sticker-star')).toBe(false);
  });

  it('does not write when nothing changes', () => {
    const storage = new MemoryStorage();
    const wardrobe = new Wardrobe(storage);
    wardrobe.markSeen([]);
    expect(storage.items.has(WARDROBE_KEY)).toBe(false);
    wardrobe.choose('helmet-red');
    const before = storage.items.get(WARDROBE_KEY);
    storage.items.set(WARDROBE_KEY, 'sentinel');
    wardrobe.choose('helmet-red');
    wardrobe.markSeen([]);
    expect(storage.items.get(WARDROBE_KEY)).toBe('sentinel');
    expect(before).toBeDefined();
  });

  it('skips unknown ids, items in the wrong slot and junk, keeping what is valid', () => {
    const storage = new MemoryStorage();
    storage.items.set(
      WARDROBE_KEY,
      JSON.stringify({
        version: 1,
        equipped: { helmet: 'helmet-pirate', shirt: 'helmet-red', tool: 'tool-wrench', hat: 'x' },
        seen: ['sticker-star', 42, 'sticker-alien', null],
      }),
    );
    const wardrobe = new Wardrobe(storage);
    expect(wardrobe.chosen('helmet')).toBeUndefined();
    expect(wardrobe.chosen('shirt')).toBeUndefined();
    expect(wardrobe.chosen('tool')).toBe('tool-wrench');
    expect(wardrobe.hasSeen('sticker-star')).toBe(true);
  });

  for (const damaged of [
    '{"version":1,"equipped":{"helm',
    'null',
    '[]',
    '"text"',
    '{"equipped":{"helmet":"helmet-red"}}',
    '{"version":1,"equipped":[],"seen":{}}',
  ]) {
    it(`starts empty on damaged data: ${damaged}`, () => {
      const storage = new MemoryStorage();
      storage.items.set(WARDROBE_KEY, damaged);
      const wardrobe = new Wardrobe(storage);
      expect(wardrobe.persistent).toBe(true);
      expect(wardrobe.chosen('helmet')).toBeUndefined();
      wardrobe.choose('helmet-blue');
      expect(new Wardrobe(storage).chosen('helmet')).toBe('helmet-blue');
    });
  }

  it('never overwrites a wardrobe saved by a newer version of the game', () => {
    const storage = new MemoryStorage();
    const future = JSON.stringify({ version: WARDROBE_VERSION + 1, outfit: ['cape'] });
    storage.items.set(WARDROBE_KEY, future);
    const wardrobe = new Wardrobe(storage);
    expect(wardrobe.persistent).toBe(false);
    wardrobe.choose('helmet-red');
    wardrobe.clear();
    expect(storage.items.get(WARDROBE_KEY)).toBe(future);
    // It still works for this visit.
    wardrobe.choose('helmet-red');
    expect(wardrobe.chosen('helmet')).toBe('helmet-red');
  });

  it('keeps working in memory when storage fails', () => {
    for (const fail of ['read', 'write', 'all'] as const) {
      const storage = new MemoryStorage();
      storage.fail = fail;
      const wardrobe = new Wardrobe(storage);
      wardrobe.choose('shirt-green');
      wardrobe.markSeen(['shirt-green']);
      expect(wardrobe.chosen('shirt')).toBe('shirt-green');
      expect(wardrobe.hasSeen('shirt-green')).toBe(true);
      expect(wardrobe.persistent).toBe(false);
    }
  });

  it('clear forgets everything, in memory and storage, and leaves other keys alone', () => {
    const storage = new MemoryStorage();
    storage.items.set('dozendoolhof.progress', 'keep me');
    const wardrobe = new Wardrobe(storage);
    wardrobe.choose('helmet-red');
    wardrobe.markSeen(['helmet-red']);
    wardrobe.clear();
    expect(wardrobe.chosen('helmet')).toBeUndefined();
    expect(wardrobe.hasSeen('helmet-red')).toBe(false);
    expect(storage.items.has(WARDROBE_KEY)).toBe(false);
    expect(storage.items.get('dozendoolhof.progress')).toBe('keep me');
  });
});

describe('StoredRecord', () => {
  it('reads only data of its own version', () => {
    const storage = new MemoryStorage();
    storage.items.set('k', JSON.stringify({ version: 2, a: 1 }));
    expect(new StoredRecord(storage, 'k', 2).read()).toEqual({ version: 2, a: 1 });
    // Older data is not understood by this record: read as empty, writable.
    const newer = new StoredRecord(storage, 'k', 3);
    expect(newer.read()).toBeNull();
    expect(newer.persistent).toBe(true);
    newer.write({ b: 2 });
    expect(storage.json('k')).toEqual({ version: 3, b: 2 });
  });

  it('is memory-only without storage', () => {
    const record = new StoredRecord(null, 'k', 1);
    expect(record.persistent).toBe(false);
    expect(record.read()).toBeNull();
    record.write({ a: 1 });
    record.remove();
  });
});
