import './styles/main.css';
import { LEVELS } from './levels/definitions';
import { GameScreen } from './ui/game-screen';

/** `?level=3` opens level 3 directly (1-based); handy for testing on a device. */
function startLevelIndex(): number {
  const requested = Number(new URLSearchParams(window.location.search).get('level'));
  return Number.isInteger(requested) && requested >= 1 && requested <= LEVELS.length
    ? requested - 1
    : 0;
}

const root = document.querySelector<HTMLElement>('#app');
if (!root) throw new Error('Missing #app element');
new GameScreen(root, LEVELS, startLevelIndex());
