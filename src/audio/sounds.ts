import { countBoxesOnGoals, type GameState, type Level } from '../engine/state';

/**
 * The game's sound effects, synthesised with the Web Audio API: no audio files, so
 * nothing to license or download. Every sound is short and soft; footsteps vary their
 * pitch a little and are rate-limited, so walking never turns into a drone.
 */

export type Cue = 'step' | 'push' | 'goal' | 'bump' | 'undo' | 'win' | 'stuck' | 'reward';

export interface Note {
  readonly wave: 'sine' | 'triangle' | 'square';
  /** Start, in seconds after the cue. */
  readonly at: number;
  /** Duration in seconds. */
  readonly length: number;
  /** Frequency in Hz at the start, and optionally at the end (a glide). */
  readonly from: number;
  readonly to?: number;
  /** Peak volume, 0–1, before the master volume. */
  readonly volume: number;
}

export interface Sound {
  readonly notes: readonly Note[];
  /** A short burst of filtered noise, for scraping and thudding. */
  readonly noise?: { readonly length: number; readonly volume: number; readonly cutoff: number };
  /** Footsteps: each one a little higher or lower, up to this fraction. */
  readonly vary?: number;
}

const C5 = 523.25;
const E5 = 659.25;
const G5 = 783.99;
const C6 = 1046.5;

export const SOUNDS: Readonly<Record<Cue, Sound>> = {
  step: {
    notes: [{ wave: 'triangle', at: 0, length: 0.05, from: 420, to: 360, volume: 0.07 }],
    vary: 0.08,
  },
  push: {
    notes: [{ wave: 'sine', at: 0, length: 0.14, from: 150, to: 95, volume: 0.25 }],
    noise: { length: 0.12, volume: 0.12, cutoff: 700 },
  },
  goal: {
    notes: [
      { wave: 'sine', at: 0, length: 0.14, from: 150, to: 95, volume: 0.2 },
      { wave: 'triangle', at: 0.04, length: 0.16, from: G5, volume: 0.16 },
      { wave: 'triangle', at: 0.13, length: 0.3, from: C6, volume: 0.16 },
    ],
  },
  bump: {
    notes: [{ wave: 'sine', at: 0, length: 0.1, from: 170, to: 120, volume: 0.14 }],
  },
  undo: {
    notes: [{ wave: 'triangle', at: 0, length: 0.14, from: 640, to: 380, volume: 0.08 }],
  },
  win: {
    notes: [
      { wave: 'triangle', at: 0, length: 0.14, from: C5, volume: 0.16 },
      { wave: 'triangle', at: 0.12, length: 0.14, from: E5, volume: 0.16 },
      { wave: 'triangle', at: 0.24, length: 0.14, from: G5, volume: 0.16 },
      { wave: 'triangle', at: 0.36, length: 0.5, from: C6, volume: 0.18 },
      { wave: 'sine', at: 0.36, length: 0.5, from: C5, volume: 0.1 },
    ],
  },
  stuck: {
    // A gentle "uh-oh", not an alarm.
    notes: [
      { wave: 'triangle', at: 0, length: 0.16, from: 494, volume: 0.13 },
      { wave: 'triangle', at: 0.18, length: 0.26, from: 392, to: 370, volume: 0.13 },
    ],
  },
  reward: {
    notes: [1318.5, 1568, 2093, 2637].map((from, index) => ({
      wave: 'sine' as const,
      at: index * 0.07,
      length: 0.16,
      from,
      volume: 0.08,
    })),
  },
};

/** The longest sound, in seconds: nothing keeps playing after a level change. */
export function soundLength(sound: Sound): number {
  return Math.max(sound.noise?.length ?? 0, ...sound.notes.map((note) => note.at + note.length));
}

/** The sound of a move: a step, a push, or a push that puts a box on a goal. */
export function moveCue(level: Level, previous: GameState, next: GameState): Cue {
  const pushed =
    previous.boxes !== next.boxes &&
    (previous.boxes.length !== next.boxes.length ||
      previous.boxes.some((cell, index) => next.boxes[index] !== cell));
  if (!pushed) return 'step';
  return countBoxesOnGoals(level, next) > countBoxesOnGoals(level, previous) ? 'goal' : 'push';
}

/** Minimum milliseconds between two sounds of the same kind. */
const MIN_GAP_MS: Partial<Record<Cue, number>> = { step: 90, bump: 200, undo: 60 };

const MASTER_VOLUME = 0.7;

type AudioContextConstructor = new () => AudioContext;

function browserAudioContext(): AudioContext | null {
  const scope = globalThis as typeof globalThis & {
    AudioContext?: AudioContextConstructor;
    webkitAudioContext?: AudioContextConstructor;
  };
  const Context = scope.AudioContext ?? scope.webkitAudioContext;
  if (!Context) return null;
  try {
    return new Context();
  } catch {
    return null;
  }
}

export interface SoundPlayerOptions {
  readonly createContext?: () => AudioContext | null;
  readonly now?: () => number;
  readonly random?: () => number;
  /** Called for every sound that was actually scheduled (a hook for tests). */
  readonly onPlay?: (cue: Cue) => void;
}

/**
 * Plays the sound effects. The audio context is created lazily and (re)started on a user
 * gesture via `unlock()`, as browsers require; without Web Audio, or when `enabled()`
 * says no, every call quietly does nothing. Never throws.
 */
export class SoundPlayer {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private unavailable = false;
  private readonly last = new Map<Cue, number>();
  private readonly createContext: () => AudioContext | null;
  private readonly now: () => number;
  private readonly random: () => number;

  constructor(
    private readonly enabled: () => boolean,
    private readonly options: SoundPlayerOptions = {},
  ) {
    this.createContext = options.createContext ?? browserAudioContext;
    this.now = options.now ?? (() => performance.now());
    this.random = options.random ?? Math.random;
  }

  /** Call from a user gesture (tap, key): browsers only start audio after one. */
  unlock(): void {
    if (!this.enabled()) return;
    const context = this.ensure();
    if (context?.state === 'suspended') void context.resume().catch(() => undefined);
  }

  /** Plays `cue` after `delay` seconds; returns whether it was scheduled. */
  play(cue: Cue, delay = 0): boolean {
    if (!this.enabled()) return false;
    const gap = MIN_GAP_MS[cue];
    const time = this.now();
    const last = this.last.get(cue);
    if (gap !== undefined && last !== undefined && time - last < gap) return false;
    const context = this.ensure();
    if (!context || !this.master) return false;
    try {
      if (context.state === 'suspended') void context.resume().catch(() => undefined);
      this.schedule(context, this.master, SOUNDS[cue], context.currentTime + 0.01 + delay);
    } catch {
      return false;
    }
    this.last.set(cue, time);
    this.options.onPlay?.(cue);
    return true;
  }

  /** Lets the audio hardware rest while the game is in the background. */
  suspend(): void {
    if (this.context?.state === 'running') void this.context.suspend().catch(() => undefined);
  }

  private ensure(): AudioContext | null {
    if (this.context || this.unavailable) return this.context;
    try {
      const context = this.createContext();
      if (!context) {
        this.unavailable = true;
        return null;
      }
      const master = context.createGain();
      master.gain.value = MASTER_VOLUME;
      master.connect(context.destination);
      this.context = context;
      this.master = master;
    } catch {
      this.unavailable = true;
    }
    return this.context;
  }

  private schedule(context: AudioContext, output: AudioNode, sound: Sound, start: number): void {
    const shift = sound.vary ? 1 + (this.random() * 2 - 1) * sound.vary : 1;
    for (const note of sound.notes) {
      const begin = start + note.at;
      const end = begin + note.length;
      const oscillator = context.createOscillator();
      oscillator.type = note.wave;
      oscillator.frequency.setValueAtTime(note.from * shift, begin);
      if (note.to) oscillator.frequency.exponentialRampToValueAtTime(note.to * shift, end);
      const gain = context.createGain();
      gain.gain.setValueAtTime(0.0001, begin);
      gain.gain.linearRampToValueAtTime(note.volume, begin + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, end);
      oscillator.connect(gain);
      gain.connect(output);
      oscillator.start(begin);
      oscillator.stop(end + 0.02);
    }
    if (sound.noise) {
      const source = context.createBufferSource();
      source.buffer = this.noiseBuffer(context);
      const filter = context.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = sound.noise.cutoff;
      const gain = context.createGain();
      gain.gain.setValueAtTime(sound.noise.volume, start);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + sound.noise.length);
      source.connect(filter);
      filter.connect(gain);
      gain.connect(output);
      source.start(start);
      source.stop(start + sound.noise.length + 0.02);
    }
  }

  private noiseBuffer(context: AudioContext): AudioBuffer {
    if (this.noise) return this.noise;
    const length = Math.ceil(context.sampleRate * 0.3);
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < length; index++) data[index] = this.random() * 2 - 1;
    this.noise = buffer;
    return buffer;
  }
}
