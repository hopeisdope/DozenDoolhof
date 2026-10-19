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
import starUrl from '../assets/ui/star.svg';
import { BoardView } from '../render/board';
import { bindKeyboard, bindSwipe } from './input';

const ICONS = {
  undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  restart: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
  next: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
};

/** White icon with a thick dark outline, drawn as two stacked strokes. */
function icon(paths: string): string {
  return `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke-linecap="round"
    stroke-linejoin="round"><g stroke="#3b1d0e" stroke-width="6.5">${paths}</g>
    <g stroke="currentColor" stroke-width="3">${paths}</g></svg>`;
}

function button(className: string, label: string, iconPaths: string): HTMLButtonElement {
  const element = document.createElement('button');
  element.type = 'button';
  element.className = `button ${className}`;
  element.setAttribute('aria-label', label);
  element.title = label;
  element.innerHTML = icon(iconPaths);
  return element;
}

/**
 * The play screen: HUD, board, undo/restart controls and the "level complete"
 * overlay. Owns the current `Game` and re-renders after every change.
 */
export class GameScreen {
  private game!: Game;
  private board!: BoardView;
  private readonly completed = new Set<string>();

  private readonly title = document.createElement('h1');
  private readonly moves = document.createElement('p');
  private readonly progress = document.createElement('ol');
  private readonly stage = document.createElement('main');
  private readonly undoButton = button('button--undo', 'Ongedaan maken', ICONS.undo);
  private readonly restartButton = button('button--restart', 'Opnieuw beginnen', ICONS.restart);
  private readonly overlay = document.createElement('div');
  private readonly nextButton = button('button--next', 'Volgende level', ICONS.next);

  constructor(
    private readonly root: HTMLElement,
    private readonly levels: readonly Level[],
    private levelIndex = 0,
  ) {
    this.build();
    this.showLevel(levelIndex);

    bindSwipe(this.stage, (direction) => this.move(direction));
    bindKeyboard(window, {
      onDirection: (direction) => this.move(direction),
      onUndo: () => this.undo(),
      onRestart: () => this.restart(),
      onConfirm: () => {
        if (isGameSolved(this.game)) this.next();
      },
    });
  }

  private get currentLevel(): Level {
    const level = this.levels[this.levelIndex];
    if (!level) throw new Error(`No level at index ${this.levelIndex}`);
    return level;
  }

  private build(): void {
    const hud = document.createElement('header');
    hud.className = 'hud';
    this.title.className = 'hud__title';
    this.moves.className = 'hud__moves';
    this.moves.dataset.testid = 'moves';
    this.progress.className = 'hud__progress';
    this.progress.setAttribute('aria-label', 'Voortgang');
    hud.append(this.title, this.progress, this.moves);

    this.stage.className = 'stage';

    const controls = document.createElement('nav');
    controls.className = 'controls';
    controls.setAttribute('aria-label', 'Bediening');
    controls.append(this.undoButton, this.restartButton);
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
        <img class="overlay__star" src="${starUrl}" alt="" />
        <h2 class="overlay__title" id="win-title">Gelukt!</h2>
        <p class="overlay__moves"></p>
      </div>`;
    this.overlay.querySelector('.overlay__card')?.append(this.nextButton);
    this.nextButton.addEventListener('click', () => this.next());

    this.root.replaceChildren(hud, this.stage, controls, this.overlay);
  }

  private showLevel(index: number): void {
    this.levelIndex = index;
    this.game = createGame(this.currentLevel);
    this.board = new BoardView(this.currentLevel);
    this.stage.replaceChildren(this.board.element);
    this.title.textContent = `Level ${index + 1}`;
    this.title.title = this.currentLevel.name;
    this.overlay.hidden = true;
    this.render();
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

  private next(): void {
    if (!isGameSolved(this.game)) return;
    this.showLevel((this.levelIndex + 1) % this.levels.length);
  }

  private setGame(game: Game, animate: boolean): void {
    if (game === this.game) return;
    this.game = game;
    this.board.update(game.state, animate);
    this.render();
  }

  private render(): void {
    const solved = isGameSolved(this.game);
    if (solved) this.completed.add(this.currentLevel.id);

    this.moves.textContent = `Zetten: ${this.game.state.moves}`;
    this.undoButton.disabled = !canUndo(this.game) || solved;
    this.restartButton.disabled = this.game.state === this.currentLevel.start || solved;
    this.board.element.dataset.solved = String(solved);

    this.progress.replaceChildren(
      ...this.levels.map((level, index) => {
        const dot = document.createElement('li');
        dot.className = 'hud__dot';
        dot.classList.toggle('is-current', index === this.levelIndex);
        dot.classList.toggle('is-done', this.completed.has(level.id));
        return dot;
      }),
    );

    const isLast = this.levelIndex === this.levels.length - 1;
    this.nextButton.setAttribute('aria-label', isLast ? 'Opnieuw vanaf level 1' : 'Volgende level');
    this.nextButton.title = this.nextButton.getAttribute('aria-label') ?? '';
    const movesText = this.overlay.querySelector('.overlay__moves');
    if (movesText) movesText.textContent = `${this.game.state.moves} zetten`;

    if (solved && this.overlay.hidden) {
      // Let the final push animation finish before celebrating.
      window.setTimeout(() => {
        if (!isGameSolved(this.game)) return;
        this.overlay.hidden = false;
        this.nextButton.focus();
      }, 250);
    }
  }
}
