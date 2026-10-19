import type { LevelDefinition } from '../definitions';

/** medium tier, in increasing difficulty. Solutions found by `src/solver`. */
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
];
