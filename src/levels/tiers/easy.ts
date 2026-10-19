import type { LevelDefinition } from '../definitions';

/** easy tier, in increasing difficulty. Solutions found by `src/solver`. */
export const EASY_LEVELS: readonly LevelDefinition[] = [
  {
    id: 'easy-01',
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
    id: 'easy-02',
    name: 'Naar boven',
    map: `
 ###
## ##
# . #
#   #
# $ #
# @ #
#####`,
    solution: 'UU',
  },
  {
    id: 'easy-03',
    name: 'Kruispunt',
    map: `
  ###
###.###
#  $  #
#@    #
### ###
  ###`,
    solution: 'rrU',
  },
  {
    id: 'easy-04',
    name: 'Eromheen',
    map: `
########
#      #
#@ .$  #
#      #
########`,
    solution: 'urrrrdL',
  },
  {
    id: 'easy-05',
    name: 'Langs de muur',
    map: `
#########
#.   $  #
#      @#
#########`,
    solution: 'ulLLLL',
  },
  {
    id: 'easy-06',
    name: 'Het gangetje',
    map: `
#########
#   #####
#@$    .#
#   #####
#########`,
    solution: 'RRRRR',
  },
  {
    id: 'easy-07',
    name: 'Bocht',
    map: `
######
#@   #
# $  #
##  ##
 #  #
 #. #
 ####`,
    solution: 'rDDD',
  },
  {
    id: 'easy-08',
    name: 'Het nisje',
    map: `
#######
#     #
#@ $  #
### ###
  #.#
  ###`,
    solution: 'urrDD',
  },
  {
    id: 'easy-09',
    name: 'Zijkamer',
    map: `
#########
#   #   #
# $   . #
#@  #   #
#########`,
    solution: 'uRRRR',
  },
  {
    id: 'easy-10',
    name: 'Om de hoek',
    map: `
######
#@   #
# $  #
#    #
#   .#
######`,
    solution: 'rDDldRR',
  },
  {
    id: 'easy-11',
    name: 'Twee kanten',
    map: `
#########
#       #
#.$ @ $.#
#       #
#########`,
    solution: 'lLrrrR',
  },
  {
    id: 'easy-12',
    name: 'Boven en onder',
    map: `
#######
#  .  #
#  $  #
#@    #
#  $  #
#  .  #
#######`,
    solution: 'rrUdD',
  },
  {
    id: 'easy-13',
    name: 'Lange weg',
    map: `
########
#@     #
###### #
#.  $  #
########`,
    solution: 'rrrrrddlLLL',
  },
  {
    id: 'easy-14',
    name: 'Kwartslag',
    map: `
#######
#   . #
#     #
# $   #
#@    #
#######`,
    solution: 'rUUluRR',
  },
  {
    id: 'easy-15',
    name: 'Trapje',
    map: `
#######
#@    #
# $   #
### # #
  #   #
  #.  #
  #####`,
    solution: 'dRurDDD',
  },
  {
    id: 'easy-16',
    name: 'Door het gat',
    map: `
#######
#  @  #
#  $  #
### ###
#     #
#.    #
#######`,
    solution: 'DDDrdLL',
  },
  {
    id: 'easy-17',
    name: 'Twee hoeken',
    map: `
#######
#@    #
# $   #
#   # #
### # #
  #  .#
  #####`,
    solution: 'dRRRurDDD',
  },
  {
    id: 'easy-18',
    name: 'Twee dozen',
    map: `
#######
#     #
# $ $ #
#  @  #
# . . #
#######`,
    solution: 'uulDurrDllDurrD',
  },
  {
    id: 'easy-19',
    name: 'Pilaar',
    map: `
#########
#   .   #
#  ###  #
#   $   #
#   @   #
#########`,
    solution: 'ruLLdlUUluRR',
  },
  {
    id: 'easy-20',
    name: 'Achterom',
    map: `
########
#.     #
## ### #
#  $ @ #
#      #
########`,
    solution: 'lLdlUUdrrrruulllL',
  },
];
