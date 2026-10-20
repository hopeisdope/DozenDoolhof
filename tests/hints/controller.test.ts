import { describe, expect, it } from 'vitest';
import { createGame, move, restart, undo, type Game } from '../../src/engine/history';
import type { Direction, GameState, Level } from '../../src/engine/state';
import { HintController, type HintSolver, type HintView } from '../../src/hints/controller';
import { search, type SearchOutcome } from '../../src/solver/solver';
import { Progress, starsFor, STORAGE_KEY, type StorageLike } from '../../src/ui/progress';
import { at, level } from '../helpers/level';

const ROOM = level(`
########
#      #
#@ $  .#
#      #
########`);
const KNOWN = 'rRRR';

const OTHER = level(
  `
######
#@$ .#
######`,
  'other',
);

/** A solver whose answers the test releases by hand, to control timing. */
function manualSolver() {
  const calls: { state: GameState; resolve: (outcome: SearchOutcome) => void }[] = [];
  const solver: HintSolver = (_level: Level, state: GameState) =>
    new Promise((resolve) => calls.push({ state, resolve: (o) => resolve(o) }));
  const answer = async (index = calls.length - 1) => {
    const call = calls[index]!;
    call.resolve(search(ROOM, call.state));
    await Promise.resolve();
  };
  return { solver, calls, answer };
}

function setup(solver: HintSolver = (lvl, state) => Promise.resolve(search(lvl, state))) {
  const views: HintView[] = [];
  const hints = new HintController(solver, (view) => views.push(view));
  hints.setLevel(ROOM, KNOWN);
  return { hints, views };
}

/** Plays a move in the game and reports it to the controller, as the screen does. */
function play(hints: HintController, game: Game, direction: Direction): Game {
  const next = move(game, direction);
  if (next !== game) hints.update(next.state, direction);
  return next;
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

const stage = (view: HintView) => (view.kind === 'hint' ? view.stage : null);

describe('HintController', () => {
  it('goes through the three stages one tap at a time, then replays stage 3', () => {
    const { hints, views } = setup();
    const game = createGame(ROOM);
    hints.request(game.state);
    expect(stage(hints.view)).toBe(1);
    hints.request(game.state);
    expect(stage(hints.view)).toBe(2);
    hints.request(game.state);
    expect(stage(hints.view)).toBe(3);
    const serial = hints.view.kind === 'hint' ? hints.view.serial : -1;
    hints.request(game.state);
    expect(stage(hints.view)).toBe(3);
    expect(hints.view.kind === 'hint' && hints.view.serial).toBeGreaterThan(serial);
    expect(views.map(stage)).toEqual([1, 2, 3, 3]);
  });

  it('uses the known solution at the start without searching', () => {
    const { solver, calls } = manualSolver();
    const { hints } = setup(solver);
    hints.request(ROOM.start);
    expect(calls).toHaveLength(0);
    expect(hints.view).toMatchObject({ kind: 'hint', plan: { box: at(ROOM, 3, 2) } });
  });

  it('searches from a changed state and shows the hint when the answer arrives', async () => {
    const { solver, calls, answer } = manualSolver();
    const { hints } = setup(solver);
    let game = createGame(ROOM);
    game = play(hints, game, 'up');
    hints.request(game.state);
    expect(hints.view).toEqual({ kind: 'pending', stage: 1 });
    expect(hints.isPending).toBe(true);
    // Taps while thinking are ignored, so fast tapping cannot skip stages.
    hints.request(game.state);
    expect(calls).toHaveLength(1);
    await answer();
    expect(hints.view).toMatchObject({ kind: 'hint', stage: 1, plan: { box: at(ROOM, 3, 2) } });
    // The answer is kept: the next stage needs no new search.
    hints.request(game.state);
    expect(calls).toHaveLength(1);
    expect(stage(hints.view)).toBe(2);
  });

  it('a move along the hint updates it; any other move clears it', async () => {
    const { hints } = setup();
    let game = createGame(ROOM);
    hints.request(game.state);
    hints.request(game.state);
    game = play(hints, game, 'right'); // follows 'rRRR'
    expect(hints.view).toMatchObject({
      kind: 'hint',
      stage: 2,
      plan: { pushFrom: game.state.player },
    });
    game = play(hints, game, 'up'); // the player goes their own way
    expect(hints.view).toEqual({ kind: 'none' });
    // The next tap starts at stage 1 again, for the new state.
    hints.request(game.state);
    await flush();
    expect(stage(hints.view)).toBe(1);
  });

  it('undo and restart clear the hint', () => {
    const { hints } = setup();
    let game = play(hints, createGame(ROOM), 'right');
    hints.request(game.state);
    game = undo(game);
    hints.update(game.state, null);
    expect(hints.view).toEqual({ kind: 'none' });

    game = play(hints, game, 'up');
    hints.request(game.state);
    game = restart(game);
    hints.update(game.state, null);
    expect(hints.view).toEqual({ kind: 'none' });
  });

  it('a level change clears the hint and forgets the old solution', () => {
    const { hints } = setup();
    hints.request(ROOM.start);
    hints.request(ROOM.start);
    hints.setLevel(OTHER, 'RR');
    expect(hints.view).toEqual({ kind: 'none' });
    hints.request(OTHER.start);
    expect(hints.view).toMatchObject({ kind: 'hint', stage: 1, plan: { box: at(OTHER, 2, 1) } });
  });

  it('drops a search answer that arrives after the state changed', async () => {
    const { solver, answer } = manualSolver();
    const { hints, views } = setup(solver);
    const game = play(hints, createGame(ROOM), 'up');
    hints.request(game.state);
    play(hints, game, 'down'); // moved while the solver was thinking
    expect(hints.view).toEqual({ kind: 'none' });
    await answer(0);
    expect(hints.view).toEqual({ kind: 'none' });
    expect(views.filter((view) => view.kind === 'hint')).toHaveLength(0);
  });

  it('drops a search answer that arrives after the hint was closed or the level changed', async () => {
    const { solver, answer } = manualSolver();
    const { hints } = setup(solver);
    const moved = play(hints, createGame(ROOM), 'up');
    hints.request(moved.state);
    hints.clear();
    await answer(0);
    expect(hints.view).toEqual({ kind: 'none' });

    hints.request(moved.state);
    hints.setLevel(OTHER, 'RR');
    await answer(1);
    expect(hints.view).toEqual({ kind: 'none' });
  });

  it('reports an unsolvable state, and clears that once the player undoes', async () => {
    const { hints } = setup();
    // The box against the top wall, away from the goal: it can never get there.
    let game: Game = {
      level: ROOM,
      state: { ...ROOM.start, boxes: [at(ROOM, 3, 1)] },
      history: [ROOM.start],
    };
    hints.request(game.state);
    await flush();
    expect(hints.view).toEqual({ kind: 'stuck' });
    // More taps change nothing: no route is ever invented.
    hints.request(game.state);
    expect(hints.view).toEqual({ kind: 'stuck' });
    game = undo(game);
    hints.update(game.state, null);
    expect(hints.view).toEqual({ kind: 'none' });
  });

  it('is honest when the search gives up or fails', async () => {
    const gaveUp = setup(() => Promise.resolve({ kind: 'gave-up' }));
    const moved = move(createGame(ROOM), 'up');
    gaveUp.hints.request(moved.state);
    await flush();
    expect(gaveUp.hints.view).toEqual({ kind: 'unknown' });

    const failed = setup(() => Promise.reject(new Error('worker crashed')));
    failed.hints.request(moved.state);
    await flush();
    expect(failed.hints.view).toEqual({ kind: 'unknown' });
  });

  it('closing hides the hint; reopening starts at stage 1', () => {
    const { hints } = setup();
    hints.request(ROOM.start);
    hints.request(ROOM.start);
    hints.clear();
    expect(hints.view).toEqual({ kind: 'none' });
    hints.request(ROOM.start);
    expect(stage(hints.view)).toBe(1);
  });

  it('never changes the game, its moves, the stars or the saved progress', async () => {
    const stored = new Map<string, string>();
    const storage: StorageLike = {
      getItem: (key) => stored.get(key) ?? null,
      setItem: (key, value) => void stored.set(key, value),
      removeItem: (key) => void stored.delete(key),
    };
    const progress = new Progress(storage);
    progress.complete('test', 2);
    const savedBefore = stored.get(STORAGE_KEY);

    const { hints } = setup();
    let game = play(hints, createGame(ROOM), 'up');
    const snapshot = JSON.stringify(game);
    for (let i = 0; i < 4; i++) {
      hints.request(game.state);
      await flush();
    }
    expect(JSON.stringify(game)).toBe(snapshot);
    expect(game.state.moves).toBe(1);
    expect(stored.get(STORAGE_KEY)).toBe(savedBefore);
    expect(progress.stars('test')).toBe(2);

    // Following the hint to the end scores like any other play: only real moves count.
    hints.request(game.state);
    let played = 1;
    while (hints.view.kind === 'hint') {
      const next = hints.view.plan.preview[0]!.toLowerCase() as 'u' | 'd' | 'l' | 'r';
      const direction = ({ u: 'up', d: 'down', l: 'left', r: 'right' } as const)[next];
      game = play(hints, game, direction);
      played++;
    }
    expect(hints.view).toEqual({ kind: 'none' });
    expect(game.state.boxes).toEqual([at(ROOM, 6, 2)]);
    expect(game.state.moves).toBe(played);
    expect(starsFor(game.state.moves, KNOWN.length)).toBe(2);
  });
});
