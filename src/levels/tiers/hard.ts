import type { LevelDefinition } from '../definitions';

/**
 * hard tier, in increasing difficulty. Ids are stable: hard-01 to hard-20 are the
 * original levels, hard-21 to hard-40 were added later and sit between them, so an id
 * does not give the position. Solutions found by `src/solver`.
 */
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
    id: 'hard-21',
    name: 'Bouwput',
    map: `
######
# .@ #
# #  #
#    #
# #$ #
# $  #
#.   #
######`,
    solution: 'ddrddlUUUruLddddLruulldD',
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
    id: 'hard-22',
    name: 'Hijskraan',
    map: `
  #####
  #   ##
### #  #
# @.   #
#  $ $ #
##   ###
 #.  #
 #####`,
    solution: 'rDurrrdLulldlddrruUruLdlDrdL',
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
    id: 'hard-23',
    name: 'Betonmolen',
    map: `
#######
#     #
#   ####
#  $## #
# @    #
#   $ .#
#.  # ##
#######`,
    solution: 'uurDlddrRlluurDrdLulDrrRlldL',
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
    id: 'hard-24',
    name: 'Fundering',
    map: `
#######
#.    #
#     #
# $   #
#  @  #
###$  #
  #  .#
  #####`,
    solution: 'lUUruLdddrrddlUruulldRurDDldR',
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
    id: 'hard-25',
    name: 'Loods',
    map: `
 ####
 #  ####
##   *@#
# $ *###
#.     #
########`,
    solution: 'LLLddlluRdrrUdlluRuulDrRllDrdL',
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
    id: 'hard-26',
    name: 'Havenkade',
    map: `
####
# @###
# $$ ##
#    .#
#..$  #
#######`,
    solution: 'DldRRRuLdlluurDrdLulDrrrdL',
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
    id: 'hard-27',
    name: 'Laadbrug',
    map: `
######
#..  #
#@#$ #
#  $ #
# $ ##
#.  #
#####`,
    solution: 'urrrddLUruLddLrddlluUUdrDrdL',
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
    id: 'hard-28',
    name: 'Stellingen',
    map: `
#####
#. @##
#$$$ #
#  #.#
#.   #
#    #
######`,
    solution: 'lDDlUdddrruruuLulDlddRRlluurDlddrruLdrrU',
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
    id: 'hard-29',
    name: 'Vrachtdepot',
    map: `
   ####
   #  #
####$.#
#.    #
# $ * #
# @####
#  #
####`,
    solution: 'UrurruulDrddLLuLrRdrUlllDlddrUluRR',
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
    id: 'hard-30',
    name: 'Sorteerruimte',
    map: `
########
# @.$. #
## $   #
#   $###
#.   #
######`,
    solution: 'rDrruLdllddrrUdlluurRurrdLLddlluuuRRddLUlDrdL',
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
    id: 'hard-31',
    name: 'Kraanbaan',
    map: `
 #####
 #   #
 #  $##
 # $$ #
##   .#
#@ . .#
#######`,
    solution: 'ruuurDlddrruruLddlluuuurrDDulldRDRluurDrDulldR',
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
    id: 'hard-32',
    name: 'Dokhaven',
    map: `
  ####
###@ #
# $$*#
# #  #
# .  #
#.   #
######`,
    solution: 'DurDlDDrdLuuurDldlluuRlddrruruulDllddrrdrUUdllluurrDrdLdL',
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
    id: 'hard-33',
    name: 'Kistenberg',
    map: `
########
#.     #
# . $$ #
#@$ #  #
# # .  #
########`,
    solution: 'uurrrrDLrrddllluUruLLdldRurrrrddlllUluurrdLrrDrdL',
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
    id: 'hard-34',
    name: 'Bouwplaats',
    map: `
####
#. ####
#$  $ #
#  .. #
#  $ @#
#  ####
####`,
    solution: 'ullululDrdrrruLdllulDrrruLdlluurDldRRlddlUUUrrrrddlLullddrUluR',
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
    id: 'hard-35',
    name: 'Stapelplaats',
    map: `
    ####
##### .#
#  $  $#
#    $ #
# @##. #
### .  #
  ######`,
    solution: 'urrururDlDllluRdrrDrdLuuurDllluRdrruulDrdLddrUUUllldRurD',
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
    id: 'hard-36',
    name: 'Graafmachine',
    map: `
######
#@.  #
#.#$*##
#$#   #
# # $ #
#.    #
#######`,
    solution: 'rrDDrrddlllluUddrrrruullDurrddlLuuuurDldddrruuLrddlluUUruLddddrUUddlL',
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
    id: 'hard-37',
    name: 'Kiepwagen',
    map: `
  #####
### . #
#@$ $ #
#*$  ##
#  . #
# .  #
######`,
    solution: 'DRRuurrdLulDDlluRRurrdLulDldddrruUUdLulDrrddlllUdrrruullD',
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
    id: 'hard-38',
    name: 'Overslag',
    map: `
#######
# @  .#
#     ###
##*#   .#
#   $ $ #
##   ####
 #####`,
    solution: 'drrdrdLdlluUUluRdrrdrrrdLLuullldddrrUUddlluuurRurDllluRRddRRdllLdlU',
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
    id: 'hard-39',
    name: 'Grote klus',
    map: `
#######
#+$  .#
# $. $#
##$   #
 # .  #
 ######`,
    solution: 'dRRurDllluRdrddrruLuurDllluRdrddllUdrruulDuulldRdrruruLLLddrrdrUU',
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
  {
    id: 'hard-40',
    name: 'Meesterproef',
    map: `
#########
# .    .#
#   $$$ #
# #  #  #
#  @ #  #
#.  ### #
#########`,
    solution: 'uuurDurrrddlULuRdlLulldlddrruUruLdddrUluurrdLulDDrdLLruulldD',
  },
];
