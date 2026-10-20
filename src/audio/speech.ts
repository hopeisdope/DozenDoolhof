/**
 * Short spoken feedback through the browser's own speech synthesis (no service, account
 * or download). It only speaks with a Dutch voice: without one it stays silent rather
 * than mispronounce. One phrase at a time; a new one, `stop()` or a level change cuts
 * the previous one off.
 */

export interface VoiceLike {
  readonly lang: string;
  readonly name: string;
  readonly localService?: boolean;
}

export interface UtteranceLike {
  lang: string;
  rate: number;
  pitch: number;
  volume: number;
  voice: VoiceLike | null;
}

export interface SynthLike {
  speak(utterance: UtteranceLike): void;
  cancel(): void;
  getVoices(): readonly VoiceLike[];
  addEventListener?(type: 'voiceschanged', listener: () => void): void;
}

export interface SpeakerOptions {
  readonly synth?: SynthLike | null;
  readonly createUtterance?: (text: string) => UtteranceLike;
}

function browserSynth(): SynthLike | null {
  try {
    const synth = (globalThis as { speechSynthesis?: SpeechSynthesis }).speechSynthesis;
    return synth && typeof SpeechSynthesisUtterance === 'function'
      ? (synth as unknown as SynthLike)
      : null;
  } catch {
    return null;
  }
}

function browserUtterance(text: string): UtteranceLike {
  return new SpeechSynthesisUtterance(text) as unknown as UtteranceLike;
}

/** The best Dutch voice: Netherlands Dutch first, on-device voices before online ones. */
export function pickDutchVoice(voices: readonly VoiceLike[]): VoiceLike | null {
  const dutch = voices.filter((voice) =>
    voice.lang.toLowerCase().replace('_', '-').startsWith('nl'),
  );
  const score = (voice: VoiceLike) =>
    (voice.lang.toLowerCase().replace('_', '-') === 'nl-nl' ? 2 : 0) + (voice.localService ? 1 : 0);
  return [...dutch].sort((a, b) => score(b) - score(a))[0] ?? null;
}

export class Speaker {
  private voice: VoiceLike | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private primed = false;
  private readonly synth: SynthLike | null;
  private readonly createUtterance: (text: string) => UtteranceLike;

  constructor(
    private readonly enabled: () => boolean,
    options: SpeakerOptions = {},
  ) {
    this.synth = options.synth === undefined ? browserSynth() : options.synth;
    this.createUtterance = options.createUtterance ?? browserUtterance;
    this.findVoice();
    // Voices often load after start-up.
    this.synth?.addEventListener?.('voiceschanged', () => this.findVoice());
  }

  /** Whether this device can speak Dutch at all. */
  get available(): boolean {
    return this.voice !== null;
  }

  /** Says `text` after `delay` ms, replacing anything said or waiting before. */
  say(text: string, delay = 0): void {
    this.stop();
    if (!this.enabled() || !this.synth || !this.voice) return;
    this.timer = setTimeout(() => {
      this.timer = null;
      if (this.enabled()) this.speak(text, 1);
    }, delay);
  }

  /** Stops speaking now, and cancels anything still waiting to be said. */
  stop(): void {
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
    try {
      this.synth?.cancel();
    } catch {
      // Nothing to stop.
    }
  }

  /**
   * Call from a user gesture. Some browsers (iOS Safari) only allow speech that was
   * started once from a tap, so the first gesture says nothing, silently.
   */
  unlock(): void {
    if (this.primed || !this.enabled() || !this.synth || !this.voice) return;
    this.primed = true;
    this.speak('', 0);
  }

  private speak(text: string, volume: number): void {
    if (!this.synth) return;
    try {
      const utterance = this.createUtterance(text);
      utterance.lang = this.voice?.lang ?? 'nl-NL';
      utterance.voice = this.voice;
      utterance.rate = 0.95;
      utterance.pitch = 1.1;
      utterance.volume = volume;
      this.synth.speak(utterance);
    } catch {
      // Speech is a bonus; never let it break the game.
    }
  }

  private findVoice(): void {
    try {
      this.voice = pickDutchVoice(this.synth?.getVoices() ?? []);
    } catch {
      this.voice = null;
    }
  }
}
