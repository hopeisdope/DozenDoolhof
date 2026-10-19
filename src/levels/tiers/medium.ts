import type { LevelDefinition } from '../definitions';

/**
 * medium tier, in increasing difficulty. Ids are stable: medium-01 to medium-20 are the
 * original levels, medium-21 to medium-40 were added later and sit between them, so an id
 * does not give the position. Solutions found by `src/solver`.
 */
export const MEDIUM_LEVELS: readonly LevelDefinition[] = [
  {
    id: 'medium-01',
    name: 'Muurtje',
    map: `
########
#      #
# #### #
#  $ @ #
#.     #
########`,
    solution: 'lLLrrrruullllldD',
  },
  {
    id: 'medium-21',
    name: 'Wandelpad',
    map: `
#######
#.    #
#  $  #
# @####
#  #
####`,
    solution: 'uurrdLullddrUruL',
  },
  {
    id: 'medium-02',
    name: 'Grote zaal',
    map: `
#########
#@      #
#  # #  #
#       #
#  #.#$ #
#       #
#########`,
    solution: 'ddddrrrrrUruLLruulldD',
  },
  {
    id: 'medium-22',
    name: 'Rondje om',
    map: `
 ###
##.###
#    #
# $@ #
# #  #
# # ##
#####`,
    solution: 'ulldRurrddlUruLdlU',
  },
  {
    id: 'medium-03',
    name: 'De tuinmuur',
    map: `
#########
#   #   #
#@  #   #
#     . #
###$  ###
  #   #
  #####`,
    solution: 'drrrddlUUluurDldRRR',
  },
  {
    id: 'medium-23',
    name: 'Slingerweg',
    map: `
#####
#.# #
#@  ###
#  $  #
#     #
#######`,
    solution: 'ddrrruLdlUruLdlU',
  },
  {
    id: 'medium-04',
    name: 'Grote omweg',
    map: `
##########
#@   #   #
# $  # . #
#    #   #
#        #
#        #
##########`,
    solution: 'rDDldRRRRRdrUU',
  },
  {
    id: 'medium-24',
    name: 'Achterdeur',
    map: `
####
#. #
# $###
#    #
#    #
## #@#
 #####`,
    solution: 'uullluurDlddrruLdlUU',
  },
  {
    id: 'medium-05',
    name: 'Hoekkamer',
    map: `
########
#      #
#$## # #
#  #   #
#.$@ # #
#. #   #
########`,
    solution: 'ruuulllDDDuuurrrdddlL',
  },
  {
    id: 'medium-25',
    name: 'Zijpad',
    map: `
####
#  #
#  ###
#    #
#.   #
###$##
  #@#
  ###`,
    solution: 'UUruLdlluurDrdL',
  },
  {
    id: 'medium-06',
    name: 'De S',
    map: `
#########
#@      #
######  #
#       #
# $######
#      .#
#########`,
    solution: 'rrrrrddllllDldRRRRR',
  },
  {
    id: 'medium-26',
    name: 'Binnenplaats',
    map: `
   #####
####  .#
#@#    #
# #  $ #
#    ###
######`,
    solution: 'ddrruurrrdLullddrUluRdrUluR',
  },
  {
    id: 'medium-07',
    name: 'Dubbele bocht',
    map: `
#######
#.  $ #
## ## #
#  @  #
# ## ##
# $  .#
#######`,
    solution: 'rruuLLLddlddRRR',
  },
  {
    id: 'medium-27',
    name: 'Steegje',
    map: `
#####
#.  ##
#    #
# $@ #
# #  #
##  ##
 ####`,
    solution: 'ulldRurrddlUruLdlUruL',
  },
  {
    id: 'medium-08',
    name: 'Hoge kast',
    map: `
######
#@   #
# $  #
## # #
#    #
# #  #
#   .#
######`,
    solution: 'rDDurrddddllluuRRluurrdDD',
  },
  {
    id: 'medium-28',
    name: 'Brugje',
    map: `
 ######
##   .#
#  # ##
#    ##
### $@#
  #  ##
  ####`,
    solution: 'LdlUruuullddRdrUUdlluurR',
  },
  {
    id: 'medium-09',
    name: 'Omweg door de tuin',
    map: `
########
#@     #
# ## # #
#  # $ #
## # ###
#    . #
#      #
########`,
    solution: 'rrrrrddLruulldDDuuulllddrddrR',
  },
  {
    id: 'medium-29',
    name: 'Tuinpad',
    map: `
 #######
 #   @ #
###$ $ #
#  .####
# #.#
#####`,
    solution: 'llDurrrdLulldDuurrdLulD',
  },
  {
    id: 'medium-10',
    name: 'Kronkel',
    map: `
 #######
 #  #  #
##   $ #
#  #$# #
# .@.# #
#  #   #
########`,
    solution: 'rdrruuuLLLulDDurrD',
  },
  {
    id: 'medium-30',
    name: 'Kruip-door-sluip-door',
    map: `
   ####
####  #
#. $  #
#$   .#
#@ ####
####`,
    solution: 'ruuRdrruulDldldlUrrR',
  },
  {
    id: 'medium-11',
    name: 'Slingerpad',
    map: `
#########
#@  #   #
#   # $ #
## ## # #
#     # #
#   .   #
#########`,
    solution: 'drdddrrrrruuuLulDDDuurrdddlL',
  },
  {
    id: 'medium-31',
    name: 'Werkplaats',
    map: `
######
# #  #
#.#  #
#.$$@#
#    #
######`,
    solution: 'dlULrruulDrddlllUdrrruLL',
  },
  {
    id: 'medium-12',
    name: 'Hoefijzer',
    map: `
#########
#       #
# ##### #
# #. .# #
# # $ $ #
#@      #
#########`,
    solution: 'rrrUruLddrrruLdlU',
  },
  {
    id: 'medium-32',
    name: 'Garage',
    map: `
######
#  . #
# $  #
# #* #
#  @##
#####`,
    solution: 'UUruLdddlluuRlddrruruulDlluR',
  },
  {
    id: 'medium-13',
    name: 'Doorgang',
    map: `
##########
#@   #   #
#    #   #
##$    . #
 #   #   #
 #########`,
    solution: 'drrddlUruulldRurDldRRRR',
  },
  {
    id: 'medium-33',
    name: 'Laadperron',
    map: `
#######
#  .  ##
# $# $@#
#  . ###
######`,
    solution: 'LullllddrrrUruLddllluurDldR',
  },
  {
    id: 'medium-14',
    name: 'Hoekje om',
    map: `
########
#@ #   #
#      #
#  # . #
## # $ #
#    ###
#    #
######`,
    solution: 'drrrdrrdLuullldddrrUUddlluuurRurD',
  },
  {
    id: 'medium-34',
    name: 'Pakketdienst',
    map: `
  #####
###  @#
#  $  #
# # #.#
#  *  #
#######`,
    solution: 'llDllddrRUdlluurRurrdddLruuulldRurD',
  },
  {
    id: 'medium-15',
    name: 'De sluis',
    map: `
##########
#@   #   #
# $ $  . #
#    # . #
##########`,
    solution: 'rrdRullldRurrdRRurDlllulldRRRR',
  },
  {
    id: 'medium-35',
    name: 'Postkamer',
    map: `
#####
#  @##
#.  .#
# $  #
###$ #
  #  #
  ####`,
    solution: 'ddrddlUUruLullddRluurrdLrrddlUluR',
  },
  {
    id: 'medium-16',
    name: 'Twee kamers',
    map: `
##########
#   #    #
# $ # $  #
#@     ..#
##########`,
    solution: 'uurDrdrruurDldRRllllulldRRRRR',
  },
  {
    id: 'medium-36',
    name: 'Zolder',
    map: `
 #####
##  .##
#@$   ###
#### $  #
   # .  #
   ######`,
    solution: 'RurrdrDldRuululldRurDrddlUUdrrrdL',
  },
  {
    id: 'medium-17',
    name: 'Dubbel',
    map: `
#######
#.   .#
#  #  #
# $ $ #
#  @  #
#######`,
    solution: 'lUUddrrruuullLdddrrUUdlluurR',
  },
  {
    id: 'medium-37',
    name: 'Bovenverdieping',
    map: `
  ####
###  #
#    ###
#  $ $ #
###  .+#
  ######`,
    solution: 'lluLdrrruLdlluulldRurrDulldRdRRlluurDldR',
  },
  {
    id: 'medium-18',
    name: 'Achter elkaar',
    map: `
##########
#        #
#@$  $  .#
######  .#
     #####`,
    solution: 'RurrdRullldRurrdRullldRRurrDulldRRldR',
  },
  {
    id: 'medium-38',
    name: 'Overloop',
    map: `
####
#  #
#  ####
# $## #
#   $ #
#@  ..#
#######`,
    solution: 'uuurDlddrrrruLdllluurDldRRRuLdlluurDldRR',
  },
  {
    id: 'medium-19',
    name: 'Eerst de voorste',
    map: `
#########
#       #
#       #
#@ $$ ..#
#       #
#       #
#########`,
    solution: 'drrUluRRRurDldRullldRR',
  },
  {
    id: 'medium-39',
    name: 'Kelderluik',
    map: `
####
#  ####
#.  #.#
#    @#
# $ $ #
###   #
  #####`,
    solution: 'lllldRurrrddllUdrruulLdlUruLddrdrUluRdrU',
  },
  {
    id: 'medium-20',
    name: 'Hoekjes',
    map: `
########
#  #   #
#  $ $ #
#@  #  #
###   ##
  #. .#
  #####`,
    solution: 'rrdrruruulldLdlluurDrrurDlllldRurDurrDulldDuurrdD',
  },
  {
    id: 'medium-40',
    name: 'Voordeur',
    map: `
########
#  .   #
# $  $@##
### #  .#
  # #####
  ###`,
    solution: 'ullllldRurrdRullldRurrrDldRuullldRurrddlUruLL',
  },
];
