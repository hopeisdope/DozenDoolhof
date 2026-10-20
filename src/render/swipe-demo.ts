import { toPosition, type Direction, type Level } from '../engine/state';

/** A pointing hand, drawn like the rest of the game: white with a thick dark outline. */
const HAND = `<svg class="swipe-demo__svg" viewBox="0 0 40 44" aria-hidden="true">
  <path d="M16 22V7a3.5 3.5 0 0 1 7 0v12l7.5 1.6a4 4 0 0 1 3.1 4.5L32 36a6 6 0 0 1-6 5H18.5
    a6 6 0 0 1-4.6-2.2L7.5 31a3 3 0 0 1 4.3-4.1L16 30z" fill="#ffffff" stroke="#3b1d0e"
    stroke-width="2.8" stroke-linejoin="round"/>
  <path d="M23 21.5v5.5M27.5 22.5v4.5" fill="none" stroke="#3b1d0e" stroke-width="2"
    stroke-linecap="round"/>
</svg>`;

const STEP: Record<Direction, readonly [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};

/**
 * A hand that shows how to move, for children who have never won a level: it lies on
 * the worker and slides one cell the way of the first move, over and over, until the
 * child moves. Never takes a touch; with reduced motion it simply rests on that cell.
 */
export class SwipeDemo {
  readonly element = document.createElement('div');
  private readonly hand = document.createElement('div');

  constructor(private readonly level: Level) {
    this.element.className = 'swipe-demo';
    this.element.dataset.testid = 'swipe-demo';
    this.element.hidden = true;
    this.hand.className = 'swipe-demo__hand';
    this.hand.innerHTML = HAND;
    this.element.append(this.hand);
  }

  show(cell: number, direction: Direction): void {
    const { x, y } = toPosition(this.level, cell);
    const [dx, dy] = STEP[direction];
    this.hand.style.transform = `translate(${x * 100}%, ${y * 100}%)`;
    this.hand.style.setProperty('--dx', String(dx));
    this.hand.style.setProperty('--dy', String(dy));
    this.element.dataset.direction = direction;
    this.element.hidden = false;
  }

  hide(): void {
    this.element.hidden = true;
  }
}
