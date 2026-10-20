import { describe, expect, it } from 'vitest';
import { createGame, move } from '../../src/engine/history';
import { directionTo, walkPath } from '../../src/engine/path';
import type { Direction } from '../../src/engine/state';
import { at, deepFreeze, level } from '../helpers/level';

// A room with a box in the middle of the way and a pillar.
const ROOM = level(['#######', '#@    #', '# #$  #', '#    .#', '#######'].join('\n'));

function walk(directions: readonly Direction[]) {
  return directions.reduce((game, direction) => move(game, direction), createGame(ROOM));
}

describe('walkPath', () => {
  it('finds the shortest walk to a free cell', () => {
    const path = walkPath(ROOM, ROOM.start, at(ROOM, 5, 1))!;
    expect(path).toEqual(['right', 'right', 'right', 'right']);
    const end = walk(path).state;
    expect(end.player).toBe(at(ROOM, 5, 1));
    expect(end.boxes).toEqual(ROOM.start.boxes);
    expect(end.pushes).toBe(0);
  });

  it('goes around boxes and walls instead of pushing', () => {
    const target = at(ROOM, 4, 3);
    const path = walkPath(ROOM, ROOM.start, target)!;
    expect(path).toHaveLength(5);
    const end = walk(path).state;
    expect(end.player).toBe(target);
    expect(end.pushes).toBe(0);
    expect(end.boxes).toEqual(ROOM.start.boxes);
  });

  it('is empty for the player’s own cell and null for walls, boxes and cut-off cells', () => {
    expect(walkPath(ROOM, ROOM.start, ROOM.start.player)).toEqual([]);
    expect(walkPath(ROOM, ROOM.start, at(ROOM, 0, 0))).toBeNull(); // wall
    expect(walkPath(ROOM, ROOM.start, at(ROOM, 2, 2))).toBeNull(); // pillar
    expect(walkPath(ROOM, ROOM.start, at(ROOM, 3, 2))).toBeNull(); // box
    expect(walkPath(ROOM, ROOM.start, -1)).toBeNull();
    expect(walkPath(ROOM, ROOM.start, 999)).toBeNull();
    const corridor = level(['######', '#@$ .#', '######'].join('\n'));
    expect(walkPath(corridor, corridor.start, at(corridor, 3, 1))).toBeNull(); // behind a box
  });

  it('never changes the state it reads', () => {
    const state = deepFreeze({ ...ROOM.start, boxes: [...ROOM.start.boxes] });
    expect(() => walkPath(ROOM, state, at(ROOM, 4, 3))).not.toThrow();
  });
});

describe('directionTo', () => {
  it('names the direction to a neighbouring cell only', () => {
    const player = ROOM.start.player;
    expect(directionTo(ROOM, player, at(ROOM, 2, 1))).toBe('right');
    expect(directionTo(ROOM, player, at(ROOM, 1, 2))).toBe('down');
    expect(directionTo(ROOM, player, at(ROOM, 0, 1))).toBe('left');
    expect(directionTo(ROOM, player, at(ROOM, 1, 0))).toBe('up');
    expect(directionTo(ROOM, player, at(ROOM, 3, 1))).toBeNull();
    expect(directionTo(ROOM, player, player)).toBeNull();
  });
});
