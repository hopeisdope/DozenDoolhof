import { toPosition, type GameState, type Level } from '../engine/state';

type TileKind = 'void' | 'wall' | 'floor' | 'goal';

function tileKind(level: Level, index: number): TileKind {
  if (level.walls[index]) return 'wall';
  if (!level.floor[index]) return 'void';
  return level.goals.includes(index) ? 'goal' : 'floor';
}

/**
 * DOM view of one level. Static tiles live in a CSS grid; the player and boxes are
 * absolutely positioned pieces moved with `transform`, so moves animate via CSS.
 * Pieces size themselves as fractions of the board, so no resize handling is needed.
 */
export class BoardView {
  readonly element: HTMLElement;
  private readonly player: HTMLElement;
  private readonly boxes: { element: HTMLElement; cell: number }[];

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
      tile.className = `tile tile--${tileKind(level, index)}`;
      tiles.append(tile);
    }
    this.element.append(tiles);

    this.boxes = level.start.boxes.map((cell) => {
      const element = this.createPiece('box');
      return { element, cell };
    });
    this.player = this.createPiece('player');
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
    this.place(this.player, state.player);

    if (!animate) {
      // Flush styles so the next animated update transitions from here.
      void this.element.offsetWidth;
      this.element.classList.remove('board--instant');
    }
  }

  /** Short wiggle to show that a move is blocked. */
  bump(): void {
    const sprite = this.player.firstElementChild;
    if (!sprite) return;
    sprite.classList.remove('is-bumped');
    void (sprite as HTMLElement).offsetWidth;
    sprite.classList.add('is-bumped');
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
