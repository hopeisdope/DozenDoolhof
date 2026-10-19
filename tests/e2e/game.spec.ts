import { expect, test, type Page } from '@playwright/test';
import { TIERS } from '../../src/levels/definitions';

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

function solutionOf(tierIndex: number, levelIndex: number): string {
  return TIERS[tierIndex]!.definitions[levelIndex]!.solution;
}

const EASY_1 = './?tier=easy&level=1';

const moves = (page: Page) => page.getByTestId('moves');
const player = (page: Page) => page.getByTestId('player');
const overlay = (page: Page) => page.getByTestId('win-overlay');

test.describe('level selection', () => {
  const select = (page: Page) => page.getByTestId('level-select');
  const levelButtons = (page: Page) => page.getByTestId('level-button');

  test('starts at the level selection with three tiers of twenty levels', async ({ page }) => {
    await page.goto('./');
    await expect(select(page)).toBeVisible();
    await expect(page.getByRole('tab')).toHaveCount(3);
    for (const tier of TIERS) {
      await page.getByRole('tab', { name: new RegExp(tier.name) }).click();
      await expect(levelButtons(page)).toHaveCount(20);
      await expect(levelButtons(page).first()).toHaveAccessibleName(`Level 1, ${tier.name}`);
    }
  });

  test('opens a level from every tier and goes back with the levels button', async ({ page }) => {
    await page.goto('./');
    for (const tier of TIERS) {
      await page.getByRole('tab', { name: new RegExp(tier.name) }).click();
      await page.getByRole('button', { name: `Level 5, ${tier.name}` }).click();
      await expect(page.getByRole('heading', { name: 'Level 5' })).toBeVisible();
      await expect(page.getByLabel(tier.name, { exact: true })).toBeVisible();
      await expect(page.getByTestId('board')).toBeVisible();
      await page.getByRole('button', { name: 'Naar de levels' }).click();
      await expect(select(page)).toBeVisible();
      await expect(page.getByRole('tab', { name: new RegExp(tier.name) })).toHaveAttribute(
        'aria-selected',
        'true',
      );
    }
  });

  test('marks a solved level and keeps play working after returning', async ({ page }) => {
    await page.goto('./');
    await levelButtons(page).first().click();
    await expect(player(page)).toHaveAttribute('data-facing', 'down');
    // Level 1 of Makkelijk: three steps to the right solve it.
    for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowRight');
    await expect(overlay(page)).toBeVisible();
    await page.getByRole('button', { name: 'Volgende level' }).click();
    await expect(page.getByRole('heading', { name: 'Level 2' })).toBeVisible();
    await page.getByRole('button', { name: 'Naar de levels' }).click();
    await expect(page.getByRole('button', { name: 'Level 1, Makkelijk, gehaald' })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Makkelijk/ })).toContainText('1/20');
  });

  test('the level grid fits the screen without scrolling', async ({ page }) => {
    await page.goto('./');
    for (const tier of TIERS) {
      await page.getByRole('tab', { name: new RegExp(tier.name) }).click();
      await expect(levelButtons(page).last()).toBeInViewport({ ratio: 1 });
      await expect(levelButtons(page).first()).toBeInViewport({ ratio: 1 });
      const box = (await levelButtons(page).first().boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(44);
    }
    for (const tab of await page.getByRole('tab').all()) {
      await expect(tab).toBeInViewport({ ratio: 1 });
    }
  });
});

test.describe('keyboard play (desktop)', () => {
  test.skip(({ isMobile }) => isMobile, 'keyboard tests run on the desktop project');

  test('plays level 1 to the win screen and continues to level 2', async ({ page }) => {
    await page.goto(EASY_1);
    await expect(page.getByRole('heading', { name: 'Level 1' })).toBeVisible();
    await expect(overlay(page)).toBeHidden();

    await playSolution(page, solutionOf(0, 0));

    await expect(overlay(page)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Gelukt!' })).toBeVisible();
    await expect(page.getByTestId('board')).toHaveAttribute('data-solved', 'true');
    await expect(page.locator('.piece--box.is-on-goal')).toHaveCount(1);

    await page.getByRole('button', { name: 'Volgende level' }).click();
    await expect(page.getByRole('heading', { name: 'Level 2' })).toBeVisible();
    await expect(overlay(page)).toBeHidden();
    await expect(moves(page)).toHaveText('Zetten: 0');
  });

  for (const [tierIndex, tier] of TIERS.entries()) {
    test(`plays through all ${tier.levels.length} levels of ${tier.name}`, async ({ page }) => {
      test.setTimeout(120_000);
      await page.goto(`./?tier=${tier.id}&level=1`);
      for (let index = 0; index < tier.levels.length; index++) {
        await expect(page.getByRole('heading', { name: `Level ${index + 1}` })).toBeVisible();
        await playSolution(page, solutionOf(tierIndex, index));
        await expect(overlay(page)).toBeVisible();
        await page.keyboard.press('Enter');
      }
      // After the last level of a tier the game returns to the level selection,
      // with that tier selected and every level marked as completed.
      await expect(page.getByTestId('level-select')).toBeVisible();
      await expect(page.getByRole('tab', { name: new RegExp(tier.name) })).toHaveAttribute(
        'aria-selected',
        'true',
      );
      await expect(page.locator('.level-button.is-done')).toHaveCount(tier.levels.length);
    });
  }

  test('a blocked move changes nothing', async ({ page }) => {
    await page.goto(EASY_1);
    const x = await player(page).getAttribute('data-x');
    await page.keyboard.press('ArrowLeft'); // wall in level 1
    await expect(moves(page)).toHaveText('Zetten: 0');
    await expect(player(page)).toHaveAttribute('data-x', x!);
    await expect(page.getByRole('button', { name: 'Ongedaan maken' })).toBeDisabled();
  });

  test('the renderer follows the game: facing, push pose, filled goal and walls', async ({
    page,
  }) => {
    await page.goto(EASY_1);
    const board = page.getByTestId('board');
    await expect(board.locator('svg.board__walls path').first()).toBeAttached();
    await expect(player(page)).toHaveAttribute('data-facing', 'down');

    await page.keyboard.press('ArrowUp');
    await expect(player(page)).toHaveAttribute('data-facing', 'up');
    await expect(player(page)).not.toHaveClass(/is-pushing/);

    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');
    await expect(player(page)).toHaveAttribute('data-facing', 'right');
    await page.keyboard.press('ArrowRight'); // push
    await expect(player(page)).toHaveClass(/is-pushing/);
    await expect(board.locator('.tile--goal.is-filled')).toHaveCount(0);

    await page.keyboard.press('ArrowRight'); // box onto the goal
    await expect(board.locator('.tile--goal.is-filled')).toHaveCount(1);
    await expect(page.locator('.piece--box.is-on-goal')).toHaveCount(1);
  });

  test('undo and restart buttons restore earlier states', async ({ page }) => {
    await page.goto('./?tier=easy&level=10'); // "Om de hoek"
    await expect(page.getByRole('heading', { name: 'Level 10' })).toBeVisible();
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
    await page.goto(EASY_1);
    await swipe(page, 0, 250); // long swipe down
    await expect(moves(page)).toHaveText('Zetten: 1');
    await expect(player(page)).toHaveAttribute('data-y', '3');
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });

  test('solves level 1 with swipes and taps the next button', async ({ page }) => {
    await page.goto(EASY_1);
    for (let i = 0; i < 3; i++) await swipe(page, 120, 0);
    await expect(overlay(page)).toBeVisible();
    await page.getByRole('button', { name: 'Volgende level' }).tap();
    await expect(page.getByRole('heading', { name: 'Level 2' })).toBeVisible();
  });

  test('a short drag is not a move', async ({ page }) => {
    await page.goto(EASY_1);
    await swipe(page, 10, 0);
    await expect(moves(page)).toHaveText('Zetten: 0');
  });
});

test.describe('layout', () => {
  const all = TIERS.flatMap((tier) =>
    tier.definitions.map((definition, index) => ({ tier, definition, index })),
  );
  for (const { tier, definition, index } of all) {
    test(`${definition.id} fits the screen without scrolling`, async ({ page }) => {
      await page.goto(`./?tier=${tier.id}&level=${index + 1}`);
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
      await expect(page.getByRole('heading', { name: `Level ${index + 1}` })).toBeInViewport({
        ratio: 1,
      });
      await expect(moves(page)).toBeInViewport({ ratio: 1 });
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
