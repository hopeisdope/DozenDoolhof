import { describe, expect, it } from 'vitest';
import {
  Progress,
  readProgress,
  starsFor,
  STORAGE_KEY,
  STORAGE_VERSION,
  type Migrations,
  type StorageLike,
} from '../../src/ui/progress';

/** In-memory stand-in for localStorage; `fail` makes every call throw. */
class MemoryStorage implements StorageLike {
  readonly items = new Map<string, string>();
  fail: false | 'read' | 'write' | 'all' = false;

  getItem(key: string): string | null {
    if (this.fail === 'read' || this.fail === 'all') throw new Error('SecurityError');
    return this.items.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    if (this.fail === 'write' || this.fail === 'all') throw new Error('QuotaExceededError');
    this.items.set(key, value);
  }

  removeItem(key: string): void {
    if (this.fail === 'all') throw new Error('SecurityError');
    this.items.delete(key);
  }
}

function stored(storage: MemoryStorage): unknown {
  const text = storage.items.get(STORAGE_KEY);
  return text === undefined ? undefined : JSON.parse(text);
}

describe('starsFor', () => {
  it('gives three stars up to the known solution, two up to half again, else one', () => {
    expect(starsFor(10, 10)).toBe(3);
    expect(starsFor(8, 10)).toBe(3);
    expect(starsFor(11, 10)).toBe(2);
    expect(starsFor(15, 10)).toBe(2);
    expect(starsFor(16, 10)).toBe(1);
    expect(starsFor(4, 3)).toBe(2);
    expect(starsFor(5, 3)).toBe(2);
    expect(starsFor(6, 3)).toBe(1);
  });
});

describe('Progress with storage', () => {
  it('starts empty and persistent when nothing is stored', () => {
    const progress = new Progress(new MemoryStorage());
    expect(progress.persistent).toBe(true);
    expect(progress.isCompleted('easy-01')).toBe(false);
    expect(progress.stars('easy-01')).toBe(0);
    expect(progress.countCompleted(['easy-01', 'easy-02'])).toBe(0);
  });

  it('saves a completed level immediately, by level id, with a version', () => {
    const storage = new MemoryStorage();
    const progress = new Progress(storage);
    expect(progress.complete('medium-07', 2)).toBe(true);
    expect(stored(storage)).toEqual({ version: STORAGE_VERSION, bestStars: { 'medium-07': 2 } });
    expect(progress.isCompleted('medium-07')).toBe(true);
    expect(progress.countCompleted(['medium-07', 'medium-08'])).toBe(1);
  });

  it('loads saved progress again, as after a reload', () => {
    const storage = new MemoryStorage();
    const first = new Progress(storage);
    first.complete('easy-01', 3);
    first.complete('hard-20', 1);
    const reloaded = new Progress(storage);
    expect(reloaded.stars('easy-01')).toBe(3);
    expect(reloaded.stars('hard-20')).toBe(1);
    expect(reloaded.countCompleted(['easy-01', 'easy-02', 'hard-20'])).toBe(2);
  });

  it('keeps a better result when a level is played again worse', () => {
    const storage = new MemoryStorage();
    const progress = new Progress(storage);
    progress.complete('easy-03', 3);
    const before = storage.items.get(STORAGE_KEY);
    expect(progress.complete('easy-03', 1)).toBe(false);
    expect(progress.complete('easy-03', 3)).toBe(false);
    expect(progress.stars('easy-03')).toBe(3);
    expect(storage.items.get(STORAGE_KEY)).toBe(before);
    expect(new Progress(storage).stars('easy-03')).toBe(3);
  });

  it('upgrades to a better result', () => {
    const storage = new MemoryStorage();
    const progress = new Progress(storage);
    progress.complete('easy-03', 1);
    expect(progress.complete('easy-03', 2)).toBe(true);
    expect(new Progress(storage).stars('easy-03')).toBe(2);
  });

  it('clears all progress, in memory and in storage', () => {
    const storage = new MemoryStorage();
    storage.items.set('other-app', 'keep me');
    const progress = new Progress(storage);
    progress.complete('easy-01', 3);
    progress.complete('medium-01', 2);
    progress.clear();
    expect(progress.countCompleted(['easy-01', 'medium-01'])).toBe(0);
    expect(progress.stars('easy-01')).toBe(0);
    expect(storage.items.has(STORAGE_KEY)).toBe(false);
    expect(storage.items.get('other-app')).toBe('keep me');
    expect(new Progress(storage).countCompleted(['easy-01', 'medium-01'])).toBe(0);
    // Still saving after a wipe.
    progress.complete('easy-02', 1);
    expect(new Progress(storage).stars('easy-02')).toBe(1);
  });

  it('starts empty on damaged data and overwrites it on the next win', () => {
    const storage = new MemoryStorage();
    storage.items.set(STORAGE_KEY, '{"version":1,"bestStars":{"easy-01":3');
    const progress = new Progress(storage);
    expect(progress.persistent).toBe(true);
    expect(progress.isCompleted('easy-01')).toBe(false);
    progress.complete('easy-02', 2);
    expect(stored(storage)).toEqual({ version: 1, bestStars: { 'easy-02': 2 } });
  });

  it('never overwrites progress written by a newer version of the game', () => {
    const storage = new MemoryStorage();
    const future = JSON.stringify({ version: STORAGE_VERSION + 1, levels: { 'easy-01': {} } });
    storage.items.set(STORAGE_KEY, future);
    const progress = new Progress(storage);
    expect(progress.persistent).toBe(false);
    progress.complete('easy-01', 3);
    progress.clear();
    expect(storage.items.get(STORAGE_KEY)).toBe(future);
  });
});

describe('Progress without usable storage', () => {
  it('works in memory only when there is no storage', () => {
    const progress = new Progress(null);
    expect(progress.persistent).toBe(false);
    progress.complete('easy-01', 2);
    expect(progress.stars('easy-01')).toBe(2);
    progress.clear();
    expect(progress.isCompleted('easy-01')).toBe(false);
  });

  it('falls back to memory when reading throws', () => {
    const storage = new MemoryStorage();
    storage.fail = 'all';
    const progress = new Progress(storage);
    expect(progress.persistent).toBe(false);
    expect(progress.complete('easy-01', 3)).toBe(true);
    expect(progress.stars('easy-01')).toBe(3);
  });

  it('falls back to memory when saving throws (storage full), keeping the result', () => {
    const storage = new MemoryStorage();
    const progress = new Progress(storage);
    storage.fail = 'write';
    expect(() => progress.complete('easy-01', 3)).not.toThrow();
    expect(progress.persistent).toBe(false);
    expect(progress.stars('easy-01')).toBe(3);
  });
});

describe('readProgress', () => {
  it('reads the current format', () => {
    expect(readProgress('{"version":1,"bestStars":{"easy-01":3,"hard-02":1}}')).toEqual({
      kind: 'ok',
      data: { version: 1, bestStars: { 'easy-01': 3, 'hard-02': 1 } },
    });
  });

  it.each([
    ['missing', null],
    ['empty text', ''],
    ['not JSON', 'sterren!'],
    ['truncated JSON', '{"version":1,"bestS'],
    ['null', 'null'],
    ['a number', '42'],
    ['an array', '[1,2,3]'],
    ['no version', '{"bestStars":{"easy-01":3}}'],
    ['a text version', '{"version":"1","bestStars":{}}'],
    ['version zero', '{"version":0,"bestStars":{}}'],
    ['a fractional version', '{"version":1.5,"bestStars":{}}'],
  ])('treats %s as empty progress', (_label, text) => {
    expect(readProgress(text)).toEqual({ kind: 'empty' });
  });

  it('drops invalid star entries but keeps the valid ones', () => {
    const text = JSON.stringify({
      version: 1,
      bestStars: {
        'easy-01': 3,
        'easy-02': 0,
        'easy-03': 4,
        'easy-04': 2.5,
        'easy-05': '3',
        'easy-06': null,
        'easy-07': 1,
        '': 2,
      },
    });
    expect(readProgress(text)).toEqual({
      kind: 'ok',
      data: { version: 1, bestStars: { 'easy-01': 3, 'easy-07': 1 } },
    });
  });

  it('treats a missing or wrongly shaped star table as no stars', () => {
    expect(readProgress('{"version":1}')).toEqual({
      kind: 'ok',
      data: { version: 1, bestStars: {} },
    });
    expect(readProgress('{"version":1,"bestStars":["easy-01"]}')).toEqual({
      kind: 'ok',
      data: { version: 1, bestStars: {} },
    });
  });

  it('reports data from a newer version instead of reading it', () => {
    expect(readProgress('{"version":7,"bestStars":{"easy-01":3}}')).toEqual({
      kind: 'newer',
      version: 7,
    });
  });
});

describe('migrations', () => {
  // A hypothetical history: version 1 stored a plain list of completed levels, version 2
  // added stars, version 3 is the current format under test.
  const migrations: Migrations = {
    1: (data) => ({
      version: 2,
      stars: Object.fromEntries(
        (Array.isArray(data.completed) ? data.completed : []).map((id) => [String(id), 1]),
      ),
    }),
    2: (data) => ({ version: 3, bestStars: data.stars }),
  };

  it('upgrades old data step by step to the current version', () => {
    const text = JSON.stringify({ version: 1, completed: ['easy-01', 'medium-04'] });
    expect(readProgress(text, migrations, 3)).toMatchObject({
      kind: 'ok',
      data: { bestStars: { 'easy-01': 1, 'medium-04': 1 } },
    });
  });

  it('starts from the middle of the chain', () => {
    const text = JSON.stringify({ version: 2, stars: { 'hard-01': 3 } });
    expect(readProgress(text, migrations, 3)).toMatchObject({
      kind: 'ok',
      data: { bestStars: { 'hard-01': 3 } },
    });
  });

  it('treats data as empty when a migration step is missing or misbehaves', () => {
    const text = JSON.stringify({ version: 1, completed: ['easy-01'] });
    expect(readProgress(text, { 2: migrations[2]! }, 3)).toEqual({ kind: 'empty' });
    expect(readProgress(text, { ...migrations, 1: () => ({ version: 5 }) }, 3)).toEqual({
      kind: 'empty',
    });
    expect(readProgress(text, { ...migrations, 1: () => null }, 3)).toEqual({ kind: 'empty' });
  });

  it('has no migration steps yet for the shipped format', () => {
    expect(STORAGE_VERSION).toBe(1);
  });
});
