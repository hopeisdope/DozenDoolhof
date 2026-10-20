import { describe, expect, it } from 'vitest';
import { createGame, move } from '../../src/engine/history';
import { moveCue, SOUNDS, SoundPlayer, soundLength, type Cue } from '../../src/audio/sounds';
import { level } from '../helpers/level';

/** A minimal stand-in for the Web Audio API that records what gets scheduled. */
class FakeAudioContext {
  state: 'suspended' | 'running' = 'running';
  currentTime = 0;
  readonly sampleRate = 8000;
  readonly destination = {};
  oscillators = 0;
  noises = 0;
  resumed = 0;
  suspended = 0;

  private param() {
    return {
      value: 0,
      setValueAtTime: () => undefined,
      linearRampToValueAtTime: () => undefined,
      exponentialRampToValueAtTime: () => undefined,
    };
  }

  createGain() {
    return { gain: this.param(), connect: () => undefined };
  }

  createOscillator() {
    this.oscillators += 1;
    return {
      type: 'sine',
      frequency: this.param(),
      connect: () => undefined,
      start: () => undefined,
      stop: () => undefined,
    };
  }

  createBufferSource() {
    this.noises += 1;
    return {
      buffer: null,
      connect: () => undefined,
      start: () => undefined,
      stop: () => undefined,
    };
  }

  createBiquadFilter() {
    return { type: 'lowpass', frequency: this.param(), connect: () => undefined };
  }

  createBuffer(_channels: number, length: number) {
    const data = new Float32Array(length);
    return { getChannelData: () => data };
  }

  resume() {
    this.resumed += 1;
    this.state = 'running';
    return Promise.resolve();
  }

  suspend() {
    this.suspended += 1;
    this.state = 'suspended';
    return Promise.resolve();
  }
}

function player(options: { enabled?: () => boolean; context?: FakeAudioContext | null } = {}) {
  const context = options.context === undefined ? new FakeAudioContext() : options.context;
  let created = 0;
  let clock = 1000;
  const played: Cue[] = [];
  const sounds = new SoundPlayer(options.enabled ?? (() => true), {
    createContext: () => {
      created += 1;
      return context as unknown as AudioContext;
    },
    now: () => clock,
    random: () => 0.5,
    onPlay: (cue) => played.push(cue),
  });
  return {
    sounds,
    context,
    played,
    created: () => created,
    advance: (ms: number) => (clock += ms),
  };
}

describe('moveCue', () => {
  // Two boxes in a row: the first push moves the near box, the second puts it on the goal.
  const lvl = level(['########', '#@ $ . #', '#   $. #', '########'].join('\n'));
  const play = (moves: string) =>
    [...moves].reduce(
      (game, key) => move(game, ({ u: 'up', d: 'down', l: 'left', r: 'right' } as const)[key]!),
      createGame(lvl),
    );

  it('is a step when no box moves', () => {
    expect(moveCue(lvl, play('').state, play('d').state)).toBe('step');
    expect(moveCue(lvl, play('').state, play('r').state)).toBe('step');
  });

  it('is a push, or a goal when the push puts a box on a goal', () => {
    expect(moveCue(lvl, play('r').state, play('rr').state)).toBe('push');
    expect(moveCue(lvl, play('rr').state, play('rrr').state)).toBe('goal');
  });

  it('is a push when a box leaves a goal', () => {
    const onGoal = level(['#######', '#@* $.#', '#######'].join('\n'));
    const game = createGame(onGoal);
    expect(moveCue(onGoal, game.state, move(game, 'right').state)).toBe('push');
  });
});

describe('the sounds', () => {
  it('are all short and soft, with quiet footsteps', () => {
    for (const [cue, sound] of Object.entries(SOUNDS)) {
      expect(soundLength(sound), cue).toBeLessThanOrEqual(1);
      for (const note of sound.notes) {
        expect(note.volume, cue).toBeGreaterThan(0);
        expect(note.volume, cue).toBeLessThanOrEqual(0.3);
        expect(note.from, cue).toBeGreaterThan(40);
      }
    }
    const loudest = (cue: Cue) => Math.max(...SOUNDS[cue].notes.map((note) => note.volume));
    expect(loudest('step')).toBeLessThan(loudest('push'));
    expect(loudest('step')).toBeLessThan(loudest('win'));
  });
});

describe('SoundPlayer', () => {
  it('creates no audio at all while sound is off', () => {
    const test = player({ enabled: () => false });
    test.sounds.unlock();
    expect(test.sounds.play('push')).toBe(false);
    expect(test.created()).toBe(0);
    expect(test.played).toEqual([]);
  });

  it('starts audio lazily and schedules the notes of a cue', () => {
    const test = player();
    expect(test.created()).toBe(0);
    expect(test.sounds.play('win')).toBe(true);
    expect(test.created()).toBe(1);
    expect(test.context!.oscillators).toBe(SOUNDS.win.notes.length);
    expect(test.sounds.play('push')).toBe(true);
    expect(test.context!.noises).toBe(1);
    expect(test.created()).toBe(1);
    expect(test.played).toEqual(['win', 'push']);
  });

  it('lets footsteps through at a calm pace only', () => {
    const test = player();
    expect(test.sounds.play('step')).toBe(true);
    test.advance(40);
    expect(test.sounds.play('step')).toBe(false);
    expect(test.sounds.play('push')).toBe(true); // other sounds are not held back
    test.advance(60);
    expect(test.sounds.play('step')).toBe(true);
    expect(test.played).toEqual(['step', 'push', 'step']);
  });

  it('resumes a suspended context on a gesture and suspends in the background', () => {
    const test = player();
    test.context!.state = 'suspended';
    test.sounds.unlock();
    expect(test.context!.resumed).toBe(1);
    expect(test.context!.state).toBe('running');
    test.sounds.suspend();
    expect(test.context!.suspended).toBe(1);
  });

  it('stays quiet and never throws without Web Audio', () => {
    const test = player({ context: null });
    expect(test.sounds.play('win')).toBe(false);
    expect(test.sounds.play('win')).toBe(false);
    expect(() => test.sounds.unlock()).not.toThrow();
    expect(() => test.sounds.suspend()).not.toThrow();
    expect(test.created()).toBe(1); // it does not keep trying
    const broken = new SoundPlayer(() => true, {
      createContext: () => {
        throw new Error('NotAllowedError');
      },
    });
    expect(broken.play('win')).toBe(false);
  });

  it('follows the setting as it changes', () => {
    let on = true;
    const test = player({ enabled: () => on });
    expect(test.sounds.play('undo')).toBe(true);
    on = false;
    test.advance(1000);
    expect(test.sounds.play('undo')).toBe(false);
  });
});
