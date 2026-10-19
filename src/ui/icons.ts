/** Icon paths on a 24×24 grid, drawn as white strokes with a dark outline. */
export const ICONS = {
  undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  restart: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
  next: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
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

/** A row of small filled stars, used to show a tier's difficulty without text. */
export function starRow(count: number, starUrl: string): string {
  return Array.from({ length: count }, () => `<img src="${starUrl}" alt="" />`).join('');
}
