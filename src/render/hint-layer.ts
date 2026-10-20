import { toPosition, type Direction, type GameState, type Level } from '../engine/state';
import type { HintPlan, HintStage } from '../hints/hint';
import { DEFAULT_OUTFIT, type Outfit } from '../rewards/catalog';
import { heroMarkup } from './hero';

/** Milliseconds per step in the stage-3 preview, and the pauses around it. */
const STEP_MS = 340;
const HOLD_START_MS = 500;
const HOLD_END_MS = 900;

const ROTATION: Record<Direction, number> = { right: 0, down: 90, left: 180, up: 270 };

/**
 * Draws a hint on top of the board without touching the pieces: an outline around
 * the box to move and a dashed ring on its goal (stage 1), an arrow and a "stand here"
 * ring (stage 2), and a dotted route with a see-through worker and crate that act out
 * the next moves (stage 3). Shapes differ per meaning, so colour is never the only
 * cue. Markup is generated from numbers only.
 */
export class HintLayer {
  readonly element = document.createElement('div');
  private animations: Animation[] = [];

  constructor(
    private readonly level: Level,
    private readonly outfit: Outfit = DEFAULT_OUTFIT,
  ) {
    this.element.className = 'hint-layer';
    this.element.dataset.testid = 'hint-layer';
    this.element.hidden = true;
  }

  show(stage: HintStage, plan: HintPlan, state: GameState): void {
    this.clear();
    const { width, height } = this.level;
    const parts: string[] = [];
    if (stage >= 3) parts.push(this.route(plan, state));
    parts.push(this.goalRing(plan.goal), this.boxOutline(plan.box));
    if (stage >= 2) {
      if (plan.pushFrom !== state.player) parts.push(this.standRing(plan.pushFrom));
      parts.push(this.arrow(plan.box, plan.direction));
    }
    this.element.dataset.stage = String(stage);
    this.element.innerHTML = `<svg class="hint-layer__marks" viewBox="0 0 ${width} ${height}"
      aria-hidden="true">${parts.join('')}</svg>`;
    if (stage >= 3) this.addGhosts(plan, state);
    this.element.hidden = false;
  }

  clear(): void {
    for (const animation of this.animations) animation.cancel();
    this.animations = [];
    this.element.replaceChildren();
    delete this.element.dataset.stage;
    this.element.hidden = true;
  }

  private centre(cell: number): { x: number; y: number } {
    const { x, y } = toPosition(this.level, cell);
    return { x: x + 0.5, y: y + 0.5 };
  }

  private cellAttributes(cell: number): string {
    const { x, y } = toPosition(this.level, cell);
    return `data-x="${x}" data-y="${y}"`;
  }

  /** A thick rounded square around the box: "this one". */
  private boxOutline(cell: number): string {
    const { x, y } = toPosition(this.level, cell);
    const rect = `x="${x + 0.03}" y="${y + 0.03}" width="0.94" height="0.94" rx="0.2"`;
    return `<g class="hint__box" data-testid="hint-box" ${this.cellAttributes(cell)}>
      <rect ${rect} class="hint__outline" stroke-width="0.17"/>
      <rect ${rect} class="hint__line" stroke-width="0.08"/></g>`;
  }

  /** A dashed ring on the goal the box belongs on: "it goes there". */
  private goalRing(cell: number): string {
    const { x, y } = this.centre(cell);
    return `<g class="hint__goal" data-testid="hint-goal" ${this.cellAttributes(cell)}>
      <circle cx="${x}" cy="${y}" r="0.4" class="hint__outline" stroke-width="0.16"/>
      <circle cx="${x}" cy="${y}" r="0.4" class="hint__line" stroke-width="0.08"
        stroke-dasharray="0.21 0.13"/></g>`;
  }

  /** A filled ring where the worker should stand to push. */
  private standRing(cell: number): string {
    const { x, y } = this.centre(cell);
    return `<g class="hint__stand" data-testid="hint-stand" ${this.cellAttributes(cell)}>
      <circle cx="${x}" cy="${y}" r="0.26" class="hint__outline hint__fill" stroke-width="0.14"/>
      <circle cx="${x}" cy="${y}" r="0.09" class="hint__dot"/></g>`;
  }

  /** A chunky arrow from the box towards where it will be pushed. */
  private arrow(cell: number, direction: Direction): string {
    const { x, y } = this.centre(cell);
    // Drawn pointing right from the box centre, then rotated into place.
    const shape = 'M0.05 -0.13 H0.55 V-0.3 L0.95 0 L0.55 0.3 V0.13 H0.05 Z';
    return `<g class="hint__arrow" data-testid="hint-arrow" data-direction="${direction}"
      transform="translate(${x} ${y}) rotate(${ROTATION[direction]})">
      <path d="${shape}" class="hint__outline hint__fill" stroke-width="0.12"
        stroke-linejoin="round"/></g>`;
  }

  /** Small dots on every cell the worker walks through in the preview. */
  private route(plan: HintPlan, state: GameState): string {
    const cells = [state.player, ...plan.playerRoute];
    const dots = cells.slice(1).map((cell) => {
      const { x, y } = this.centre(cell);
      return `<circle cx="${x}" cy="${y}" r="0.11" class="hint__outline hint__route-dot"
        stroke-width="0.06"/>`;
    });
    return `<g class="hint__route" data-testid="hint-route" data-steps="${plan.preview.length}"
      data-preview="${plan.preview}"
      >${dots.join('')}</g>`;
  }

  private addGhosts(plan: HintPlan, state: GameState): void {
    const player = this.ghost('player');
    player.dataset.facing = plan.direction;
    player
      .querySelector('.hint-ghost__sprite')
      ?.insertAdjacentHTML('beforeend', heroMarkup(this.outfit));
    const box = this.ghost('box');

    const playerCells = [state.player, ...plan.playerRoute];
    const boxCells = [plan.box, ...plan.boxRoute];
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    if (reduced || typeof player.animate !== 'function') {
      // Without motion, show where the preview ends; the route dots show the way.
      this.place(player, playerCells.at(-1) ?? state.player);
      this.place(box, boxCells.at(-1) ?? plan.box);
      return;
    }
    this.place(player, state.player);
    this.place(box, plan.box);
    const steps = playerCells.length - 1;
    const total = HOLD_START_MS + steps * STEP_MS + HOLD_END_MS;
    const frames = (cells: readonly number[]): Keyframe[] => [
      { transform: this.translate(cells[0] ?? 0), offset: 0 },
      ...cells.map((cell, index) => ({
        transform: this.translate(cell),
        offset: (HOLD_START_MS + index * STEP_MS) / total,
      })),
      { transform: this.translate(cells.at(-1) ?? 0), offset: 1 },
    ];
    const timing: KeyframeAnimationOptions = { duration: total, iterations: Infinity };
    this.animations.push(player.animate(frames(playerCells), timing));
    this.animations.push(box.animate(frames(boxCells), timing));
  }

  private ghost(kind: 'player' | 'box'): HTMLElement {
    const element = document.createElement('div');
    element.className = `hint-ghost hint-ghost--${kind}`;
    if (kind === 'player') element.classList.add('piece--player');
    element.dataset.testid = `hint-ghost-${kind}`;
    const sprite = document.createElement('div');
    sprite.className = 'hint-ghost__sprite';
    element.append(sprite);
    this.element.append(element);
    return element;
  }

  private translate(cell: number): string {
    const { x, y } = toPosition(this.level, cell);
    return `translate(${x * 100}%, ${y * 100}%)`;
  }

  private place(element: HTMLElement, cell: number): void {
    element.style.transform = this.translate(cell);
  }
}
