import type { StorageLike } from '../../src/ui/progress';

/** In-memory stand-in for localStorage; `fail` makes calls throw like a blocked or full one. */
export class MemoryStorage implements StorageLike {
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

  json(key: string): unknown {
    const text = this.items.get(key);
    return text === undefined ? undefined : JSON.parse(text);
  }
}
