import starUrl from '../assets/ui/star.svg';
import { SILENT, type GameFeedback } from '../audio/feedback';
import { moveCue } from '../audio/sounds';
import {
  canUndo,
  createGame,
  isGameSolved,
  move,
  restart,
  undo,
  type Game,
} from '../engine/history';
import { directionTo, walkPath } from '../engine/path';
import type { Direction, Level } from '../engine/state';
import { HintController, type HintView } from '../hints/controller';
import { createWorkerSolver } from '../hints/worker-solver';
import type { Tier } from '../levels/definitions';
import { BoardView } from '../render/board';
import { findStuckBoxes } from '../solver/deadlock';
import { heroMarkup, itemIcon } from '../render/hero';
import { HintLayer } from '../render/hint-layer';
import { SwipeDemo } from '../render/swipe-demo';
import type { RewardItem } from '../rewards/catalog';
import type { Rewards } from '../rewards/rewards';
import { ICONS, icon, iconButton, starRow } from './icons';
import { bindKeyboard, bindSwipe } from './input';
import { starsFor, type Stars } from './progress';

/** Milliseconds per step when a tap walks the worker to a cell further away. */
const WALK_STEP_MS = 130;
/** How long a new player may look before the hand shows how to move. */
const DEMO_DELAY_MS = 1800;

const SOLUTION_DIRECTIONS: Record<string, Direction> = {
  u: 'up',
  d: 'down',
  l: 'left',
  r: 'right',
};

/**
 * The play screen: HUD, board, level/undo/restart/hint controls, the "stuck box" notice
 * and the "level complete" overlay (with any reward the win unlocked). Owns the current
 * `Game` and re-renders after every change. One instance is reused for every level;
 * `open()` switches levels. Moves come from swipes, keys and taps: a tap next to the
 * worker is one step (or push), a tap on a free cell further away walks there.
 */
export class GameScreen {
  readonly element = document.createElement('section');
  private game!: Game;
  private board!: BoardView;
  private hintLayer!: HintLayer;
  private demo!: SwipeDemo;
  private demoTimer: number | null = null;
  /** The pending step of a walk started by a tap, if any. */
  private walkTimer: number | null = null;
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
  private readonly reward = document.createElement('div');
  private readonly nextButton = iconButton('button--next', 'Volgende level', ICONS.next);
  private readonly hintButton = iconButton('button--hint', 'Hint', ICONS.hint);
  private readonly hintClose = iconButton('button--hint-close', 'Hint sluiten', ICONS.close);
  private readonly hintNotice = document.createElement('div');
  private readonly noticeUndo = iconButton('button--small', 'Eén zet terug', ICONS.undo);
  private readonly noticeRestart = iconButton('button--small', 'Helemaal opnieuw', ICONS.restart);
  private readonly stuckNotice = document.createElement('div');
  private readonly stuckUndo = iconButton('button--small', 'Eén zet terug', ICONS.undo);
  private readonly stuckRestart = iconButton('button--small', 'Opnieuw proberen', ICONS.restart);
  /** Boxes that can provably never reach a goal in the current state. */
  private stuckCells: readonly number[] = [];
  /** The box array the stuck check last ran on; walking keeps the same array. */
  private checkedBoxes: readonly number[] | null = null;
  /** Rewards unlocked by winning the current level, shown on the win card. */
  private newRewards: readonly RewardItem[] = [];
  /** The hint view shown last, to notice when "no way out" first appears. */
  private hintKind: HintView['kind'] = 'none';
  private readonly hints = new HintController(createWorkerSolver(), (view) =>
    this.renderHint(view),
  );

  constructor(
    private readonly rewards: Rewards,
    private readonly onExit: (tier: Tier) => void,
    private readonly feedback: GameFeedback = SILENT,
  ) {
    this.element.className = 'screen game';
    this.element.hidden = true;
    this.build();

    bindSwipe(
      this.stage,
      (direction) => this.move(direction),
      (x, y) => this.tap(x, y),
    );
    bindKeyboard(window, {
      onDirection: (direction) => this.active && this.move(direction),
      onUndo: () => this.active && this.undo(),
      onRestart: () => this.active && this.restart(),
      onConfirm: () => {
        if (this.active && isGameSolved(this.game)) this.next();
      },
      onBack: () => {
        if (!this.active) return;
        // Escape first closes a hint, then leaves the level.
        if (this.hints.view.kind !== 'none') this.hints.clear();
        else this.exit();
      },
      onHint: () => this.active && this.hint(),
    });
  }

  /** Starts level `levelIndex` (0-based) of `tier`. */
  open(tier: Tier, levelIndex: number): void {
    this.feedback.stop();
    this.stopWalk();
    this.stopDemo();
    this.tier = tier;
    this.levelIndex = levelIndex;
    this.game = createGame(this.currentLevel);
    const outfit = this.rewards.outfit();
    this.board = new BoardView(this.currentLevel, outfit);
    this.hintLayer = new HintLayer(this.currentLevel, outfit);
    this.newRewards = [];
    this.demo = new SwipeDemo(this.currentLevel);
    this.board.element.append(this.hintLayer.element, this.demo.element);
    this.stage.replaceChildren(this.board.element);
    this.hints.setLevel(this.currentLevel, this.tier.definitions[levelIndex]?.solution ?? '');
    this.renderHint(this.hints.view);
    this.checkedBoxes = null;
    this.updateStuck(false);
    this.title.textContent = `Level ${levelIndex + 1}`;
    this.title.title = this.currentLevel.name;
    this.tierBadge.className = `hud__tier hud__tier--${tier.id}`;
    this.tierBadge.setAttribute('aria-label', tier.name);
    this.tierBadge.innerHTML = starRow(tier.stars, starUrl);
    this.overlay.hidden = true;
    this.element.hidden = false;
    this.render();
    this.scheduleDemo();
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
    controls.append(this.levelsButton, this.undoButton, this.restartButton, this.hintButton);
    this.levelsButton.addEventListener('click', () => this.exit());
    this.undoButton.addEventListener('click', () => this.undo());
    this.restartButton.addEventListener('click', () => this.restart());
    this.hintButton.addEventListener('click', () => this.hint());
    this.hintButton.dataset.testid = 'hint-button';

    // Outside the stage, which captures pointers for swiping, so taps always land.
    this.hintClose.hidden = true;
    this.hintClose.dataset.testid = 'hint-close';
    this.hintClose.addEventListener('click', () => this.hints.clear());
    this.hintNotice.className = 'hint-notice';
    this.hintNotice.dataset.testid = 'hint-notice';
    this.hintNotice.hidden = true;
    this.hintNotice.setAttribute('role', 'status');
    this.hintNotice.innerHTML = `<span class="hint-notice__icon">${icon(ICONS.hint)}</span>
      <p class="hint-notice__text"></p><div class="hint-notice__buttons"></div>`;
    this.hintNotice
      .querySelector('.hint-notice__buttons')
      ?.append(this.noticeUndo, this.noticeRestart);
    this.noticeUndo.addEventListener('click', () => this.undo());
    this.noticeRestart.addEventListener('click', () => this.restart());

    // Shares the notice layout with the hint notice, but warm-coloured with a padlock, so
    // a stuck box never looks like a hint. It sits beside the board, never on top of it.
    this.stuckNotice.className = 'hint-notice stuck-notice';
    this.stuckNotice.dataset.testid = 'stuck-notice';
    this.stuckNotice.hidden = true;
    this.stuckNotice.setAttribute('role', 'status');
    this.stuckNotice.innerHTML = `<span class="hint-notice__icon">${icon(ICONS.lock)}</span>
      <p class="hint-notice__text"></p><div class="hint-notice__buttons"></div>`;
    this.stuckNotice
      .querySelector('.hint-notice__buttons')
      ?.append(this.stuckUndo, this.stuckRestart);
    this.stuckUndo.dataset.testid = 'stuck-undo';
    this.stuckRestart.dataset.testid = 'stuck-restart';
    this.stuckUndo.addEventListener('click', () => this.undo());
    this.stuckRestart.addEventListener('click', () => this.restart());

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
    this.reward.className = 'overlay__reward';
    this.reward.dataset.testid = 'win-reward';
    this.reward.setAttribute('role', 'group');
    this.reward.hidden = true;
    this.overlay.querySelector('.overlay__card')?.append(this.reward, this.nextButton);
    this.nextButton.addEventListener('click', () => this.next());

    this.element.append(
      hud,
      this.stage,
      this.hintClose,
      this.hintNotice,
      this.stuckNotice,
      controls,
      this.overlay,
    );
  }

  /** A swipe or key: one step, and the end of any walk that was still going. */
  private move(direction: Direction): void {
    this.stopWalk();
    this.step(direction);
  }

  private step(direction: Direction): void {
    if (isGameSolved(this.game)) return;
    const next = move(this.game, direction);
    if (next === this.game) {
      this.stopDemo();
      this.board.bump();
      this.feedback.blocked();
      return;
    }
    // The move's own sound first; a stuck box found by setGame() is announced after it.
    const solved = isGameSolved(next);
    if (!solved) this.feedback.moved(moveCue(this.currentLevel, this.game.state, next.state));
    this.setGame(next, true, direction);
    if (solved) this.feedback.won(this.newRewards.length);
  }

  /**
   * A tap on the board: next to the worker it is a step (or a push), on a free cell
   * further away the worker walks there step by step without pushing anything. A tap
   * on a wall, or on a box that is not next to the worker, only bumps.
   */
  private tap(clientX: number, clientY: number): void {
    if (isGameSolved(this.game)) return;
    this.stopWalk();
    const cell = this.board.cellAt(clientX, clientY);
    if (cell === null) return;
    const direction = directionTo(this.currentLevel, this.game.state.player, cell);
    if (direction) {
      this.step(direction);
      return;
    }
    const path = walkPath(this.currentLevel, this.game.state, cell);
    if (path === null) {
      this.stopDemo();
      this.board.bump();
      this.feedback.blocked();
    } else {
      this.walk(path);
    }
  }

  private walk(path: readonly Direction[]): void {
    const [first, ...rest] = path;
    if (!first) return;
    this.step(first);
    if (rest.length > 0) {
      this.walkTimer = window.setTimeout(() => {
        this.walkTimer = null;
        if (this.active) this.walk(rest);
      }, WALK_STEP_MS);
    }
  }

  private stopWalk(): void {
    if (this.walkTimer !== null) window.clearTimeout(this.walkTimer);
    this.walkTimer = null;
  }

  /**
   * Until the first level is won, a hand shows the first move of the level if nothing
   * happens for a moment. Any move, tap, hint or leaving the level puts it away.
   */
  private scheduleDemo(): void {
    if (this.rewards.stats().levels > 0) return;
    const solution = this.tier.definitions[this.levelIndex]?.solution ?? '';
    const direction = SOLUTION_DIRECTIONS[solution.charAt(0).toLowerCase()];
    if (!direction) return;
    const level = this.currentLevel;
    this.demoTimer = window.setTimeout(() => {
      this.demoTimer = null;
      if (!this.active || this.currentLevel !== level || this.game.state !== level.start) return;
      this.demo.show(level.start.player, direction);
    }, DEMO_DELAY_MS);
  }

  private stopDemo(): void {
    if (this.demoTimer !== null) window.clearTimeout(this.demoTimer);
    this.demoTimer = null;
    this.demo?.hide();
  }

  private undo(): void {
    this.stopWalk();
    if (isGameSolved(this.game)) return;
    const next = undo(this.game);
    if (next === this.game) return;
    this.feedback.undone();
    this.setGame(next, true, null);
  }

  private restart(): void {
    this.stopWalk();
    if (isGameSolved(this.game)) return;
    const next = restart(this.game);
    if (next === this.game) return;
    this.feedback.undone();
    this.setGame(next, false, null);
  }

  /**
   * The hint button: each tap shows a more explicit hint; it never moves anything. With a
   * stuck box on the board, the stuck notice is the help that matters, so it is pointed
   * out again instead of showing a second "this no longer works" message.
   */
  private hint(): void {
    this.stopWalk();
    this.stopDemo();
    if (isGameSolved(this.game)) return;
    if (this.stuckCells.length > 0) {
      this.board.wobbleStuck();
      this.stuckNotice.classList.remove('is-nudged');
      void this.stuckNotice.offsetWidth;
      this.stuckNotice.classList.add('is-nudged');
      return;
    }
    this.hints.request(this.game.state);
  }

  /** After a win: the next level of the tier, or back to the level overview. */
  private next(): void {
    if (!this.active || !isGameSolved(this.game)) return;
    if (this.isLastInTier) this.exit();
    else this.open(this.tier, this.levelIndex + 1);
  }

  private exit(): void {
    this.feedback.stop();
    this.stopWalk();
    this.stopDemo();
    this.hints.clear();
    this.element.hidden = true;
    this.overlay.hidden = true;
    this.onExit(this.tier);
  }

  private setGame(game: Game, animate: boolean, direction: Direction | null): void {
    if (game === this.game) return;
    this.stopDemo();
    this.game = game;
    this.board.update(game.state, animate);
    this.hints.update(game.state, direction);
    this.updateStuck();
    this.render();
  }

  /**
   * Looks for stuck boxes when the boxes changed (a push, an undo or restart of one).
   * Only reads the state; moves, history, stars and progress are untouched. With
   * `announce`, more stuck boxes than before are also said out loud.
   */
  private updateStuck(announce = true): void {
    const boxes = this.game.state.boxes;
    if (boxes === this.checkedBoxes) return;
    this.checkedBoxes = boxes;
    const before = this.stuckCells.length;
    this.stuckCells = findStuckBoxes(this.currentLevel, this.game.state).map((box) => box.cell);
    this.board.setStuck(this.stuckCells);

    const count = this.stuckCells.length;
    if (announce && count > before) this.feedback.stuck(count);
    this.stuckNotice.hidden = count === 0;
    this.stuckNotice.classList.remove('is-nudged');
    const text = this.stuckNotice.querySelector('.hint-notice__text');
    if (text) text.textContent = count > 1 ? 'Deze dozen zitten vast' : 'Deze doos zit vast';
  }

  /** Stars for the current win, measured against the level's known solution. */
  private get earnedStars(): Stars {
    const definition = this.tier.definitions[this.levelIndex];
    const par = definition ? definition.solution.length : this.game.state.moves;
    return starsFor(this.game.state.moves, par);
  }

  private render(): void {
    const solved = isGameSolved(this.game);
    if (solved) {
      const unlocked = this.rewards.recordWin(this.currentLevel.id, this.earnedStars);
      if (unlocked.length > 0) {
        this.newRewards = [...this.newRewards, ...unlocked];
        // New rewards are put on at once, so the cheering worker already wears them.
        this.board.setOutfit(this.rewards.outfit());
        this.renderReward();
      }
      this.hints.clear();
    }
    this.hintButton.disabled = solved;

    this.moves.textContent = `Zetten: ${this.game.state.moves}`;
    this.undoButton.disabled = !canUndo(this.game) || solved;
    this.stuckUndo.disabled = !canUndo(this.game);
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

    this.reward.hidden = !solved || this.newRewards.length === 0;

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

  /** The worker in the new outfit, next to a picture of each new item. */
  private renderReward(): void {
    const names = this.newRewards.map((item) => item.name).join(', ');
    this.reward.setAttribute('aria-label', `Nieuw: ${names}`);
    this.reward.innerHTML = `
      <div class="hero-preview overlay__hero" aria-hidden="true">${heroMarkup(this.rewards.outfit())}</div>
      <div class="overlay__new">
        <span class="overlay__new-label" aria-hidden="true">Nieuw!</span>
        <span class="overlay__new-items" aria-hidden="true">${this.newRewards
          .map(
            (item) =>
              `<span class="overlay__new-item" data-item="${item.id}">${itemIcon(item)}</span>`,
          )
          .join('')}</span>
      </div>`;
  }

  private renderHint(view: HintView): void {
    if (view.kind === 'stuck' && this.hintKind !== 'stuck') this.feedback.noWayOut();
    this.hintKind = view.kind;
    if (view.kind === 'hint') this.hintLayer.show(view.stage, view.plan, this.game.state);
    else this.hintLayer.clear();

    const stage = view.kind === 'hint' || view.kind === 'pending' ? view.stage : 0;
    this.hintButton.dataset.stage = String(stage);
    this.hintButton.classList.toggle('is-active', view.kind !== 'none');
    this.hintButton.classList.toggle('is-thinking', view.kind === 'pending');
    this.hintButton.setAttribute('aria-busy', String(view.kind === 'pending'));
    const label = stage === 0 ? 'Hint' : stage < 3 ? 'Meer hulp' : 'Hint nog eens bekijken';
    this.hintButton.setAttribute('aria-label', label);
    this.hintButton.title = label;
    this.hintClose.hidden = view.kind === 'none';

    const notice = view.kind === 'stuck' || view.kind === 'unknown';
    this.hintNotice.hidden = !notice;
    this.hintNotice.dataset.kind = view.kind;
    const text = this.hintNotice.querySelector('.hint-notice__text');
    if (text) text.textContent = view.kind === 'stuck' ? 'Zo lukt het niet meer' : 'Even geen hint';
    this.noticeUndo.hidden = view.kind !== 'stuck';
    this.noticeRestart.hidden = view.kind !== 'stuck';
    this.noticeUndo.disabled = !canUndo(this.game);
  }
}
