import type { StorageLike } from './progress';
import { StoredRecord } from './stored-record';

export const SETTINGS_KEY = 'dozendoolhof.settings';
export const SETTINGS_VERSION = 1;

export type SettingName = 'sound' | 'speech';

/** Storage format, version 1. Missing or invalid values fall back to the defaults. */
export interface SettingsDataV1 {
  readonly version: 1;
  readonly sound: boolean;
  readonly speech: boolean;
}

/** Sound effects and the voice are on unless a grown-up switches them off. */
export const DEFAULT_SETTINGS: Readonly<Record<SettingName, boolean>> = {
  sound: true,
  speech: true,
};

/**
 * The player's preferences, saved locally. They are not progress: wiping progress keeps
 * them. Damaged or unreadable data simply means the defaults.
 */
export class Settings {
  private readonly record: StoredRecord;
  private readonly values: Record<SettingName, boolean> = { ...DEFAULT_SETTINGS };
  private readonly listeners: ((name: SettingName, on: boolean) => void)[] = [];

  constructor(storage: StorageLike | null) {
    this.record = new StoredRecord(storage, SETTINGS_KEY, SETTINGS_VERSION);
    const data = this.record.read();
    for (const name of Object.keys(DEFAULT_SETTINGS) as SettingName[]) {
      const value = data?.[name];
      if (typeof value === 'boolean') this.values[name] = value;
    }
  }

  get(name: SettingName): boolean {
    return this.values[name];
  }

  set(name: SettingName, on: boolean): void {
    if (this.values[name] === on) return;
    this.values[name] = on;
    this.record.write({ ...this.values });
    for (const listener of this.listeners) listener(name, on);
  }

  onChange(listener: (name: SettingName, on: boolean) => void): void {
    this.listeners.push(listener);
  }

  toData(): SettingsDataV1 {
    return { version: SETTINGS_VERSION, ...this.values };
  }
}
