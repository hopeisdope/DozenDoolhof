import type { Cue, SoundPlayer } from './sounds';
import type { Speaker } from './speech';

/**
 * What the play screen tells the player by ear. Sounds accompany moves; the voice speaks
 * only at a few moments a child who cannot read yet would otherwise miss: a win, a box
 * that got stuck and a board that cannot be solved any more. Never on ordinary moves.
 */
export interface GameFeedback {
  moved(cue: Cue): void;
  blocked(): void;
  undone(): void;
  stuck(boxes: number): void;
  won(newRewards: number): void;
  noWayOut(): void;
  /** Cuts off speech, e.g. when leaving a level. */
  stop(): void;
}

export const SILENT: GameFeedback = {
  moved: () => undefined,
  blocked: () => undefined,
  undone: () => undefined,
  stuck: () => undefined,
  won: () => undefined,
  noWayOut: () => undefined,
  stop: () => undefined,
};

/** Praise for a win; they take turns so the same words do not come back every time. */
export const WIN_PHRASES = ['Gelukt!', 'Goed gedaan!', 'Super!', 'Knap hoor!'] as const;
export const REWARD_PHRASE = 'Je hebt iets nieuws!';
export const STUCK_PHRASES = {
  one: 'Oei, deze doos zit vast.',
  more: 'Oei, deze dozen zitten vast.',
};
export const NO_WAY_OUT_PHRASE = 'Zo lukt het niet meer.';

/** Speech waits for the win tune to finish, so the two never talk over each other. */
const AFTER_WIN_TUNE_MS = 950;
const AFTER_SHORT_SOUND_MS = 450;

export class AudioFeedback implements GameFeedback {
  private wins = 0;

  constructor(
    private readonly sounds: SoundPlayer,
    private readonly speaker: Speaker,
  ) {}

  moved(cue: Cue): void {
    this.sounds.play(cue);
  }

  blocked(): void {
    this.sounds.play('bump');
  }

  undone(): void {
    this.speaker.stop();
    this.sounds.play('undo');
  }

  stuck(boxes: number): void {
    this.sounds.play('stuck');
    this.speaker.say(boxes > 1 ? STUCK_PHRASES.more : STUCK_PHRASES.one, AFTER_SHORT_SOUND_MS);
  }

  won(newRewards: number): void {
    this.sounds.play('win');
    if (newRewards > 0) this.sounds.play('reward', 0.75);
    const praise = WIN_PHRASES[this.wins++ % WIN_PHRASES.length] ?? WIN_PHRASES[0];
    this.speaker.say(newRewards > 0 ? `${praise} ${REWARD_PHRASE}` : praise, AFTER_WIN_TUNE_MS);
  }

  noWayOut(): void {
    this.sounds.play('stuck');
    this.speaker.say(NO_WAY_OUT_PHRASE, AFTER_SHORT_SOUND_MS);
  }

  stop(): void {
    this.speaker.stop();
  }
}
