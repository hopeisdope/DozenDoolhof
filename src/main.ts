import './styles/main.css';
import { AudioFeedback } from './audio/feedback';
import { SoundPlayer } from './audio/sounds';
import { Speaker } from './audio/speech';
import { TIERS, type Tier } from './levels/definitions';
import { registerServiceWorker } from './pwa';
import { Rewards } from './rewards/rewards';
import { Wardrobe } from './rewards/wardrobe';
import { GameScreen } from './ui/game-screen';
import { LevelSelect } from './ui/level-select';
import { browserStorage, Progress } from './ui/progress';
import { Settings } from './ui/settings';
import { SettingsPanel } from './ui/settings-panel';
import { WardrobeScreen } from './ui/wardrobe';

const root = document.querySelector<HTMLElement>('#app');
if (!root) throw new Error('Missing #app element');

const storage = browserStorage();
const progress = new Progress(storage);
if (!progress.persistent) {
  console.warn('Dozendoolhof: localStorage is unavailable; progress is kept in memory only.');
}
const rewards = new Rewards(progress, new Wardrobe(storage), TIERS);

// Sound and voice. Nothing plays before the first tap or key press, as browsers require;
// every sound is a reaction to the player. `dozendoolhof:sound` events let tests listen in.
const settings = new Settings(storage);
const sounds = new SoundPlayer(() => settings.get('sound'), {
  onPlay: (cue) => window.dispatchEvent(new CustomEvent('dozendoolhof:sound', { detail: cue })),
});
const speaker = new Speaker(() => settings.get('speech'));
const feedback = new AudioFeedback(sounds, speaker);
const unlockAudio = (): void => {
  sounds.unlock();
  speaker.unlock();
};
for (const type of ['pointerdown', 'pointerup', 'touchend', 'keydown']) {
  window.addEventListener(type, unlockAudio, { capture: true, passive: true });
}
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) return;
  speaker.stop();
  sounds.suspend();
});
// iOS: follow the ring/silent switch and let other audio (music) keep playing.
try {
  const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession;
  if (session) session.type = 'ambient';
} catch {
  // Older browsers: the default session is fine.
}
settings.onChange((name, on) => {
  if (name === 'sound' && on) {
    sounds.unlock();
    sounds.play('goal');
  }
  if (name === 'speech') {
    if (on) {
      speaker.unlock();
      speaker.say('Hallo!');
    } else {
      speaker.stop();
    }
  }
});
const settingsPanel = new SettingsPanel(settings, () => speaker.available);

function showSelect(tier: Tier): void {
  select.selectTier(Math.max(TIERS.indexOf(tier), 0));
  select.element.hidden = false;
}

const game = new GameScreen(rewards, showSelect, feedback);
const wardrobe = new WardrobeScreen(rewards, () => {
  select.render();
  select.element.hidden = false;
  select.focusWardrobe();
});
const select = new LevelSelect(
  TIERS,
  progress,
  rewards,
  (tierIndex, levelIndex) => {
    const tier = TIERS[tierIndex];
    if (!tier) return;
    select.element.hidden = true;
    game.open(tier, levelIndex);
  },
  () => {
    select.element.hidden = true;
    wardrobe.open();
  },
  settingsPanel,
);
root.replaceChildren(select.element, game.element, wardrobe.element);

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

// Offline play: a new version is offered on the start screen, never forced mid-level.
registerServiceWorker((apply) => select.offerUpdate(apply));
