import type { GameState, Level } from '../engine/state';
import { search } from '../solver/solver';

/** Runs the solver for hints off the main thread, so the board never freezes. */
interface Request {
  readonly id: number;
  readonly level: Level;
  readonly state: GameState;
  readonly budget: number;
}

// The DOM lib types `self` as a Window; in a dedicated worker it is the worker scope.
const scope = self as unknown as Worker;

scope.addEventListener('message', (event: MessageEvent<Request>) => {
  const { id, level, state, budget } = event.data;
  scope.postMessage({ id, outcome: search(level, state, budget) });
});
