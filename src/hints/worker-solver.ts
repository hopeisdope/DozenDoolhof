import type { GameState, Level } from '../engine/state';
import { search, type SearchOutcome } from '../solver/solver';
import type { HintSolver } from './controller';

/**
 * Push states the hint search may explore. The hardest level needs a few thousand from
 * its start; the budget only stops a search through a huge dead end in time.
 */
export const HINT_SEARCH_BUDGET = 60_000;

interface Response {
  readonly id: number;
  readonly outcome: SearchOutcome;
}

/** Solves on the main thread after yielding once; the fallback without workers. */
function solveLater(level: Level, state: GameState): Promise<SearchOutcome> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(search(level, state, HINT_SEARCH_BUDGET)), 0);
  });
}

/**
 * A hint solver backed by one Web Worker. Only the newest request matters: a new one
 * stops a search that is still running by replacing the worker. Without worker support,
 * or when the worker fails to load, it falls back to solving on the main thread.
 */
export function createWorkerSolver(): HintSolver {
  let worker: Worker | null = null;
  let broken = typeof Worker === 'undefined';
  let nextId = 0;
  let inFlight: {
    id: number;
    level: Level;
    state: GameState;
    resolve: (o: SearchOutcome) => void;
  } | null = null;

  const stop = (): void => {
    worker?.terminate();
    worker = null;
  };

  const start = (): Worker => {
    const created = new Worker(new URL('./solver-worker.ts', import.meta.url), {
      type: 'module',
    });
    created.addEventListener('message', (event: MessageEvent<Response>) => {
      if (inFlight?.id !== event.data.id) return;
      const { resolve } = inFlight;
      inFlight = null;
      resolve(event.data.outcome);
    });
    created.addEventListener('error', () => {
      broken = true;
      stop();
      const request = inFlight;
      inFlight = null;
      if (request) void solveLater(request.level, request.state).then(request.resolve);
    });
    return created;
  };

  return (level, state) => {
    if (broken) return solveLater(level, state);
    if (inFlight !== null) {
      // An older search is still running; nobody waits for it any more.
      stop();
      inFlight = null;
    }
    try {
      worker ??= start();
    } catch {
      broken = true;
      return solveLater(level, state);
    }
    const id = ++nextId;
    const active = worker;
    return new Promise((resolve) => {
      inFlight = { id, level, state, resolve };
      active.postMessage({ id, level, state, budget: HINT_SEARCH_BUDGET });
    });
  };
}
