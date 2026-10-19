import { expect, test, type Page } from '@playwright/test';
import { LEVEL_DEFINITIONS } from '../../src/levels/definitions';

const ARROW_KEYS: Record<string, string> = {
  u: 'ArrowUp',
  d: 'ArrowDown',
  l: 'ArrowLeft',
  r: 'ArrowRight',
};

async function playSolution(page: Page, solution: string): Promise<void> {
  for (const char of solution) {
    await page.keyboard.press(ARROW_KEYS[char.toLowerCase()]!);
  }
}

function solutionOf(index: number): string {
  return LEVEL_DEFINITIONS[index]!.solution;
}

const moves = (page: Page) => page.getByTestId('moves');
const player = (page: Page) => page.getByTestId('player');
const overlay = (page: Page) => page.getByTestId('win-overlay');

test.describe('keyboard play (desktop)', () => {
  test.skip(({ isMobile }) => isMobile, 'keyboard tests run on the desktop project');

  test('plays level 1 to the win screen and continues to level 2', async ({ page }) => {
    await page.goto('./');
    await expect(page.getByRole('heading', { name: 'Level 1' })).toBeVisible();
    await expect(overlay(page)).toBeHidden();

    await playSolution(page, solutionOf(0));

    await expect(overlay(page)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Gelukt!' })).toBeVisible();
    await expect(page.getByTestId('board')).toHaveAttribute('data-solved', 'true');
    await expect(page.locator('.piece--box.is-on-goal')).toHaveCount(1);

    await page.getByRole('button', { name: 'Volgende level' }).click();
    await expect(page.getByRole('heading', { name: 'Level 2' })).toBeVisible();
    await expect(overlay(page)).toBeHidden();
    await expect(moves(page)).toHaveText('Zetten: 0');
  });

  test('plays through every level', async ({ page }) => {
    await page.goto('./');
    for (const [index, definition] of LEVEL_DEFINITIONS.entries()) {
      await expect(page.getByRole('heading', { name: `Level ${index + 1}` })).toBeVisible();
      await playSolution(page, definition.solution);
      await expect(overlay(page)).toBeVisible();
      await page.keyboard.press('Enter');
    }
    // After the last level the game starts again at level 1.
    await expect(page.getByRole('heading', { name: 'Level 1' })).toBeVisible();
  });

  test('a blocked move changes nothing', async ({ page }) => {
    await page.goto('./');
    const x = await player(page).getAttribute('data-x');
    await page.keyboard.press('ArrowLeft'); // wall in level 1
    await expect(moves(page)).toHaveText('Zetten: 0');
    await expect(player(page)).toHaveAttribute('data-x', x!);
    await expect(page.getByRole('button', { name: 'Ongedaan maken' })).toBeDisabled();
  });

  test('undo and restart buttons restore earlier states', async ({ page }) => {
    await page.goto('./?level=2');
    await expect(page.getByRole('heading', { name: 'Level 2' })).toBeVisible();
    const box = page.getByTestId('box');
    const startBox = { x: await box.getAttribute('data-x'), y: await box.getAttribute('data-y') };

    await playSolution(page, 'dR'); // walk, then push the box right
    await expect(moves(page)).toHaveText('Zetten: 2');
    await expect(box).not.toHaveAttribute('data-x', startBox.x!);

    await page.getByRole('button', { name: 'Ongedaan maken' }).click();
    await expect(moves(page)).toHaveText('Zetten: 1');
    await expect(box).toHaveAttribute('data-x', startBox.x!);

    await page.keyboard.press('ArrowRight');
    await page.getByRole('button', { name: 'Opnieuw beginnen' }).click();
    await expect(moves(page)).toHaveText('Zetten: 0');
    await expect(player(page)).toHaveAttribute('data-x', '1');
    await expect(player(page)).toHaveAttribute('data-y', '1');
    await expect(page.getByRole('button', { name: 'Opnieuw beginnen' })).toBeDisabled();

    // The restart itself can be undone.
    await page.getByRole('button', { name: 'Ongedaan maken' }).click();
    await expect(moves(page)).toHaveText('Zetten: 2');
  });
});

test.describe('touch play (mobile emulation)', () => {
  test.skip(({ isMobile }) => !isMobile, 'touch tests run on the mobile projects');

  /** Sends a real touch swipe through the Chrome DevTools Protocol. */
  async function swipe(page: Page, dx: number, dy: number): Promise<void> {
    const stage = await page.locator('.stage').boundingBox();
    if (!stage) throw new Error('stage not visible');
    const x = stage.x + stage.width / 2;
    const y = stage.y + stage.height / 2;
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    const steps = 8;
    for (let i = 1; i <= steps; i++) {
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: x + (dx * i) / steps, y: y + (dy * i) / steps }],
      });
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await cdp.detach();
  }

  test('one long swipe makes exactly one move and the page never scrolls', async ({ page }) => {
    await page.goto('./');
    await swipe(page, 0, 250); // long swipe down
    await expect(moves(page)).toHaveText('Zetten: 1');
    await expect(player(page)).toHaveAttribute('data-y', '3');
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });

  test('solves level 1 with swipes and taps the next button', async ({ page }) => {
    await page.goto('./');
    for (let i = 0; i < 3; i++) await swipe(page, 120, 0);
    await expect(overlay(page)).toBeVisible();
    await page.getByRole('button', { name: 'Volgende level' }).tap();
    await expect(page.getByRole('heading', { name: 'Level 2' })).toBeVisible();
  });

  test('a short drag is not a move', async ({ page }) => {
    await page.goto('./');
    await swipe(page, 10, 0);
    await expect(moves(page)).toHaveText('Zetten: 0');
  });
});

test.describe('layout', () => {
  for (const [index, definition] of LEVEL_DEFINITIONS.entries()) {
    test(`level ${index + 1} (${definition.id}) fits the screen without scrolling`, async ({
      page,
    }) => {
      await page.goto(`./?level=${index + 1}`);
      const viewport = page.viewportSize()!;
      const board = (await page.getByTestId('board').boundingBox())!;
      expect(board.x).toBeGreaterThanOrEqual(0);
      expect(board.y).toBeGreaterThanOrEqual(0);
      expect(board.x + board.width).toBeLessThanOrEqual(viewport.width + 0.5);
      expect(board.y + board.height).toBeLessThanOrEqual(viewport.height + 0.5);
      // Cells stay large enough to see and swipe on a phone.
      expect(board.width / (await cellColumns(page))).toBeGreaterThanOrEqual(28);

      for (const name of ['Ongedaan maken', 'Opnieuw beginnen']) {
        await expect(page.getByRole('button', { name })).toBeInViewport({ ratio: 1 });
      }
      const scroll = await page.evaluate(() => ({
        height: document.documentElement.scrollHeight,
        width: document.documentElement.scrollWidth,
      }));
      expect(scroll.height).toBeLessThanOrEqual(viewport.height);
      expect(scroll.width).toBeLessThanOrEqual(viewport.width);
    });
  }
});

async function cellColumns(page: Page): Promise<number> {
  return Number(
    await page
      .getByTestId('board')
      .evaluate((el) => getComputedStyle(el).getPropertyValue('--cols')),
  );
}
