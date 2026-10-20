/** Icon paths on a 24×24 grid, drawn as white strokes with a dark outline. */
export const ICONS = {
  undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  restart: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
  next: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  trash:
    '<path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="M6 7l1 13h10l1-13"/><path d="M10 11v6"/>' +
    '<path d="M14 11v6"/>',
  close: '<path d="M6 6l12 12"/><path d="M18 6 6 18"/>',
  hint:
    '<path d="M12 2.5a6.5 6.5 0 0 0-3.8 11.8c.6.5.8 1 .8 1.7v.5h6V16c0-.7.2-1.2.8-1.7A6.5 6.5 0 0 0 12 2.5z"/>' +
    '<path d="M9.5 19h5"/><path d="M10.5 21.5h3"/>',
  levels:
    '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/>' +
    '<rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/>',
};

/** White icon with a thick dark outline, drawn as two stacked strokes. */
export function icon(paths: string): string {
  return `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke-linecap="round"
    stroke-linejoin="round"><g stroke="#3b1d0e" stroke-width="6.5">${paths}</g>
    <g stroke="currentColor" stroke-width="3">${paths}</g></svg>`;
}

export function iconButton(className: string, label: string, iconPaths: string): HTMLButtonElement {
  const element = document.createElement('button');
  element.type = 'button';
  element.className = `button ${className}`;
  element.setAttribute('aria-label', label);
  element.title = label;
  element.innerHTML = icon(iconPaths);
  return element;
}

/**
 * A row of small stars, used to show a tier's difficulty or a level's result without
 * text. With `outOf`, the stars beyond `count` are drawn as empty slots.
 */
export function starRow(count: number, starUrl: string, outOf = count): string {
  return Array.from(
    { length: outOf },
    (_, index) => `<img src="${starUrl}" alt=""${index < count ? '' : ' class="is-empty"'} />`,
  ).join('');
}
