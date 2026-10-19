import type { LevelDefinition } from '../definitions';

/**
 * easy tier, in increasing difficulty. Ids are stable: easy-01 to easy-20 are the
 * original levels, easy-21 to easy-40 were added later and sit between them, so an id
 * does not give the position. Solutions found by `src/solver`.
 */
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
    id: 'easy-21',
    name: 'Klein hokje',
    map: `
  ####
  #  #
###  ###
#@  $ .#
########`,
    solution: 'rrRR',
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
    id: 'easy-22',
    name: 'Rechtdoor',
    map: `
######
#  . #
# $# #
# @ ##
#####`,
    solution: 'UluR',
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
    id: 'easy-23',
    name: 'Zolderkamer',
    map: `
###
# ###
# # #
#.#@#
# $ #
#  ##
####`,
    solution: 'dLdlU',
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
    id: 'easy-24',
    name: 'Bijkeuken',
    map: `
#####
#  .#
# $ #
#  ##
# @#
####`,
    solution: 'uUluR',
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
    id: 'easy-25',
    name: 'Halletje',
    map: `
#####
#.  #
# $ #
#  @#
# ###
###`,
    solution: 'lUruL',
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
    id: 'easy-26',
    name: 'Washok',
    map: `
   ####
   #  ##
#### $@#
#  .  ##
#######`,
    solution: 'LulDrdL',
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
    id: 'easy-27',
    name: 'Tuinhuisje',
    map: `
#####
#  .##
#  $@#
#   ##
#####`,
    solution: 'LdlUluR',
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
    id: 'easy-28',
    name: 'Gangkast',
    map: `
###
# ###
#   ##
#  $@#
#. ###
####`,
    solution: 'LLulD',
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
    id: 'easy-29',
    name: 'Portaal',
    map: `
#####
#.  ##
#  $@#
#  # #
# ####
###`,
    solution: 'LullddrUruL',
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
    id: 'easy-30',
    name: 'Speelhoek',
    map: `
######
#@#  #
# $  #
##  .#
 #####`,
    solution: 'dRdrruulDldR',
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
    id: 'easy-31',
    name: 'Fietsenhok',
    map: `
#####
#   #
#@$ ##
#    #
#.####
###`,
    solution: 'urDrdLulD',
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
    id: 'easy-32',
    name: 'Kippenhok',
    map: `
####
#  ####
#   $@#
#  .###
#####`,
    solution: 'LLdlluurDldR',
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
    id: 'easy-33',
    name: 'Kastje',
    map: `
###
#.#
# ####
#$ $.#
#   @#
######`,
    solution: 'lllUUdrR',
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
    id: 'easy-34',
    name: 'Trapportaal',
    map: `
#####
#.  #
#$  #
# $##
#@ .#
#####`,
    solution: 'uUrDldR',
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
    id: 'easy-35',
    name: 'Erker',
    map: `
#####
#@  #
#.# #
# $$#
#  .#
#####`,
    solution: 'rrdDLdlU',
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
    id: 'easy-36',
    name: 'Vensterbank',
    map: `
   ###
#### #
#. $@#
#  $ #
####.#
   ###`,
    solution: 'LLdRurD',
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
    id: 'easy-37',
    name: 'Bergruimte',
    map: `
#####
# . #
# $ #
#@$ #
#  .#
#####`,
    solution: 'RUrD',
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
    id: 'easy-38',
    name: 'Hondenhok',
    map: `
 ###
 # ####
##  $+#
#.  $ #
#######`,
    solution: 'dLLuRdlL',
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
    id: 'easy-39',
    name: 'Zandbak',
    map: `
      ###
   #### #
####    #
# $     #
#@#    .#
#########`,
    solution: 'uRRdrruulDldRRR',
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
  {
    id: 'easy-40',
    name: 'Werkbank',
    map: `
########
#@###  #
# $    #
# #    #
####   #
   #  .#
   #####`,
    solution: 'dRRRdrruulDDDldR',
  },
];
