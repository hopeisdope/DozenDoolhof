import { describe, expect, it } from 'vitest';
import { createGame, move, restart, undo, type Game } from '../../src/engine/history';
import type { Direction } from '../../src/engine/state';
import { describeMotion } from '../../src/render/motion';
import { level } from '../helpers/level';

const LEVEL = level(`
#######
#     #
#@ $ .#
#     #
#######`);

function step(game: Game, direction: Direction) {
  const next = move(game, direction);
  return { next, motion: describeMotion(LEVEL, game.state, next.state, 'down') };
}

describe('describeMotion', () => {
  it.each<Direction>(['up', 'down', 'right'])('walking %s faces that way', (direction) => {
    const { motion } = step(createGame(LEVEL), direction);
    expect(motion).toEqual({ facing: direction, walking: true, pushing: false });
  });

  it('shows the push pose when a box is pushed', () => {
    const walked = move(createGame(LEVEL), 'right');
    const { motion } = step(walked, 'right');
    expect(motion).toEqual({ facing: 'right', walking: true, pushing: true });
  });

  it('keeps facing the box while an undo pulls it back', () => {
    const pushed = move(move(createGame(LEVEL), 'right'), 'right');
    const undone = undo(pushed);
    const motion = describeMotion(LEVEL, pushed.state, undone.state, 'right');
    expect(motion).toEqual({ facing: 'right', walking: true, pushing: true });
  });

  it('walks backwards without the push pose when undoing a plain step', () => {
    const walked = move(createGame(LEVEL), 'up');
    const motion = describeMotion(LEVEL, walked.state, undo(walked).state, 'up');
    expect(motion).toEqual({ facing: 'down', walking: true, pushing: false });
  });

  it('faces the camera without walking after a restart', () => {
    const played = move(move(move(createGame(LEVEL), 'up'), 'right'), 'right');
    const motion = describeMotion(LEVEL, played.state, restart(played).state, 'right');
    expect(motion).toEqual({ facing: 'down', walking: false, pushing: false });
  });

  it('keeps the current facing when the player does not move', () => {
    const { state } = move(createGame(LEVEL), 'up');
    expect(describeMotion(LEVEL, state, state, 'left')).toEqual({
      facing: 'left',
      walking: false,
      pushing: false,
    });
  });
});
