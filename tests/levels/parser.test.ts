import { describe, expect, it } from 'vitest';
import { LevelParseError, parseLevel } from '../../src/levels/parser';
import { at, level } from '../helpers/level';

describe('parseLevel: valid input', () => {
  it('reads dimensions, walls, player, boxes and goals', () => {
    const lvl = level(`
######
#@ $.#
######`);
    expect(lvl.width).toBe(6);
    expect(lvl.height).toBe(3);
    expect(lvl.start.player).toBe(at(lvl, 1, 1));
    expect(lvl.start.boxes).toEqual([at(lvl, 3, 1)]);
    expect(lvl.goals).toEqual([at(lvl, 4, 1)]);
    expect(lvl.walls.filter(Boolean)).toHaveLength(14);
    expect(lvl.start.moves).toBe(0);
    expect(lvl.start.pushes).toBe(0);
  });

  it('keeps the id and name', () => {
    const lvl = parseLevel('####\n#@$.#\n#####', { id: 'abc', name: 'Hallo' });
    expect(lvl.id).toBe('abc');
    expect(lvl.name).toBe('Hallo');
  });

  it('handles a player on a goal (+) and a box on a goal (*)', () => {
    const lvl = level(`
#######
#+$*$ #
#  .  #
#######`);
    expect(lvl.start.player).toBe(at(lvl, 1, 1));
    expect(lvl.goals).toEqual([at(lvl, 1, 1), at(lvl, 3, 1), at(lvl, 3, 2)]);
    expect(lvl.start.boxes).toEqual([at(lvl, 2, 1), at(lvl, 3, 1), at(lvl, 4, 1)]);
  });

  it('ignores blank lines around the map, trailing spaces and CRLF line endings', () => {
    const lvl = parseLevel('\r\n\r\n#####   \r\n#@$.#\r\n#####\r\n\r\n', { id: 'x', name: 'x' });
    expect(lvl.width).toBe(5);
    expect(lvl.height).toBe(3);
  });

  it('pads ragged rows and marks only the inside as floor', () => {
    const lvl = level(`
  ####
###  #
#@$ .#
######`);
    expect(lvl.width).toBe(6);
    expect(lvl.height).toBe(4);
    expect(lvl.floor[at(lvl, 0, 0)]).toBe(false); // outside, top-left corner
    expect(lvl.floor[at(lvl, 1, 0)]).toBe(false);
    expect(lvl.floor[at(lvl, 3, 1)]).toBe(true);
    expect(lvl.floor[at(lvl, 2, 2)]).toBe(true);
    expect(lvl.walls[at(lvl, 0, 1)]).toBe(true);
  });
});

describe('parseLevel: invalid input', () => {
  const parse = (map: string) => () => parseLevel(map, { id: 'bad', name: 'bad' });

  it.each([
    ['an empty level', '\n  \n', /empty/],
    ['no player', '#####\n# $.#\n#####', /no player/],
    ['two players', '######\n#@@$.#\n######', /2 players/],
    [
      'an unknown character',
      '#####\n#@$x.#\n#####',
      /unexpected character "x" at line 2, column 4/,
    ],
    ['no boxes', '####\n#@.#\n####', /no boxes/],
    ['more boxes than goals', '######\n#@$$.#\n######', /2 boxes but 1 goals/],
    ['more goals than boxes', '######\n#@$..#\n######', /1 boxes but 2 goals/],
    ['a gap in the outer wall', '#####\n#@$. \n#####', /not enclosed/],
    ['an open top', '# ###\n#@$.#\n#####', /not enclosed/],
    [
      'a box outside the walls',
      '#####\n#@ .#\n#####\n $   ',
      /box at line 4, column 2 cannot be reached/,
    ],
    ['a goal walled off from the player', '#######\n#@$#.##\n#######', /goal .* cannot be reached/],
    ['a level that is already solved', '####\n#@*#\n####', /already solved/],
  ])('rejects %s', (_label, map, message) => {
    expect(parse(map)).toThrow(LevelParseError);
    expect(parse(map)).toThrow(message);
  });

  it('names the level in the error message', () => {
    expect(parse('')).toThrow('Invalid level "bad"');
  });
});
