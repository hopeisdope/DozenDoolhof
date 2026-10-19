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

/** 1-based position of a level in its tier, as shown on the level button. */
function positionOf(id: string): number {
  for (const tier of TIERS) {
    const index = tier.definitions.findIndex((definition) => definition.id === id);
    if (index >= 0) return index + 1;
  }
  throw new Error(`Unknown level ${id}`);
}

const EASY_1 = './?tier=easy&level=1';

const moves = (page: Page) => page.getByTestId('moves');
const player = (page: Page) => page.getByTestId('player');
const overlay = (page: Page) => page.getByTestId('win-overlay');

test.describe('level selection', () => {
  const select = (page: Page) => page.getByTestId('level-select');
  const levelButtons = (page: Page) => page.getByTestId('level-button');

  test('starts at the level selection with three tiers of forty levels', async ({ page }) => {
    await page.goto('./');
    await expect(select(page)).toBeVisible();
    await expect(page.getByRole('tab')).toHaveCount(3);
    for (const tier of TIERS) {
      await page.getByRole('tab', { name: new RegExp(tier.name) }).click();
      await expect(levelButtons(page)).toHaveCount(40);
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
    await expect(
      page.getByRole('button', { name: 'Level 1, Makkelijk, gehaald met 3 sterren' }),
    ).toBeVisible();
    await expect(page.getByRole('tab', { name: /Makkelijk/ })).toContainText('1/40');
  });

  test('the level selection fits the screen; only the level grid scrolls', async ({ page }) => {
    await page.goto('./');
    const viewport = page.viewportSize()!;
    for (const tier of TIERS) {
      await page.getByRole('tab', { name: new RegExp(tier.name) }).click();
      await expect(levelButtons(page).first()).toBeInViewport({ ratio: 1 });
      // Finger-sized buttons, even with forty of them.
      const box = (await levelButtons(page).first().boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(60);
      expect(box.height).toBeGreaterThanOrEqual(60);
      // The last level is reachable by scrolling the grid, and can be opened.
      await levelButtons(page).last().scrollIntoViewIfNeeded();
      await expect(levelButtons(page).last()).toBeInViewport({ ratio: 1 });
      for (const tab of await page.getByRole('tab').all()) {
        await expect(tab).toBeInViewport({ ratio: 1 });
      }
      await expect(page.getByRole('button', { name: 'Voortgang wissen' })).toBeInViewport({
        ratio: 1,
      });
      const scroll = await page.evaluate(() => ({
        y: window.scrollY,
        height: document.documentElement.scrollHeight,
        width: document.documentElement.scrollWidth,
      }));
      expect(scroll.y).toBe(0);
      expect(scroll.height).toBeLessThanOrEqual(viewport.height);
      expect(scroll.width).toBeLessThanOrEqual(viewport.width);
    }
    await levelButtons(page).last().click();
    await expect(page.getByRole('heading', { name: 'Level 40' })).toBeVisible();
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
      test.setTimeout(300_000);
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
      // Every stored solution is good for three stars.
      await expect(page.locator('.level-button[data-stars="3"]')).toHaveCount(tier.levels.length);
      await expect(page.getByRole('tab', { name: new RegExp(tier.name) })).toContainText(
        `${tier.levels.length}/${tier.levels.length}`,
      );
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
    const level = positionOf('easy-10'); // "Om de hoek"
    await page.goto(`./?tier=easy&level=${level}`);
    await expect(page.getByRole('heading', { name: `Level ${level}` })).toBeVisible();
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

test.describe('saved progress (desktop)', () => {
  test.skip(({ isMobile }) => isMobile, 'keyboard tests run on the desktop project');

  const STORAGE_KEY = 'dozendoolhof.progress';
  const tab = (page: Page, name: string) => page.getByRole('tab', { name: new RegExp(name) });
  const levelButton = (page: Page, tierName: string, position: number) =>
    page.getByRole('button', { name: new RegExp(`^Level ${position}, ${tierName}(,|$)`) });

  /** Plays level `position` of a tier by URL and returns to the level selection. */
  async function win(page: Page, tierIndex: number, position: number, prefix = '') {
    const tier = TIERS[tierIndex]!;
    await page.goto(`./?tier=${tier.id}&level=${position}`);
    await expect(page.getByRole('heading', { name: `Level ${position}` })).toBeVisible();
    await playSolution(page, prefix + solutionOf(tierIndex, position - 1));
    await expect(overlay(page)).toBeVisible();
  }

  test('a win shows its stars, is saved at once and survives a reload', async ({ page }) => {
    await win(page, 0, 1);
    await expect(page.getByTestId('win-stars')).toHaveAttribute('data-stars', '3');
    await expect(page.getByTestId('win-stars')).toHaveAccessibleName('3 van de 3 sterren');
    // Saved before leaving the level.
    const saved = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
    expect(JSON.parse(saved!)).toEqual({ version: 1, bestStars: { 'easy-01': 3 } });

    await page.goto('./');
    await page.reload();
    await expect(tab(page, 'Makkelijk')).toContainText('1/40');
    await expect(levelButton(page, 'Makkelijk', 1)).toHaveAttribute('data-stars', '3');
    await expect(levelButton(page, 'Makkelijk', 1)).toHaveAccessibleName(
      'Level 1, Makkelijk, gehaald met 3 sterren',
    );
    await expect(levelButton(page, 'Makkelijk', 2)).toHaveAttribute('data-stars', '0');
    await expect(page.getByTestId('storage-notice')).toBeHidden();
  });

  test('a worse replay keeps the better stars; a better one replaces them', async ({ page }) => {
    // Two detours first: 5 moves for a 3-move level is two stars.
    await win(page, 0, 1, 'ud');
    await expect(page.getByTestId('win-stars')).toHaveAttribute('data-stars', '2');
    await win(page, 0, 1);
    await expect(page.getByTestId('win-stars')).toHaveAttribute('data-stars', '3');
    await win(page, 0, 1, 'udud');
    await expect(page.getByTestId('win-stars')).toHaveAttribute('data-stars', '1');
    await page.goto('./');
    await expect(levelButton(page, 'Makkelijk', 1)).toHaveAttribute('data-stars', '3');
    await expect(tab(page, 'Makkelijk')).toContainText('1/40');
  });

  test('keeps separate progress for all three tiers after a reload', async ({ page }) => {
    await win(page, 0, 2);
    await win(page, 1, 1);
    await win(page, 1, 3);
    await win(page, 2, 40);
    await page.goto('./');
    await page.reload();
    await expect(tab(page, 'Makkelijk')).toContainText('1/40');
    await expect(tab(page, 'Gemiddeld')).toContainText('2/40');
    await expect(tab(page, 'Moeilijk')).toContainText('1/40');
    await expect(page.locator('.level-button.is-done')).toHaveCount(1);
    await expect(levelButton(page, 'Makkelijk', 2)).toHaveClass(/is-done/);
    await tab(page, 'Gemiddeld').click();
    await expect(page.locator('.level-button.is-done')).toHaveCount(2);
    await expect(levelButton(page, 'Gemiddeld', 1)).toHaveClass(/is-done/);
    await expect(levelButton(page, 'Gemiddeld', 3)).toHaveClass(/is-done/);
    await tab(page, 'Moeilijk').click();
    await expect(levelButton(page, 'Moeilijk', 40)).toHaveAttribute('data-stars', '3');
  });

  test('wiping progress asks first, then empties everything', async ({ page }) => {
    await win(page, 0, 1);
    await win(page, 2, 1);
    await page.goto('./');
    const confirm = page.getByTestId('reset-confirm');

    // Cancel keeps everything.
    await page.getByRole('button', { name: 'Voortgang wissen' }).click();
    await expect(confirm).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Alles wissen?' })).toBeVisible();
    await page.getByRole('button', { name: 'Niet wissen' }).click();
    await expect(confirm).toBeHidden();
    await expect(tab(page, 'Makkelijk')).toContainText('1/40');

    // Escape also cancels.
    await page.getByRole('button', { name: 'Voortgang wissen' }).click();
    await page.keyboard.press('Escape');
    await expect(confirm).toBeHidden();
    await expect(tab(page, 'Moeilijk')).toContainText('1/40');

    // Confirm wipes memory and storage.
    await page.getByRole('button', { name: 'Voortgang wissen' }).click();
    await page.getByRole('button', { name: 'Ja, alles wissen' }).click();
    await expect(confirm).toBeHidden();
    for (const name of ['Makkelijk', 'Gemiddeld', 'Moeilijk']) {
      await expect(tab(page, name)).toContainText('0/40');
    }
    await expect(page.locator('.level-button.is-done')).toHaveCount(0);
    expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBeNull();

    await page.reload();
    await expect(tab(page, 'Makkelijk')).toContainText('0/40');
    await expect(tab(page, 'Moeilijk')).toContainText('0/40');
    await expect(page.locator('.level-button.is-done')).toHaveCount(0);
  });

  test('damaged saved data does not break the game', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('./');
    await page.evaluate((key) => localStorage.setItem(key, '{"version":1,"bestS'), STORAGE_KEY);
    await page.reload();
    await expect(tab(page, 'Makkelijk')).toContainText('0/40');
    await win(page, 0, 1);
    await page.goto('./');
    await expect(tab(page, 'Makkelijk')).toContainText('1/40');
    expect(errors).toEqual([]);
  });

  test('without localStorage the game still works and says progress is temporary', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        configurable: true,
        get() {
          throw new DOMException('The operation is insecure.', 'SecurityError');
        },
      });
    });
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('./');
    await expect(page.getByTestId('storage-notice')).toBeVisible();
    await expect(page.getByTestId('storage-notice')).toHaveText(
      'Voortgang wordt alleen tijdelijk bewaard',
    );
    await levelButton(page, 'Makkelijk', 1).click();
    await playSolution(page, solutionOf(0, 0));
    await expect(overlay(page)).toBeVisible();
    await page.getByRole('button', { name: 'Volgende level' }).click();
    await page.getByRole('button', { name: 'Naar de levels' }).click();
    await expect(tab(page, 'Makkelijk')).toContainText('1/40');
    expect(errors).toEqual([]);
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
