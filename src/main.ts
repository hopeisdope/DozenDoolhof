import './styles/main.css';
import { TIERS, type Tier } from './levels/definitions';
import { GameScreen } from './ui/game-screen';
import { LevelSelect } from './ui/level-select';
import { Progress } from './ui/progress';

const root = document.querySelector<HTMLElement>('#app');
if (!root) throw new Error('Missing #app element');

const progress = new Progress();

function showSelect(tier: Tier): void {
  select.selectTier(Math.max(TIERS.indexOf(tier), 0));
  select.element.hidden = false;
}

const game = new GameScreen(progress, showSelect);
const select = new LevelSelect(TIERS, progress, (tierIndex, levelIndex) => {
  const tier = TIERS[tierIndex];
  if (!tier) return;
  select.element.hidden = true;
  game.open(tier, levelIndex);
});
root.replaceChildren(select.element, game.element);

/**
 * `?tier=medium&level=3` opens that level directly (level is 1-based); handy for
 * testing on a device. Without it the game starts at the level selection.
 */
const params = new URLSearchParams(window.location.search);
const tierIndex = TIERS.findIndex((tier) => tier.id === params.get('tier'));
const tier = TIERS[tierIndex];
const level = Number(params.get('level'));
if (tier && Number.isInteger(level) && level >= 1 && level <= tier.levels.length) {
  select.selectTier(tierIndex);
  select.element.hidden = true;
  game.open(tier, level - 1);
}
