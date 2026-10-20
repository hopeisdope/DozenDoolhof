import type { Direction, GameState, Level } from '../engine/state';
import type { SearchOutcome } from '../solver/solver';
import { followSolution, planHint, remainingSolution, type HintPlan, type HintStage } from './hint';

/** Finds a solution from `state`, off the main thread where possible. */
export type HintSolver = (level: Level, state: GameState) => Promise<SearchOutcome>;

/** What the hint display should show. `serial` changes whenever it must redraw. */
export type HintView =
  | { readonly kind: 'none' }
  /** Still searching; shown as a thinking lamp. */
  | { readonly kind: 'pending'; readonly stage: HintStage }
  | {
      readonly kind: 'hint';
      readonly stage: HintStage;
      readonly plan: HintPlan;
      readonly serial: number;
    }
  /** No solution exists from here: offer undo or restart. */
  | { readonly kind: 'stuck' }
  /** The search gave up (too big); say so honestly instead of guessing. */
  | { readonly kind: 'unknown' };

const NONE: HintView = { kind: 'none' };

/**
 * Hint state for one level, without any DOM. Each `request()` shows the next, more
 * explicit stage, up to stage 3, which can be replayed. Hints never change the game:
 * the screen reports every state change with `update()`, and a hint survives only a
 * move that follows its own solution; any other move, undo or restart clears it.
 * Search results that arrive after the state has changed are dropped.
 */
export class HintController {
  private level: Level | null = null;
  private knownSolution = '';
  private stage: 0 | HintStage = 0;
  private serial = 0;
  /** A solution from `solutionState`, kept while the player follows it. */
  private solution: string | null = null;
  private solutionState: GameState | null = null;
  private pendingToken = 0;
  private pending = false;
  private current: HintView = NONE;

  constructor(
    private readonly solver: HintSolver,
    private readonly onChange: (view: HintView) => void,
  ) {}

  get view(): HintView {
    return this.current;
  }

  get isPending(): boolean {
    return this.pending;
  }

  /** A new level: forget everything about the previous one. */
  setLevel(level: Level, knownSolution: string): void {
    this.level = level;
    this.knownSolution = knownSolution;
    this.solution = null;
    this.solutionState = null;
    this.clear();
  }

  /** The hint button: show the next stage (or replay stage 3) for `state`. */
  request(state: GameState): void {
    const level = this.level;
    if (level === null || this.pending) return;
    if (this.current.kind === 'stuck' || this.current.kind === 'unknown') return;
    this.stage = this.stage === 0 ? 1 : this.stage === 1 ? 2 : 3;

    if (this.solutionState !== state) {
      this.solution = remainingSolution(level, this.knownSolution, state);
      this.solutionState = this.solution === null ? null : state;
    }
    if (this.solution !== null) {
      this.show(state, this.solution);
      return;
    }

    const token = ++this.pendingToken;
    this.pending = true;
    this.emit({ kind: 'pending', stage: this.stage });
    this.solver(level, state).then(
      (outcome) => this.receive(token, state, outcome),
      () => this.receive(token, state, { kind: 'gave-up' }),
    );
  }

  /**
   * The game state changed. `direction` is the move that was played, or `null` for an
   * undo or restart. A move along the hint's solution keeps the hint and updates it.
   */
  update(state: GameState, direction: Direction | null): void {
    const rest =
      direction !== null && this.solution !== null && !this.pending
        ? followSolution(this.solution, direction)
        : null;
    if (rest === null) {
      this.solution = null;
      this.solutionState = null;
      if (this.stage !== 0 || this.pending || this.current.kind !== 'none') this.clear();
      return;
    }
    this.solution = rest;
    this.solutionState = state;
    if (this.stage === 0) return;
    if (rest === '') this.clear();
    else this.show(state, rest);
  }

  /** Hides the hint and cancels a running search; the next request starts at stage 1. */
  clear(): void {
    this.pendingToken++;
    this.pending = false;
    this.stage = 0;
    this.emit(NONE);
  }

  private receive(token: number, state: GameState, outcome: SearchOutcome): void {
    if (token !== this.pendingToken) return;
    this.pending = false;
    if (outcome.kind === 'solved') {
      this.solution = outcome.result.solution;
      this.solutionState = state;
      this.show(state, outcome.result.solution);
    } else {
      this.emit({ kind: outcome.kind === 'unsolvable' ? 'stuck' : 'unknown' });
    }
  }

  private show(state: GameState, solution: string): void {
    const plan = this.level && this.stage !== 0 ? planHint(this.level, state, solution) : null;
    if (plan === null || this.stage === 0) {
      // Never show a route that does not work from here.
      this.solution = null;
      this.solutionState = null;
      this.emit({ kind: 'unknown' });
      return;
    }
    this.emit({ kind: 'hint', stage: this.stage, plan, serial: ++this.serial });
  }

  private emit(view: HintView): void {
    if (view === this.current) return;
    this.current = view;
    this.onChange(view);
  }
}
