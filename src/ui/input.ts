import type { Direction } from '../engine/state';

/** Minimum finger travel, in CSS pixels, before a swipe counts as a move. */
const SWIPE_THRESHOLD = 24;

const KEY_DIRECTIONS: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
};

export interface KeyboardActions {
  onDirection(direction: Direction): void;
  onUndo(): void;
  onRestart(): void;
  onConfirm(): void;
}

/** Arrow keys move; `z`/Backspace undo; `r` restarts; Enter confirms dialogs. */
export function bindKeyboard(target: Window, actions: KeyboardActions): () => void {
  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const direction = KEY_DIRECTIONS[event.key];
    if (direction) {
      event.preventDefault();
      actions.onDirection(direction);
    } else if (event.key === 'z' || event.key === 'Backspace') {
      event.preventDefault();
      actions.onUndo();
    } else if (event.key === 'r') {
      actions.onRestart();
    } else if (event.key === 'Enter') {
      actions.onConfirm();
    }
  };
  target.addEventListener('keydown', onKeyDown);
  return () => target.removeEventListener('keydown', onKeyDown);
}

/**
 * Turns a swipe on `element` into exactly one direction. The move fires as soon as
 * the finger has travelled far enough, so it feels immediate; the rest of the same
 * gesture is ignored, which prevents a single swipe from producing several moves.
 * Only the first finger is tracked. Pointer events cover touch, pen and mouse.
 */
export function bindSwipe(
  element: HTMLElement,
  onDirection: (direction: Direction) => void,
): () => void {
  let gesture: { id: number; x: number; y: number; fired: boolean } | null = null;

  const onDown = (event: PointerEvent): void => {
    if (gesture !== null) return;
    gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, fired: false };
    element.setPointerCapture?.(event.pointerId);
  };

  const onMove = (event: PointerEvent): void => {
    if (gesture === null || gesture.id !== event.pointerId || gesture.fired) return;
    const dx = event.clientX - gesture.x;
    const dy = event.clientY - gesture.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_THRESHOLD) return;
    gesture.fired = true;
    if (Math.abs(dx) > Math.abs(dy)) onDirection(dx > 0 ? 'right' : 'left');
    else onDirection(dy > 0 ? 'down' : 'up');
  };

  const onEnd = (event: PointerEvent): void => {
    if (gesture?.id === event.pointerId) gesture = null;
  };

  // Belt and braces next to `touch-action: none`: never let the page scroll or zoom.
  const preventTouchScroll = (event: TouchEvent): void => event.preventDefault();

  element.addEventListener('pointerdown', onDown);
  element.addEventListener('pointermove', onMove);
  element.addEventListener('pointerup', onEnd);
  element.addEventListener('pointercancel', onEnd);
  element.addEventListener('touchmove', preventTouchScroll, { passive: false });
  return () => {
    element.removeEventListener('pointerdown', onDown);
    element.removeEventListener('pointermove', onMove);
    element.removeEventListener('pointerup', onEnd);
    element.removeEventListener('pointercancel', onEnd);
    element.removeEventListener('touchmove', preventTouchScroll);
  };
}
