import type { LevelDefinition } from '../definitions';

/** hard tier, in increasing difficulty. Solutions found by `src/solver`. */
export const HARD_LEVELS: readonly LevelDefinition[] = [
  {
    id: 'hard-01',
    name: 'Kronkelpad',
    map: `
  ####
###  #
#   $#
# #. ##
# .$  #
#  @  #
#######`,
    solution: 'ruuluurDDullldddrrUdrruLL',
  },
  {
    id: 'hard-02',
    name: 'Tuin',
    map: `
########
#   #  #
# #   .#
#   ## #
## @  .#
# $#$# #
#      #
########`,
    solution: 'rrrddllllUUruuullddRluurrdDldRRRlllddrrrruUUdddllUdlluurRR',
  },
  {
    id: 'hard-03',
    name: 'Schuurtje',
    map: `
 ######
##    #
# $## #
# . $ #
#  #@ #
#. .$ #
#######`,
    solution: 'ruLLLrrruulllDlDDuururrrddddL',
  },
  {
    id: 'hard-04',
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
    solution: 'uuLulDDurrddddllluuRDldR',
  },
  {
    id: 'hard-05',
    name: 'Draaikolk',
    map: `
########
#  #   #
# .$ # #
#  #   #
##$. # #
#  @#  #
# .  $ #
########`,
    solution: 'lUUluurDDDrruuLrddlddlluRurrurrdddLLLU',
  },
  {
    id: 'hard-06',
    name: 'Magazijn',
    map: `
########
#  #   #
#  $ $ #
## ## .#
#    #.#
# @$  .#
########`,
    solution: 'urrdrruuuulldRdrddllulluuRRurrDDuulldRurDlllldddRRR',
  },
  {
    id: 'hard-07',
    name: 'Boomgaard',
    map: `
########
#   #  #
# $    #
### # ##
# $.  .#
# @#   #
# $. # #
########`,
    solution: 'luRRRRuullulldRurDrrddllldldRuurrruullD',
  },
  {
    id: 'hard-08',
    name: 'Kelder',
    map: `
 ######
 #  . #
## $#$##
#  .@  #
## #$ ##
 #   . #
 #######`,
    solution: 'lluurrrDDllUluRddrrDulllddrrUruL',
  },
  {
    id: 'hard-09',
    name: 'Voorraadkast',
    map: `
########
#  #   #
#   .  #
## #$# #
#  .@  #
# #$#$##
#   .  #
########`,
    solution: 'lllddrrrrUdlllluuruurrrrddLddlllluurrDuluurrrrddlLrruullllddlddrRlluuruurrrrddllU',
  },
  {
    id: 'hard-10',
    name: 'Containers',
    map: `
########
#  #   #
# $# $ #
#   .$ #
###.#. #
#  @   #
#      #
########`,
    solution: 'uulluurDldRRddrruruuLDDrddlluluuRldddrrruuuuullDrDrddLLdlU',
  },
  {
    id: 'hard-11',
    name: 'Zuilenhal',
    map: `
#########
#       #
# #$#$# #
#   @$  #
# # # # #
#  ...  #
#########`,
    solution: 'llluurrDDuurrrrddlLrruullDDuullddDuuurrddLruulldDrrDullllddrRlluurrD',
  },
  {
    id: 'hard-12',
    name: 'Werf',
    map: `
 ########
 #   #  #
## $ $  #
#  #.## #
# .@  . #
###$ #  #
  #     #
  #######`,
    solution: 'luuRurDDullddrRddrruuruulLrrddddllluulluuurrDllddrrRlddlUruL',
  },
  {
    id: 'hard-13',
    name: 'Bouwkeet',
    map: `
 #######
 #     #
 #$#$# #
## $.  #
#  ###.#
# @   .#
#   ####
#####`,
    solution: 'rrrruuuullllDDRRRllluurrDurrdDuullllddDldRRRR',
  },
  {
    id: 'hard-14',
    name: 'Hoekwinkel',
    map: `
 #######
 #     #
##$##  #
#   #  #
# @$  ##
### $..#
  #  . #
  ######`,
    solution: 'RddrruuuuulllDDrdRlulldRRuluurrrddDuuullldddrRDRlululuurrrddDldldR',
  },
  {
    id: 'hard-15',
    name: 'Steiger',
    map: `
#######
#.    #
#.$ # #
#.  $ #
### # #
# $@  #
#     #
#######`,
    solution: 'uuuLurrrddLrddlluUUdrruulLLddrdddlluRdrUUdrruulLL',
  },
  {
    id: 'hard-16',
    name: 'Gangenstelsel',
    map: `
#########
#  #    #
#    ## #
##$#  $.#
#  @ #$.#
# #    .#
#   #####
#####`,
    solution: 'ruullDurrdrRlluurrrdDlllddldlluuRRluurrdDldRRRUdlluurR',
  },
  {
    id: 'hard-17',
    name: 'Opslag',
    map: `
########
#  #   #
#  $ $ #
# ## # #
#  #  .#
# @$  .#
###   .#
  ######`,
    solution: 'uluurRlldddrRdrruuruuullDRurDllDurrDullllldddrrRlluluurrrdDDRlldRR',
  },
  {
    id: 'hard-18',
    name: 'Pakhuis',
    map: `
#########
#   #   #
#   $ $ #
#  ###  #
# @ $ . #
#   .   #
### . ###
  #####`,
    solution:
      'drrrururuulldLLulDrrrurDllllDurrrrDulllldDrdrruLLdrrrruuullllldlddRRlluurDldRurrDulldR',
  },
  {
    id: 'hard-19',
    name: 'Naast elkaar',
    map: `
#########
#   #   #
# $ $ $ #
#   @   #
#.  #  .#
#   .   #
#########`,
    solution: 'luulDrdrruLdldlluuurrDrrurDllllDurDurrrDlllDLurrrdRullldldR',
  },
  {
    id: 'hard-20',
    name: 'Tweelingkamers',
    map: `
#########
#   #   #
# .  $. #
#   #   #
## ###$##
#  $@$  #
#  . .  #
#########`,
    solution: 'dlluuuurrRurrdLLLLdldddrrrruUUdddlluLdrrruuululldldDrrRllluururrdrdDllllldRurrrrrdL',
  },
];
