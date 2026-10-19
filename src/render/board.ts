import heroSvg from '../assets/pieces/player.svg?raw';
import { toPosition, type Direction, type GameState, type Level } from '../engine/state';
import { describeMotion } from './motion';
import { wallLayerSvg } from './walls';

type TileKind = 'void' | 'wall' | 'floor' | 'goal';

function tileKind(level: Level, index: number): TileKind {
  if (level.walls[index]) return 'wall';
  if (!level.floor[index]) return 'void';
  return level.goals.includes(index) ? 'goal' : 'floor';
}

/** Restarts a CSS animation by toggling its class across a forced reflow. */
function restartClass(element: Element, className: string, on: boolean): void {
  element.classList.remove(className);
  if (!on) return;
  void (element as HTMLElement).getBoundingClientRect();
  element.classList.add(className);
}

/**
 * DOM view of one level. Floor and goal tiles live in a CSS grid, the walls are one
 * autotiled SVG layer on top of it, and the player and boxes are absolutely
 * positioned pieces moved with `transform`, so moves animate via CSS. Everything
 * sizes itself as a fraction of the board, so no resize handling is needed.
 */
export class BoardView {
  readonly element: HTMLElement;
  private readonly player: HTMLElement;
  private readonly boxes: { element: HTMLElement; cell: number }[];
  private readonly goalTiles = new Map<number, HTMLElement>();
  private state: GameState;
  private facing: Direction = 'down';

  constructor(private readonly level: Level) {
    this.element = document.createElement('div');
    this.element.className = 'board';
    this.element.dataset.testid = 'board';
    this.element.style.setProperty('--cols', String(level.width));
    this.element.style.setProperty('--rows', String(level.height));

    const tiles = document.createElement('div');
    tiles.className = 'board__tiles';
    for (let index = 0; index < level.width * level.height; index++) {
      const tile = document.createElement('div');
      const kind = tileKind(level, index);
      tile.className = `tile tile--${kind}`;
      // Two floor variants in a fixed pattern break up the repetition.
      const { x, y } = toPosition(level, index);
      if (kind !== 'wall' && kind !== 'void' && (x * 3 + y * 5) % 4 === 0) {
        tile.classList.add('tile--alt');
      }
      if (kind === 'goal') this.goalTiles.set(index, tile);
      tiles.append(tile);
    }
    this.element.append(tiles);
    // Markup is generated from numbers only, never from user input.
    this.element.insertAdjacentHTML('beforeend', wallLayerSvg(level));

    this.boxes = level.start.boxes.map((cell) => ({ element: this.createPiece('box'), cell }));
    this.player = this.createPiece('player');
    this.player.querySelector('.piece__sprite')?.insertAdjacentHTML('beforeend', heroSvg);

    this.state = level.start;
    this.update(level.start, false);
  }

  /** Moves the pieces to match `state`. With `animate` off, pieces jump instantly. */
  update(state: GameState, animate: boolean): void {
    this.element.classList.toggle('board--instant', !animate);

    // Keep each box element on its cell where possible so only the pushed box animates.
    const unmatchedCells = state.boxes.filter((cell) => !this.boxes.some((b) => b.cell === cell));
    for (const box of this.boxes) {
      if (!state.boxes.includes(box.cell)) box.cell = unmatchedCells.shift() ?? box.cell;
    }
    for (const box of this.boxes) {
      this.place(box.element, box.cell);
      box.element.classList.toggle('is-on-goal', this.level.goals.includes(box.cell));
    }
    for (const [cell, tile] of this.goalTiles) {
      tile.classList.toggle('is-filled', state.boxes.includes(cell));
    }
    this.place(this.player, state.player);

    const motion = describeMotion(this.level, this.state, state, this.facing);
    this.facing = motion.facing;
    this.player.dataset.facing = motion.facing;
    this.player.classList.toggle('is-pushing', motion.pushing);
    restartClass(this.player, 'is-walking', motion.walking && animate);
    this.state = state;

    if (!animate) {
      // Flush styles so the next animated update transitions from here.
      void this.element.offsetWidth;
      this.element.classList.remove('board--instant');
    }
  }

  /** Short wiggle to show that a move is blocked. */
  bump(): void {
    const sprite = this.player.querySelector('.piece__sprite');
    if (sprite) restartClass(sprite, 'is-bumped', true);
  }

  private createPiece(kind: 'player' | 'box'): HTMLElement {
    const piece = document.createElement('div');
    piece.className = `piece piece--${kind}`;
    piece.dataset.testid = kind;
    const sprite = document.createElement('div');
    sprite.className = 'piece__sprite';
    piece.append(sprite);
    this.element.append(piece);
    return piece;
  }

  private place(element: HTMLElement, cell: number): void {
    const { x, y } = toPosition(this.level, cell);
    element.style.transform = `translate(${x * 100}%, ${y * 100}%)`;
    element.dataset.x = String(x);
    element.dataset.y = String(y);
  }
}
