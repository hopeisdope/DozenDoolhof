import type { Direction } from '../engine/state';

/** Minimum finger travel, in CSS pixels, before a swipe counts as a move. */
const SWIPE_THRESHOLD = 24;

/** Maximum finger travel for a tap; anything between a tap and a swipe does nothing. */
const TAP_SLOP = 8;

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
  onBack(): void;
  onHint(): void;
}

/**
 * Arrow keys move; `z`/Backspace undo; `r` restarts; `h` asks for a hint; Enter confirms;
 * Escape goes back.
 */
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
    } else if (event.key === 'h') {
      actions.onHint();
    } else if (event.key === 'Enter') {
      actions.onConfirm();
    } else if (event.key === 'Escape') {
      actions.onBack();
    }
  };
  target.addEventListener('keydown', onKeyDown);
  return () => target.removeEventListener('keydown', onKeyDown);
}

/**
 * Turns a swipe on `element` into exactly one direction. The move fires as soon as
 * the finger has travelled far enough, so it feels immediate; the rest of the same
 * gesture is ignored, which prevents a single swipe from producing several moves.
 * A finger that lifts again almost where it went down is a tap, reported with the
 * position where it went down. Only the first finger is tracked. Pointer events cover
 * touch, pen and mouse.
 */
export function bindSwipe(
  element: HTMLElement,
  onDirection: (direction: Direction) => void,
  onTap?: (x: number, y: number) => void,
): () => void {
  let gesture: { id: number; x: number; y: number; fired: boolean } | null = null;

  const onDown = (event: PointerEvent): void => {
    if (gesture !== null) return;
    gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, fired: false };
    try {
      element.setPointerCapture?.(event.pointerId);
    } catch {
      // Not an active pointer (a synthetic event): the gesture still works without capture.
    }
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
    if (gesture?.id !== event.pointerId) return;
    const { x, y, fired } = gesture;
    gesture = null;
    const travel = Math.max(Math.abs(event.clientX - x), Math.abs(event.clientY - y));
    if (event.type === 'pointerup' && !fired && travel <= TAP_SLOP) onTap?.(x, y);
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
