import type { Level } from '../engine/state';
import { parseLevel } from './parser';

export interface LevelDefinition {
  readonly id: string;
  readonly name: string;
  readonly map: string;
  /**
   * A known solution in LURD notation: `u d l r` walk, `U D L R` push.
   * Checked by the test suite so every shipped level is provably solvable.
   */
  readonly solution: string;
}

/** Temporary test levels for phase 1, in increasing difficulty. */
export const LEVEL_DEFINITIONS: readonly LevelDefinition[] = [
  {
    id: 'test-1',
    name: 'Eerste duw',
    map: `
#######
#     #
#@ $ .#
#     #
#######`,
    solution: 'rRR',
  },
  {
    id: 'test-2',
    name: 'Om de hoek',
    map: `
######
#@   #
# $  #
#    #
#   .#
######`,
    solution: 'dRRurDD',
  },
  {
    id: 'test-3',
    name: 'Twee dozen',
    map: `
#######
#     #
# $ $ #
#  @  #
# . . #
#######`,
    solution: 'uulDDuurrDD',
  },
  {
    id: 'test-4',
    name: 'Kronkelpad',
    map: `
  ####
###  #
#   $#
# #. ##
# .$  #
#  @  #
#######`,
    solution: 'ruLuuurDDlddrruLdlU',
  },
  {
    id: 'test-5',
    name: 'Doolhofje',
    map: `
 #####
 #   ###
 # $   #
## # # #
#  .@  #
# $  ###
#  . #
######`,
    solution: 'llDurruuLulDDDlddRUluR',
  },
];

export const LEVELS: readonly Level[] = LEVEL_DEFINITIONS.map((definition) =>
  parseLevel(definition.map, definition),
);
