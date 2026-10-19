import type { Level } from '../engine/state';
import { parseLevel } from './parser';
import { EASY_LEVELS } from './tiers/easy';
import { HARD_LEVELS } from './tiers/hard';
import { MEDIUM_LEVELS } from './tiers/medium';

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

export type TierId = 'easy' | 'medium' | 'hard';

export interface TierDefinition {
  readonly id: TierId;
  /** Dutch name shown in the level selection. */
  readonly name: string;
  /** 1–3, shown as stars so the tier can be recognised without reading. */
  readonly stars: number;
  readonly levels: readonly LevelDefinition[];
}

export interface Tier extends Omit<TierDefinition, 'levels'> {
  readonly definitions: readonly LevelDefinition[];
  readonly levels: readonly Level[];
}

/** Three difficulty tiers of twenty levels each, all available from the start. */
export const TIER_DEFINITIONS: readonly TierDefinition[] = [
  { id: 'easy', name: 'Makkelijk', stars: 1, levels: EASY_LEVELS },
  { id: 'medium', name: 'Gemiddeld', stars: 2, levels: MEDIUM_LEVELS },
  { id: 'hard', name: 'Moeilijk', stars: 3, levels: HARD_LEVELS },
];

export const TIERS: readonly Tier[] = TIER_DEFINITIONS.map(({ levels, ...tier }) => ({
  ...tier,
  definitions: levels,
  levels: levels.map((definition) => parseLevel(definition.map, definition)),
}));

/** All level definitions in play order: easy, then medium, then hard. */
export const LEVEL_DEFINITIONS: readonly LevelDefinition[] = TIERS.flatMap(
  (tier) => tier.definitions,
);

export const LEVELS: readonly Level[] = TIERS.flatMap((tier) => tier.levels);
