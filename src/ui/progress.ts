/**
 * Which levels have been completed and the best number of stars (1–3) per level,
 * keyed by stable level id (`easy-01`), so reordering levels never mixes up progress.
 *
 * Saved in localStorage as versioned JSON. Reading is defensive: missing, damaged or
 * invalid data never crashes the game; it falls back to empty progress, keeping every
 * entry that is still valid. Without usable localStorage (blocked, private mode, full)
 * progress lives in memory only for this visit, and `persistent` reports that.
 */

export const STORAGE_KEY = 'dozendoolhof.progress';
export const STORAGE_VERSION = 1;

export type Stars = 1 | 2 | 3;

/** Storage format, version 1. A level is completed when it has a star entry. */
export interface ProgressDataV1 {
  readonly version: 1;
  readonly bestStars: Readonly<Record<string, Stars>>;
}

export type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

/**
 * Upgrade steps for older formats: `MIGRATIONS[n]` turns version `n` data into version
 * `n + 1`. Empty while version 1 is the only format; add a step when the format changes
 * and bump `STORAGE_VERSION`.
 */
export type Migrations = Readonly<Record<number, (data: Record<string, unknown>) => unknown>>;
export const MIGRATIONS: Migrations = {};

/**
 * Stars for a finished level: three for at most the known solution's number of moves,
 * two for up to half as many again, one for any other win.
 */
export function starsFor(moves: number, parMoves: number): Stars {
  if (moves <= parMoves) return 3;
  if (moves <= Math.ceil(parMoves * 1.5)) return 2;
  return 1;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStars(value: unknown): value is Stars {
  return value === 1 || value === 2 || value === 3;
}

export type ReadResult =
  | { readonly kind: 'ok'; readonly data: ProgressDataV1 }
  /** Nothing usable was stored (absent, damaged or wrong shape); start empty. */
  | { readonly kind: 'empty' }
  /** Written by a newer version of the game: leave it alone. */
  | { readonly kind: 'newer'; readonly version: number };

/**
 * Parses stored text into the current format, running migrations for older versions.
 * Invalid star entries are dropped one by one instead of discarding everything.
 */
export function readProgress(
  text: string | null,
  migrations: Migrations = MIGRATIONS,
  currentVersion: number = STORAGE_VERSION,
): ReadResult {
  if (text === null) return { kind: 'empty' };
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { kind: 'empty' };
  }
  if (!isRecord(parsed)) return { kind: 'empty' };
  let data = parsed;

  let version = data.version;
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) {
    return { kind: 'empty' };
  }
  if (version > currentVersion) return { kind: 'newer', version };
  while (version < currentVersion) {
    const step = migrations[version];
    if (!step) return { kind: 'empty' };
    const next = step(data);
    if (!isRecord(next) || next.version !== version + 1) return { kind: 'empty' };
    data = next;
    version += 1;
  }

  const bestStars: Record<string, Stars> = {};
  if (isRecord(data.bestStars)) {
    for (const [id, stars] of Object.entries(data.bestStars)) {
      if (id.length > 0 && isStars(stars)) bestStars[id] = stars;
    }
  }
  return { kind: 'ok', data: { version: 1, bestStars } };
}

/** The browser's localStorage, or `null` when it is missing or refuses to work. */
export function browserStorage(): StorageLike | null {
  try {
    const storage = window.localStorage;
    const probe = `${STORAGE_KEY}.probe`;
    storage.setItem(probe, '1');
    storage.removeItem(probe);
    return storage;
  } catch {
    return null;
  }
}

export class Progress {
  private readonly bestStars = new Map<string, Stars>();
  private storage: StorageLike | null;

  /** Pass `null` to keep progress in memory only. */
  constructor(storage: StorageLike | null) {
    this.storage = storage;
    if (!storage) return;
    let text: string | null;
    try {
      text = storage.getItem(STORAGE_KEY);
    } catch {
      this.storage = null;
      return;
    }
    const result = readProgress(text);
    if (result.kind === 'newer') {
      // Never overwrite progress saved by a newer version of the game.
      this.storage = null;
      return;
    }
    if (result.kind === 'ok') {
      for (const [id, stars] of Object.entries(result.data.bestStars)) {
        this.bestStars.set(id, stars);
      }
    }
  }

  /** `false` when progress is kept in memory only and lost on reload. */
  get persistent(): boolean {
    return this.storage !== null;
  }

  isCompleted(levelId: string): boolean {
    return this.bestStars.has(levelId);
  }

  /** Best stars earned for a level, or 0 when it has not been completed. */
  stars(levelId: string): 0 | Stars {
    return this.bestStars.get(levelId) ?? 0;
  }

  /**
   * Records a win and saves immediately. A worse result never replaces a better one.
   * Returns whether anything changed.
   */
  complete(levelId: string, stars: Stars): boolean {
    if (stars <= this.stars(levelId)) return false;
    this.bestStars.set(levelId, stars);
    this.save();
    return true;
  }

  countCompleted(levelIds: readonly string[]): number {
    return levelIds.filter((id) => this.bestStars.has(id)).length;
  }

  /** Forgets all progress, in memory and in storage. */
  clear(): void {
    this.bestStars.clear();
    if (!this.storage) return;
    try {
      this.storage.removeItem(STORAGE_KEY);
    } catch {
      this.storage = null;
    }
  }

  toData(): ProgressDataV1 {
    const ids = [...this.bestStars.keys()].sort();
    return {
      version: STORAGE_VERSION,
      bestStars: Object.fromEntries(ids.map((id) => [id, this.bestStars.get(id) as Stars])),
    };
  }

  private save(): void {
    if (!this.storage) return;
    try {
      this.storage.setItem(STORAGE_KEY, JSON.stringify(this.toData()));
    } catch {
      // Full or blocked: keep going in memory.
      this.storage = null;
    }
  }
}
