import { describe, expect, it } from 'vitest';
import {
  RADIUS,
  describeBrick,
  describeWalls,
  roundedRectPath,
  wallLayerSvg,
} from '../../src/render/walls';
import { LEVELS } from '../../src/levels/definitions';
import { at, level } from '../helpers/level';

// Corner order: NW, NE, SE, SW.
const ROOM = level(`
#####
#@$.#
#####`);

describe('describeBrick', () => {
  it('turns the outer corner of a bend into a big curve', () => {
    const corner = describeBrick(ROOM, at(ROOM, 0, 0));
    expect(corner.sides).toEqual({ n: 'outside', e: 'wall', s: 'wall', w: 'outside' });
    expect(corner.backing).toEqual([RADIUS.bend, 0, 0, 0]);
    expect(corner.brick).toEqual([RADIUS.bend, RADIUS.joint, RADIUS.joint, RADIUS.joint]);

    const bottomRight = describeBrick(ROOM, at(ROOM, 4, 2));
    expect(bottomRight.backing).toEqual([0, 0, RADIUS.bend, 0]);
  });

  it('keeps straight pieces square-ish so neighbours join seamlessly', () => {
    const top = describeBrick(ROOM, at(ROOM, 2, 0));
    expect(top.sides).toEqual({ n: 'outside', e: 'wall', s: 'floor', w: 'wall' });
    expect(top.backing).toEqual([0, 0, 0, 0]);
    expect(top.brick).toEqual([RADIUS.joint, RADIUS.joint, RADIUS.joint, RADIUS.joint]);
  });

  it('rounds a free-standing wall block on every side without big curves', () => {
    const lvl = level(`
#######
#@ #  #
#  #  #
# $  .#
#######`);
    // (3,1) touches walls above and below only: a vertical piece.
    const pillar = describeBrick(lvl, at(lvl, 3, 1));
    expect(pillar.sides).toEqual({ n: 'wall', e: 'floor', s: 'wall', w: 'floor' });
    expect(pillar.backing).toEqual([0, 0, 0, 0]);
  });

  it('uses a small radius, not a big curve, where a corner faces the floor', () => {
    const lvl = level(`
######
#@   #
# ## #
#  $.#
######`);
    // (2,2) has a wall to the east only: an end piece pointing into the room.
    const end = describeBrick(lvl, at(lvl, 2, 2));
    expect(end.sides).toEqual({ n: 'floor', e: 'wall', s: 'floor', w: 'floor' });
    expect(end.backing).toEqual([0, 0, 0, 0]);
    expect(end.brick).toEqual([RADIUS.inner, RADIUS.joint, RADIUS.joint, RADIUS.inner]);
  });

  it('describes exactly one brick per wall cell', () => {
    for (const lvl of LEVELS) {
      expect(describeWalls(lvl)).toHaveLength(lvl.walls.filter(Boolean).length);
    }
  });
});

describe('roundedRectPath', () => {
  it('draws a closed path through all four sides', () => {
    expect(roundedRectPath(0, 0, 100, 100, [0, 0, 0, 0])).toBe(
      'M0 0H100A0 0 0 0 1 100 0V100A0 0 0 0 1 100 100H0A0 0 0 0 1 0 100V0A0 0 0 0 1 0 0Z',
    );
  });

  it('scales radii down when they would not fit', () => {
    // 72 + 72 > 100: both radii shrink to 50.
    expect(roundedRectPath(0, 0, 100, 100, [72, 72, 0, 0])).toContain('A50 50');
  });
});

describe('wallLayerSvg', () => {
  it('produces one SVG with a viewBox matching the level size', () => {
    const svg = wallLayerSvg(ROOM);
    expect(svg).toContain('viewBox="0 0 500 300"');
    expect(svg.match(/<svg/g)).toHaveLength(1);
    expect(svg).not.toContain('NaN');
  });
});
