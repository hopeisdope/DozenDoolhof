import { describe, expect, it } from 'vitest';
import {
  AudioFeedback,
  NO_WAY_OUT_PHRASE,
  REWARD_PHRASE,
  SILENT,
  STUCK_PHRASES,
  WIN_PHRASES,
} from '../../src/audio/feedback';
import type { Cue, SoundPlayer } from '../../src/audio/sounds';
import type { Speaker } from '../../src/audio/speech';

function feedback() {
  const log: string[] = [];
  const sounds = {
    play: (cue: Cue, delay = 0) => {
      log.push(delay ? `sound:${cue}@${delay}` : `sound:${cue}`);
      return true;
    },
  } as unknown as SoundPlayer;
  const speaker = {
    say: (text: string, delay = 0) => log.push(`say:${text}@${delay}`),
    stop: () => log.push('stop'),
  } as unknown as Speaker;
  return { log, feedback: new AudioFeedback(sounds, speaker) };
}

describe('AudioFeedback', () => {
  it('only plays sounds for ordinary moves; the voice stays quiet', () => {
    const test = feedback();
    test.feedback.moved('step');
    test.feedback.moved('push');
    test.feedback.moved('goal');
    test.feedback.blocked();
    expect(test.log).toEqual(['sound:step', 'sound:push', 'sound:goal', 'sound:bump']);
  });

  it('praises a win after the tune, with different words each time', () => {
    const test = feedback();
    for (let i = 0; i < WIN_PHRASES.length + 1; i++) test.feedback.won(0);
    const said = test.log.filter((line) => line.startsWith('say:'));
    expect(said.map((line) => line.slice(4, line.indexOf('@')))).toEqual([
      ...WIN_PHRASES,
      WIN_PHRASES[0],
    ]);
    for (const line of said) expect(Number(line.split('@')[1])).toBeGreaterThanOrEqual(900);
    expect(test.log.filter((line) => line === 'sound:win')).toHaveLength(WIN_PHRASES.length + 1);
  });

  it('mentions a new reward with a sparkle', () => {
    const test = feedback();
    test.feedback.won(1);
    expect(test.log[0]).toBe('sound:win');
    expect(test.log[1]).toMatch(/^sound:reward@/);
    expect(test.log[2]).toContain(REWARD_PHRASE);
  });

  it('says when one or more boxes got stuck, and when no way out is left', () => {
    const test = feedback();
    test.feedback.stuck(1);
    test.feedback.stuck(2);
    test.feedback.noWayOut();
    expect(test.log).toEqual([
      'sound:stuck',
      `say:${STUCK_PHRASES.one}@450`,
      'sound:stuck',
      `say:${STUCK_PHRASES.more}@450`,
      'sound:stuck',
      `say:${NO_WAY_OUT_PHRASE}@450`,
    ]);
  });

  it('undo and leaving a level cut off whatever is being said', () => {
    const test = feedback();
    test.feedback.undone();
    test.feedback.stop();
    expect(test.log).toEqual(['stop', 'sound:undo', 'stop']);
  });

  it('has a silent version that does nothing', () => {
    expect(() => {
      SILENT.moved('step');
      SILENT.won(2);
      SILENT.stuck(1);
      SILENT.noWayOut();
      SILENT.undone();
      SILENT.blocked();
      SILENT.stop();
    }).not.toThrow();
  });
});
