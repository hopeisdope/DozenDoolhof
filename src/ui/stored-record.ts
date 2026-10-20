import type { StorageLike } from './progress';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * One small versioned JSON record in localStorage that never throws. Missing, damaged or
 * wrongly shaped data reads as `null`; data written by a newer version of the game is
 * never overwritten (the record turns memory-only). When storage fails, the record keeps
 * working in memory and `persistent` turns false, like `Progress`.
 */
export class StoredRecord {
  private storage: StorageLike | null;
  private readonly initial: Record<string, unknown> | null = null;

  constructor(
    storage: StorageLike | null,
    private readonly key: string,
    private readonly version: number,
  ) {
    this.storage = storage;
    if (!storage) return;
    let text: string | null;
    try {
      text = storage.getItem(key);
    } catch {
      this.storage = null;
      return;
    }
    if (text === null) return;
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      return;
    }
    if (!isRecord(parsed) || typeof parsed.version !== 'number') return;
    if (parsed.version > version) {
      this.storage = null;
      return;
    }
    if (parsed.version === version) this.initial = parsed;
  }

  /** The stored data as read at start-up, or `null` when nothing usable was stored. */
  read(): Record<string, unknown> | null {
    return this.initial;
  }

  get persistent(): boolean {
    return this.storage !== null;
  }

  write(data: Record<string, unknown>): void {
    if (!this.storage) return;
    try {
      this.storage.setItem(this.key, JSON.stringify({ version: this.version, ...data }));
    } catch {
      this.storage = null;
    }
  }

  remove(): void {
    if (!this.storage) return;
    try {
      this.storage.removeItem(this.key);
    } catch {
      this.storage = null;
    }
  }
}
