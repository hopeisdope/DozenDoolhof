import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, Settings, SETTINGS_KEY, SETTINGS_VERSION } from '../../src/ui/settings';
import { MemoryStorage } from '../helpers/storage';

describe('Settings', () => {
  it('has sound and voice on by default, without writing anything', () => {
    const storage = new MemoryStorage();
    const settings = new Settings(storage);
    expect(settings.get('sound')).toBe(true);
    expect(settings.get('speech')).toBe(true);
    expect(DEFAULT_SETTINGS).toEqual({ sound: true, speech: true });
    expect(storage.items.size).toBe(0);
  });

  it('saves each switch at once and keeps it after a reload', () => {
    const storage = new MemoryStorage();
    const settings = new Settings(storage);
    settings.set('sound', false);
    expect(storage.json(SETTINGS_KEY)).toEqual({
      version: SETTINGS_VERSION,
      sound: false,
      speech: true,
    });
    settings.set('speech', false);
    const reloaded = new Settings(storage);
    expect(reloaded.get('sound')).toBe(false);
    expect(reloaded.get('speech')).toBe(false);
  });

  it('tells listeners about real changes only', () => {
    const settings = new Settings(new MemoryStorage());
    const changes: string[] = [];
    settings.onChange((name, on) => changes.push(`${name}:${on}`));
    settings.set('sound', true); // already on
    settings.set('sound', false);
    settings.set('speech', false);
    settings.set('speech', true);
    expect(changes).toEqual(['sound:false', 'speech:false', 'speech:true']);
  });

  it('uses the default for every missing or invalid value', () => {
    for (const text of [
      '{"version":1,"sound":fal',
      '{"version":1,"sound":"no","speech":0}',
      '{"sound":false}',
      '[]',
    ]) {
      const storage = new MemoryStorage();
      storage.items.set(SETTINGS_KEY, text);
      const settings = new Settings(storage);
      expect(settings.toData()).toEqual({ version: 1, sound: true, speech: true });
    }
    const storage = new MemoryStorage();
    storage.items.set(SETTINGS_KEY, '{"version":1,"speech":false,"volume":11}');
    expect(new Settings(storage).toData()).toEqual({ version: 1, sound: true, speech: false });
  });

  it('never overwrites settings saved by a newer version, and works without storage', () => {
    const storage = new MemoryStorage();
    const future = JSON.stringify({ version: SETTINGS_VERSION + 1, sound: 'quiet' });
    storage.items.set(SETTINGS_KEY, future);
    const settings = new Settings(storage);
    settings.set('sound', false);
    expect(settings.get('sound')).toBe(false);
    expect(storage.items.get(SETTINGS_KEY)).toBe(future);

    const memory = new Settings(null);
    memory.set('speech', false);
    expect(memory.get('speech')).toBe(false);
    const broken = new MemoryStorage();
    broken.fail = 'all';
    const failing = new Settings(broken);
    failing.set('sound', false);
    expect(failing.get('sound')).toBe(false);
  });
});
