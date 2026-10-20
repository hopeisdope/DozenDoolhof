import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  pickDutchVoice,
  Speaker,
  type SynthLike,
  type UtteranceLike,
  type VoiceLike,
} from '../../src/audio/speech';

const NL: VoiceLike = { lang: 'nl-NL', name: 'Xander', localService: true };
const BE: VoiceLike = { lang: 'nl-BE', name: 'Ellen', localService: true };
const EN: VoiceLike = { lang: 'en-US', name: 'Samantha', localService: true };

interface Spoken extends UtteranceLike {
  readonly text: string;
}

class FakeSynth implements SynthLike {
  voices: VoiceLike[] = [];
  spoken: Spoken[] = [];
  cancels = 0;
  private listener: (() => void) | null = null;

  speak(utterance: UtteranceLike): void {
    this.spoken.push(utterance as Spoken);
  }

  cancel(): void {
    this.cancels += 1;
  }

  getVoices(): readonly VoiceLike[] {
    return this.voices;
  }

  addEventListener(_type: 'voiceschanged', listener: () => void): void {
    this.listener = listener;
  }

  loadVoices(voices: VoiceLike[]): void {
    this.voices = voices;
    this.listener?.();
  }

  get texts(): string[] {
    return this.spoken.map((utterance) => utterance.text).filter((text) => text !== '');
  }
}

function speaker(voices: VoiceLike[] = [NL], enabled: () => boolean = () => true) {
  const synth = new FakeSynth();
  synth.voices = voices;
  const createUtterance = (text: string): UtteranceLike =>
    ({ text, lang: '', rate: 1, pitch: 1, volume: 1, voice: null }) as Spoken;
  return { synth, speaker: new Speaker(enabled, { synth, createUtterance }) };
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('pickDutchVoice', () => {
  it('prefers Netherlands Dutch, then on-device voices, and never another language', () => {
    expect(pickDutchVoice([EN, BE, NL])).toBe(NL);
    expect(pickDutchVoice([EN, BE])).toBe(BE);
    const online = { lang: 'nl-NL', name: 'Google Nederlands', localService: false };
    expect(pickDutchVoice([online, NL])).toBe(NL);
    expect(pickDutchVoice([{ lang: 'nl_NL', name: 'Android' }])?.name).toBe('Android');
    expect(pickDutchVoice([EN])).toBeNull();
    expect(pickDutchVoice([])).toBeNull();
  });
});

describe('Speaker', () => {
  it('speaks after the delay, in Dutch, kindly and slowly', () => {
    const { synth, speaker: voice } = speaker();
    expect(voice.available).toBe(true);
    voice.say('Gelukt!', 900);
    vi.advanceTimersByTime(899);
    expect(synth.texts).toEqual([]);
    vi.advanceTimersByTime(1);
    expect(synth.texts).toEqual(['Gelukt!']);
    const [utterance] = synth.spoken;
    expect(utterance?.voice).toBe(NL);
    expect(utterance?.lang).toBe('nl-NL');
    expect(utterance?.rate).toBeLessThan(1);
    expect(utterance?.volume).toBe(1);
  });

  it('never talks over itself: a new phrase or stop cuts off the previous one', () => {
    const { synth, speaker: voice } = speaker();
    voice.say('Eén', 500);
    voice.say('Twee', 500);
    vi.advanceTimersByTime(1000);
    expect(synth.texts).toEqual(['Twee']);
    const cancels = synth.cancels;
    voice.say('Drie', 500);
    voice.stop();
    vi.advanceTimersByTime(1000);
    expect(synth.texts).toEqual(['Twee']);
    expect(synth.cancels).toBeGreaterThan(cancels);
  });

  it('stays silent without a Dutch voice rather than mispronounce', () => {
    const { synth, speaker: voice } = speaker([EN]);
    expect(voice.available).toBe(false);
    voice.unlock();
    voice.say('Gelukt!');
    vi.runAllTimers();
    expect(synth.spoken).toEqual([]);
    // Voices that load later are picked up.
    synth.loadVoices([EN, NL]);
    expect(voice.available).toBe(true);
    voice.say('Gelukt!');
    vi.runAllTimers();
    expect(synth.texts).toEqual(['Gelukt!']);
  });

  it('says nothing while switched off, also when switched off during the wait', () => {
    let on = false;
    const { synth, speaker: voice } = speaker([NL], () => on);
    voice.say('Gelukt!');
    vi.runAllTimers();
    expect(synth.spoken).toEqual([]);
    on = true;
    voice.say('Gelukt!', 500);
    on = false;
    vi.runAllTimers();
    expect(synth.spoken).toEqual([]);
  });

  it('primes speech once on the first gesture, silently', () => {
    const { synth, speaker: voice } = speaker();
    voice.unlock();
    voice.unlock();
    expect(synth.spoken).toHaveLength(1);
    expect(synth.spoken[0]?.text).toBe('');
    expect(synth.spoken[0]?.volume).toBe(0);
  });

  it('never throws, even when the browser speech engine does', () => {
    const synth: SynthLike = {
      speak: () => {
        throw new Error('synthesis-failed');
      },
      cancel: () => {
        throw new Error('not-allowed');
      },
      getVoices: () => [NL],
    };
    const voice = new Speaker(() => true, {
      synth,
      createUtterance: (text) => ({ text, lang: '', rate: 1, pitch: 1, volume: 1, voice: null }),
    });
    expect(() => {
      voice.unlock();
      voice.say('Gelukt!');
      vi.runAllTimers();
      voice.stop();
    }).not.toThrow();
    expect(new Speaker(() => true, { synth: null }).available).toBe(false);
  });
});
