/**
 * Renders the app icons in public/icons/ from the game's own artwork (the worker from
 * src/assets/pieces/player.svg and the crate from crate.svg). Run once after changing
 * either drawing; the PNGs are committed.
 *
 *   node scripts/render-icons.mjs
 *
 * Uses the Chromium that Playwright already installs for the e2e tests.
 */
import { readFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const root = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');

const player = read('src/assets/pieces/player.svg');
const crate = read('src/assets/pieces/crate.svg');

const inner = (svg) => svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
const heroDefs = player.match(/<defs>[\s\S]*?<\/defs>/)[0];
const front = player
  .match(/<g class="hero__view hero__view--down">[\s\S]*?(?=\n\s*<!-- Back view)/)[0]
  .replace(/<g class="hero__arms--push">[\s\S]*?<\/g>\s*(?=<g class="hero__head")/, '');
const hero = `${heroDefs}
  <ellipse cx="50" cy="92" rx="23" ry="5" fill="#1d0c04" fill-opacity="0.3"/>
  <g stroke="#3b1d0e" stroke-width="3" stroke-linejoin="round">${front}</g>`;

/** The artwork on a 512 square; `scale` shrinks it for the maskable safe zone. */
function icon(scale) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <radialGradient id="bg" cx="0.5" cy="0.35" r="0.75">
      <stop offset="0" stop-color="#3a86cf"/><stop offset="1" stop-color="#123563"/>
    </radialGradient>
  </defs>
  <rect width="512" height="512" fill="url(#bg)"/>
  <g transform="translate(256 256) scale(${scale}) translate(-256 -256)">
    <ellipse cx="256" cy="452" rx="200" ry="26" fill="#06162c" fill-opacity="0.45"/>
    <g transform="translate(236 196) scale(2.6)">${inner(crate)}</g>
    <g transform="translate(-6 60) scale(4)">${hero}</g>
  </g>
</svg>`;
}

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });
async function render(svg, size, file) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<style>html,body{margin:0}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`,
  );
  await page.screenshot({ path: new URL(`public/icons/${file}`, root).pathname });
}
await render(icon(1), 512, 'icon-512.png');
await render(icon(1), 192, 'icon-192.png');
await render(icon(1), 180, 'apple-touch-icon.png');
await render(icon(0.76), 512, 'icon-maskable-512.png');
await browser.close();
