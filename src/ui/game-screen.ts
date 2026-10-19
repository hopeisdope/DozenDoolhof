import starUrl from '../assets/ui/star.svg';
import {
  canUndo,
  createGame,
  isGameSolved,
  move,
  restart,
  undo,
  type Game,
} from '../engine/history';
import type { Direction, Level } from '../engine/state';
import type { Tier } from '../levels/definitions';
import { BoardView } from '../render/board';
import { ICONS, icon, iconButton, starRow } from './icons';
import { bindKeyboard, bindSwipe } from './input';
import { starsFor, type Progress, type Stars } from './progress';

/**
 * The play screen: HUD, board, level/undo/restart controls and the "level complete"
 * overlay. Owns the current `Game` and re-renders after every change. One instance
 * is reused for every level; `open()` switches levels.
 */
export class GameScreen {
  readonly element = document.createElement('section');
  private game!: Game;
  private board!: BoardView;
  private tier!: Tier;
  private levelIndex = 0;

  private readonly title = document.createElement('h1');
  private readonly tierBadge = document.createElement('p');
  private readonly moves = document.createElement('p');
  private readonly stage = document.createElement('main');
  private readonly levelsButton = iconButton('button--levels', 'Naar de levels', ICONS.levels);
  private readonly undoButton = iconButton('button--undo', 'Ongedaan maken', ICONS.undo);
  private readonly restartButton = iconButton('button--restart', 'Opnieuw beginnen', ICONS.restart);
  private readonly overlay = document.createElement('div');
  private readonly nextButton = iconButton('button--next', 'Volgende level', ICONS.next);

  constructor(
    private readonly progress: Progress,
    private readonly onExit: (tier: Tier) => void,
  ) {
    this.element.className = 'screen game';
    this.element.hidden = true;
    this.build();

    bindSwipe(this.stage, (direction) => this.move(direction));
    bindKeyboard(window, {
      onDirection: (direction) => this.active && this.move(direction),
      onUndo: () => this.active && this.undo(),
      onRestart: () => this.active && this.restart(),
      onConfirm: () => {
        if (this.active && isGameSolved(this.game)) this.next();
      },
      onBack: () => this.active && this.exit(),
    });
  }

  /** Starts level `levelIndex` (0-based) of `tier`. */
  open(tier: Tier, levelIndex: number): void {
    this.tier = tier;
    this.levelIndex = levelIndex;
    this.game = createGame(this.currentLevel);
    this.board = new BoardView(this.currentLevel);
    this.stage.replaceChildren(this.board.element);
    this.title.textContent = `Level ${levelIndex + 1}`;
    this.title.title = this.currentLevel.name;
    this.tierBadge.className = `hud__tier hud__tier--${tier.id}`;
    this.tierBadge.setAttribute('aria-label', tier.name);
    this.tierBadge.innerHTML = starRow(tier.stars, starUrl);
    this.overlay.hidden = true;
    this.element.hidden = false;
    this.render();
  }

  private get active(): boolean {
    return !this.element.hidden;
  }

  private get currentLevel(): Level {
    const level = this.tier.levels[this.levelIndex];
    if (!level) throw new Error(`No level at index ${this.levelIndex}`);
    return level;
  }

  private get isLastInTier(): boolean {
    return this.levelIndex === this.tier.levels.length - 1;
  }

  private build(): void {
    const hud = document.createElement('header');
    hud.className = 'hud';
    this.title.className = 'hud__title';
    this.moves.className = 'hud__moves';
    this.moves.dataset.testid = 'moves';
    hud.append(this.title, this.tierBadge, this.moves);

    this.stage.className = 'stage';

    const controls = document.createElement('nav');
    controls.className = 'controls';
    controls.setAttribute('aria-label', 'Bediening');
    controls.append(this.levelsButton, this.undoButton, this.restartButton);
    this.levelsButton.addEventListener('click', () => this.exit());
    this.undoButton.addEventListener('click', () => this.undo());
    this.restartButton.addEventListener('click', () => this.restart());

    this.overlay.className = 'overlay';
    this.overlay.dataset.testid = 'win-overlay';
    this.overlay.hidden = true;
    this.overlay.setAttribute('role', 'dialog');
    this.overlay.setAttribute('aria-modal', 'true');
    this.overlay.setAttribute('aria-labelledby', 'win-title');
    this.overlay.innerHTML = `
      <div class="overlay__card">
        <div class="overlay__stars" data-testid="win-stars"></div>
        <h2 class="overlay__title" id="win-title">Gelukt!</h2>
        <p class="overlay__moves"></p>
      </div>`;
    this.overlay.querySelector('.overlay__card')?.append(this.nextButton);
    this.nextButton.addEventListener('click', () => this.next());

    this.element.append(hud, this.stage, controls, this.overlay);
  }

  private move(direction: Direction): void {
    if (isGameSolved(this.game)) return;
    const next = move(this.game, direction);
    if (next === this.game) {
      this.board.bump();
      return;
    }
    this.setGame(next, true);
  }

  private undo(): void {
    if (isGameSolved(this.game)) return;
    this.setGame(undo(this.game), true);
  }

  private restart(): void {
    if (isGameSolved(this.game)) return;
    this.setGame(restart(this.game), false);
  }

  /** After a win: the next level of the tier, or back to the level overview. */
  private next(): void {
    if (!this.active || !isGameSolved(this.game)) return;
    if (this.isLastInTier) this.exit();
    else this.open(this.tier, this.levelIndex + 1);
  }

  private exit(): void {
    this.element.hidden = true;
    this.overlay.hidden = true;
    this.onExit(this.tier);
  }

  private setGame(game: Game, animate: boolean): void {
    if (game === this.game) return;
    this.game = game;
    this.board.update(game.state, animate);
    this.render();
  }

  /** Stars for the current win, measured against the level's known solution. */
  private get earnedStars(): Stars {
    const definition = this.tier.definitions[this.levelIndex];
    const par = definition ? definition.solution.length : this.game.state.moves;
    return starsFor(this.game.state.moves, par);
  }

  private render(): void {
    const solved = isGameSolved(this.game);
    if (solved) this.progress.complete(this.currentLevel.id, this.earnedStars);

    this.moves.textContent = `Zetten: ${this.game.state.moves}`;
    this.undoButton.disabled = !canUndo(this.game) || solved;
    this.restartButton.disabled = this.game.state === this.currentLevel.start || solved;
    this.board.element.dataset.solved = String(solved);

    const label = this.isLastInTier ? 'Terug naar de levels' : 'Volgende level';
    this.nextButton.setAttribute('aria-label', label);
    this.nextButton.title = label;
    this.nextButton.innerHTML = icon(this.isLastInTier ? ICONS.levels : ICONS.next);
    const movesText = this.overlay.querySelector('.overlay__moves');
    if (movesText) movesText.textContent = `${this.game.state.moves} zetten`;
    const stars = this.overlay.querySelector<HTMLElement>('.overlay__stars');
    if (stars && solved) {
      const earned = this.earnedStars;
      stars.dataset.stars = String(earned);
      stars.setAttribute('aria-label', `${earned} van de 3 sterren`);
      stars.setAttribute('role', 'img');
      stars.innerHTML = starRow(earned, starUrl, 3);
    }

    if (solved && this.overlay.hidden) {
      const level = this.currentLevel;
      // Let the final push animation finish before celebrating.
      window.setTimeout(() => {
        if (!isGameSolved(this.game) || this.currentLevel !== level || !this.active) return;
        this.overlay.hidden = false;
        this.nextButton.focus();
      }, 250);
    }
  }
}
