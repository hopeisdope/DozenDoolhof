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

test.describe('hints', () => {
  const hintButton = (page: Page) => page.getByTestId('hint-button');
  const layer = (page: Page) => page.getByTestId('hint-layer');
  const closeButton = (page: Page) => page.getByRole('button', { name: 'Hint sluiten' });

  /** Positions of the player and boxes, to prove a hint never changes the board. */
  async function boardState(page: Page): Promise<string> {
    return page
      .getByTestId('board')
      .evaluate((board) =>
        [...board.querySelectorAll<HTMLElement>('.piece')]
          .map((piece) => `${piece.dataset.testid}:${piece.dataset.x},${piece.dataset.y}`)
          .join(' '),
      );
  }

  test('the hint button is finger-sized and on screen, also on phones', async ({ page }) => {
    for (const tier of TIERS) {
      await page.goto(`./?tier=${tier.id}&level=${tier.levels.length}`);
      await expect(hintButton(page)).toBeInViewport({ ratio: 1 });
      await expect(hintButton(page)).toHaveAccessibleName('Hint');
      const box = (await hintButton(page).boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(60);
      expect(box.height).toBeGreaterThanOrEqual(60);
      for (const name of ['Naar de levels', 'Ongedaan maken', 'Opnieuw beginnen']) {
        await expect(page.getByRole('button', { name })).toBeInViewport({ ratio: 1 });
      }
    }
  });

  test('three taps show three ever clearer hints without changing the board', async ({ page }) => {
    await page.goto('./?tier=hard&level=10');
    const before = await boardState(page);
    await expect(layer(page)).toBeHidden();

    await hintButton(page).click();
    await expect(layer(page)).toHaveAttribute('data-stage', '1');
    await expect(layer(page).getByTestId('hint-box')).toHaveCount(1);
    await expect(layer(page).getByTestId('hint-goal')).toHaveCount(1);
    await expect(layer(page).getByTestId('hint-arrow')).toHaveCount(0);
    await expect(layer(page).getByTestId('hint-ghost-player')).toHaveCount(0);
    await expect(closeButton(page)).toBeInViewport({ ratio: 1 });

    await hintButton(page).click();
    await expect(layer(page)).toHaveAttribute('data-stage', '2');
    await expect(layer(page).getByTestId('hint-arrow')).toHaveCount(1);
    await expect(layer(page).getByTestId('hint-ghost-player')).toHaveCount(0);

    await hintButton(page).click();
    await expect(layer(page)).toHaveAttribute('data-stage', '3');
    await expect(layer(page).getByTestId('hint-ghost-player')).toHaveCount(1);
    await expect(layer(page).getByTestId('hint-ghost-box')).toHaveCount(1);
    await expect(layer(page).getByTestId('hint-route')).toHaveCount(1);
    await expect(hintButton(page)).toHaveAccessibleName('Hint nog eens bekijken');

    // A fourth tap replays the preview and stays at stage 3.
    await hintButton(page).click();
    await expect(layer(page)).toHaveAttribute('data-stage', '3');

    expect(await boardState(page)).toBe(before);
    await expect(moves(page)).toHaveText('Zetten: 0');
    await expect(page.getByRole('button', { name: 'Ongedaan maken' })).toBeDisabled();

    await closeButton(page).click();
    await expect(layer(page)).toBeHidden();
    await expect(closeButton(page)).toBeHidden();
    await expect(hintButton(page)).toHaveAccessibleName('Hint');
    expect(await boardState(page)).toBe(before);
  });

  test('the box hint points at a real box and the goal hint at a real goal', async ({ page }) => {
    await page.goto(EASY_1);
    await hintButton(page).click();
    await hintButton(page).click();
    const box = page.getByTestId('box');
    const marker = layer(page).getByTestId('hint-box');
    await expect(marker).toHaveAttribute('data-x', (await box.getAttribute('data-x'))!);
    await expect(marker).toHaveAttribute('data-y', (await box.getAttribute('data-y'))!);
    await expect(layer(page).getByTestId('hint-arrow')).toHaveAttribute('data-direction', 'right');
  });
  test('with reduced motion the preview stands still at its end', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(EASY_1);
    for (let stage = 1; stage <= 3; stage++) await hintButton(page).click();
    const ghost = layer(page).getByTestId('hint-ghost-player');
    await expect(ghost).toHaveCount(1);
    expect(await ghost.evaluate((el) => el.getAnimations().length)).toBe(0);
    // Level 1 is 'rRR': the preview ends with the worker three cells further right.
    expect(await ghost.evaluate((el) => el.style.transform)).toBe('translate(400%, 200%)');
  });
});

test.describe('hints while playing (desktop)', () => {
  test.skip(({ isMobile }) => isMobile, 'keyboard tests run on the desktop project');

  const hintButton = (page: Page) => page.getByTestId('hint-button');
  const layer = (page: Page) => page.getByTestId('hint-layer');
  const notice = (page: Page) => page.getByTestId('hint-notice');

  test('after a hint you can close it and play on normally', async ({ page }) => {
    await page.goto(EASY_1);
    await hintButton(page).click();
    await page.getByRole('button', { name: 'Hint sluiten' }).click();
    await expect(layer(page)).toBeHidden();
    await playSolution(page, solutionOf(0, 0));
    await expect(overlay(page)).toBeVisible();
  });

  test('a move along the hint updates it; another move removes it', async ({ page }) => {
    await page.goto(EASY_1); // solution rRR
    await hintButton(page).click();
    await hintButton(page).click();
    await expect(layer(page).getByTestId('hint-stand')).toHaveCount(1);
    await page.keyboard.press('ArrowRight'); // follows the hint
    await expect(layer(page)).toHaveAttribute('data-stage', '2');
    // The player now stands at the push position: no "stand here" ring any more.
    await expect(layer(page).getByTestId('hint-stand')).toHaveCount(0);
    await page.keyboard.press('ArrowUp'); // its own way
    await expect(layer(page)).toBeHidden();
    await expect(layer(page).locator('*')).toHaveCount(0);
  });

  test('a hint after the player’s own moves is computed for that state', async ({ page }) => {
    await page.goto(EASY_1);
    await playSolution(page, 'ur'); // off the stored solution
    await hintButton(page).click();
    await expect(layer(page)).toHaveAttribute('data-stage', '1');
    await hintButton(page).click();
    await hintButton(page).click();
    await expect(layer(page)).toHaveAttribute('data-stage', '3');
    // The route starts from where the player is now.
    const steps = Number(await layer(page).getByTestId('hint-route').getAttribute('data-steps'));
    expect(steps).toBeGreaterThan(1);
    await expect(moves(page)).toHaveText('Zetten: 2');
  });

  test('undo, restart and a level change leave no old hint behind', async ({ page }) => {
    await page.goto(EASY_1);
    await page.keyboard.press('ArrowUp');
    await hintButton(page).click();
    await expect(layer(page)).toBeVisible();
    await page.getByRole('button', { name: 'Ongedaan maken' }).click();
    await expect(layer(page)).toBeHidden();

    await page.keyboard.press('ArrowUp');
    await hintButton(page).click();
    await expect(layer(page)).toBeVisible();
    await page.getByRole('button', { name: 'Opnieuw beginnen' }).click();
    await expect(layer(page)).toBeHidden();

    await hintButton(page).click();
    await expect(layer(page)).toBeVisible();
    await page.getByRole('button', { name: 'Naar de levels' }).click();
    await page.getByRole('button', { name: /^Level 2, Makkelijk/ }).click();
    await expect(page.getByRole('heading', { name: 'Level 2' })).toBeVisible();
    await expect(layer(page)).toBeHidden();
    await expect(page.getByRole('button', { name: 'Hint sluiten' })).toBeHidden();
    await expect(hintButton(page)).toHaveAccessibleName('Hint');
  });

  test('following the hints to the end wins with full stars; no hint stays on top', async ({
    page,
  }) => {
    await page.goto('./?tier=medium&level=1');
    for (let stage = 1; stage <= 3; stage++) await hintButton(page).click();
    // Play the first move of the stage-3 preview; following it keeps the hint up to date.
    const route = layer(page).getByTestId('hint-route');
    for (let i = 0; i < 200 && (await route.count()) > 0; i++) {
      const preview = (await route.getAttribute('data-preview'))!;
      const before = await moves(page).textContent();
      await page.keyboard.press(ARROW_KEYS[preview[0]!.toLowerCase()]!);
      await expect(moves(page)).not.toHaveText(before!);
    }
    await expect(overlay(page)).toBeVisible();
    await expect(layer(page)).toBeHidden();
    await expect(page.getByRole('button', { name: 'Hint sluiten' })).toBeHidden();
    await expect(page.getByTestId('win-stars')).toHaveAttribute('data-stars', '3');
    const saved = await page.evaluate(() => localStorage.getItem('dozendoolhof.progress'));
    expect(JSON.parse(saved!)).toEqual({ version: 1, bestStars: { 'medium-01': 3 } });
  });

  test('a stuck board gets a friendly notice with undo and restart', async ({ page }) => {
    // easy-31 after one push right: no box is visibly stuck, but the worker can no
    // longer get behind it. Only the hint search can tell.
    await page.goto(`./?tier=easy&level=${positionOf('easy-31')}`);
    await page.keyboard.press('ArrowRight');
    await expect(moves(page)).toHaveText('Zetten: 1');
    await expect(page.getByTestId('stuck-notice')).toBeHidden();
    await hintButton(page).click();
    await expect(notice(page)).toBeVisible();
    await expect(notice(page)).toContainText('Zo lukt het niet meer');
    await expect(layer(page)).toBeHidden();
    await expect(moves(page)).toHaveText('Zetten: 1');

    await page.getByRole('button', { name: 'Eén zet terug' }).click();
    await expect(notice(page)).toBeHidden();
    await expect(moves(page)).toHaveText('Zetten: 0');

    await page.keyboard.press('ArrowRight');
    await hintButton(page).click();
    await expect(notice(page)).toBeVisible();
    await page.getByRole('button', { name: 'Helemaal opnieuw' }).click();
    await expect(notice(page)).toBeHidden();
    await expect(moves(page)).toHaveText('Zetten: 0');
    await expect(page.getByTestId('stuck-notice')).toBeHidden();
  });

  test('h asks for a hint and Escape closes it before leaving the level', async ({ page }) => {
    await page.goto(EASY_1);
    await page.keyboard.press('h');
    await expect(layer(page)).toHaveAttribute('data-stage', '1');
    await page.keyboard.press('Escape');
    await expect(layer(page)).toBeHidden();
    await expect(page.getByTestId('board')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('level-select')).toBeVisible();
  });
});

test.describe('hints by touch (mobile emulation)', () => {
  test.skip(({ isMobile }) => !isMobile, 'touch tests run on the mobile projects');

  test('tapping through the hints and closing them leaves the board as it was', async ({
    page,
  }) => {
    await page.goto(EASY_1);
    for (let stage = 1; stage <= 3; stage++) {
      await page.getByTestId('hint-button').tap();
      await expect(page.getByTestId('hint-layer')).toHaveAttribute('data-stage', String(stage));
    }
    await page.getByRole('button', { name: 'Hint sluiten' }).tap();
    await expect(page.getByTestId('hint-layer')).toBeHidden();
    await expect(moves(page)).toHaveText('Zetten: 0');
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });
});

test.describe('stuck boxes', () => {
  const stuckNotice = (page: Page) => page.getByTestId('stuck-notice');
  const box = (page: Page) => page.getByTestId('box');
  const hintButton = (page: Page) => page.getByTestId('hint-button');
  const hintLayer = (page: Page) => page.getByTestId('hint-layer');
  const hintNotice = (page: Page) => page.getByTestId('hint-notice');
  /** Level 1 of Makkelijk: round the box and push it against the top wall, a dead edge. */
  const PUSH_INTO_EDGE = 'drrU';

  test('a box pushed against a wall without a goal is marked at once', async ({ page }) => {
    await page.goto(EASY_1);
    await playSolution(page, 'drr');
    await expect(box(page)).toHaveAttribute('data-stuck', 'false');
    await expect(stuckNotice(page)).toBeHidden();
    await playSolution(page, 'U');
    await expect(box(page)).toHaveAttribute('data-stuck', 'true');
    await expect(page.getByTestId('stuck-badge')).toBeVisible();
    await expect(stuckNotice(page)).toBeVisible();
    await expect(stuckNotice(page)).toContainText('Deze doos zit vast');
    await expect(stuckNotice(page)).toHaveAttribute('role', 'status');
    // A warning, not a hint, and nothing about the game changed.
    await expect(hintLayer(page)).toBeHidden();
    await expect(hintNotice(page)).toBeHidden();
    await expect(moves(page)).toHaveText('Zetten: 4');
    await expect(page.getByRole('button', { name: 'Ongedaan maken' })).toBeEnabled();
  });

  test('undo takes the warning away; walking on keeps it', async ({ page }) => {
    await page.goto(EASY_1);
    await playSolution(page, PUSH_INTO_EDGE);
    await expect(stuckNotice(page)).toBeVisible();
    // Walking around does not free the box, so the warning stays (and does not repeat).
    await playSolution(page, 'rl');
    await expect(stuckNotice(page)).toBeVisible();
    await expect(stuckNotice(page)).toHaveCount(1);
    await expect(moves(page)).toHaveText('Zetten: 6');
    await page.keyboard.press('z');
    await page.keyboard.press('z');
    await expect(stuckNotice(page)).toBeVisible();
    await stuckNotice(page).getByRole('button', { name: 'Eén zet terug' }).click();
    await expect(stuckNotice(page)).toBeHidden();
    await expect(box(page)).toHaveAttribute('data-stuck', 'false');
    await expect(moves(page)).toHaveText('Zetten: 3');
    await expect(box(page)).toHaveAttribute('data-y', '2');
  });

  test('try again restarts the level, which then plays to a full win', async ({ page }) => {
    await page.goto(EASY_1);
    await playSolution(page, PUSH_INTO_EDGE);
    await stuckNotice(page).getByRole('button', { name: 'Opnieuw proberen' }).click();
    await expect(stuckNotice(page)).toBeHidden();
    await expect(moves(page)).toHaveText('Zetten: 0');
    await expect(box(page)).toHaveAttribute('data-stuck', 'false');
    // The restart itself can be undone, back to the stuck box and its warning.
    await page.keyboard.press('z');
    await expect(stuckNotice(page)).toBeVisible();
    await expect(moves(page)).toHaveText('Zetten: 4');
    await page.getByRole('button', { name: 'Opnieuw beginnen' }).click();
    await expect(stuckNotice(page)).toBeHidden();

    await playSolution(page, solutionOf(0, 0));
    await expect(overlay(page)).toBeVisible();
    await expect(page.getByTestId('win-stars')).toHaveAttribute('data-stars', '3');
    await expect(stuckNotice(page)).toBeHidden();
    const saved = await page.evaluate(() => localStorage.getItem('dozendoolhof.progress'));
    expect(JSON.parse(saved!)).toEqual({ version: 1, bestStars: { 'easy-01': 3 } });
  });

  test('a stuck box saves nothing and costs no stars', async ({ page }) => {
    await page.goto(EASY_1);
    await playSolution(page, PUSH_INTO_EDGE);
    await expect(stuckNotice(page)).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('dozendoolhof.progress'))).toBeNull();
    // Undo all the way back and win: the stars count only the moves of the final state.
    for (let i = 0; i < 4; i++) await page.keyboard.press('z');
    await expect(moves(page)).toHaveText('Zetten: 0');
    await playSolution(page, solutionOf(0, 0));
    await expect(page.getByTestId('win-stars')).toHaveAttribute('data-stars', '3');
  });

  test('a level change leaves no old warning behind', async ({ page }) => {
    await page.goto(EASY_1);
    await playSolution(page, PUSH_INTO_EDGE);
    await expect(stuckNotice(page)).toBeVisible();
    await page.getByRole('button', { name: 'Naar de levels' }).click();
    await page.getByRole('button', { name: 'Level 1, Makkelijk' }).click();
    await expect(moves(page)).toHaveText('Zetten: 0');
    await expect(stuckNotice(page)).toBeHidden();
    await expect(box(page)).toHaveAttribute('data-stuck', 'false');

    await playSolution(page, PUSH_INTO_EDGE);
    await expect(stuckNotice(page)).toBeVisible();
    await page.getByRole('button', { name: 'Naar de levels' }).click();
    await page.getByRole('button', { name: 'Level 2, Makkelijk' }).click();
    await expect(page.getByRole('heading', { name: 'Level 2' })).toBeVisible();
    await expect(stuckNotice(page)).toBeHidden();
    await expect(page.locator('[data-stuck="true"]')).toHaveCount(0);
  });

  test('the hint button points at the stuck box instead of a second message', async ({ page }) => {
    await page.goto(EASY_1);
    // A hint that is showing disappears when the box gets stuck.
    await hintButton(page).click();
    await expect(hintLayer(page)).toHaveAttribute('data-stage', '1');
    await playSolution(page, PUSH_INTO_EDGE);
    await expect(hintLayer(page)).toBeHidden();
    await expect(stuckNotice(page)).toBeVisible();

    await hintButton(page).click();
    await expect(stuckNotice(page)).toHaveClass(/is-nudged/);
    await expect(hintNotice(page)).toBeHidden();
    await expect(hintLayer(page)).toBeHidden();
    await expect(moves(page)).toHaveText('Zetten: 4');

    // After undo the hints work as before: ask, close, ask again.
    await stuckNotice(page).getByRole('button', { name: 'Eén zet terug' }).click();
    await hintButton(page).click();
    await expect(hintLayer(page)).toHaveAttribute('data-stage', '1');
    await page.getByRole('button', { name: 'Hint sluiten' }).click();
    await expect(hintLayer(page)).toBeHidden();
    await hintButton(page).click();
    await expect(hintLayer(page)).toHaveAttribute('data-stage', '1');
    await expect(stuckNotice(page)).toBeHidden();
    await expect(moves(page)).toHaveText('Zetten: 3');
  });

  test('the warning fits beside the board with finger-sized buttons', async ({ page }) => {
    await page.goto(EASY_1);
    await playSolution(page, PUSH_INTO_EDGE);
    await expect(stuckNotice(page)).toBeInViewport({ ratio: 1 });
    const viewport = page.viewportSize()!;
    const board = (await page.getByTestId('board').boundingBox())!;
    const notice = (await stuckNotice(page).boundingBox())!;
    const overlaps =
      notice.x < board.x + board.width &&
      board.x < notice.x + notice.width &&
      notice.y < board.y + board.height &&
      board.y < notice.y + notice.height;
    expect(overlaps).toBe(false);
    expect(board.y + board.height).toBeLessThanOrEqual(viewport.height + 0.5);
    for (const name of ['Eén zet terug', 'Opnieuw proberen']) {
      const button = stuckNotice(page).getByRole('button', { name });
      await expect(button).toBeInViewport({ ratio: 1 });
      const size = (await button.boundingBox())!;
      expect(size.width).toBeGreaterThanOrEqual(60);
      expect(size.height).toBeGreaterThanOrEqual(60);
    }
    for (const name of ['Ongedaan maken', 'Opnieuw beginnen', 'Hint']) {
      await expect(page.getByRole('button', { name, exact: true })).toBeInViewport({ ratio: 1 });
    }
    const scroll = await page.evaluate(() => ({
      y: window.scrollY,
      height: document.documentElement.scrollHeight,
      width: document.documentElement.scrollWidth,
    }));
    expect(scroll.y).toBe(0);
    expect(scroll.height).toBeLessThanOrEqual(viewport.height);
    expect(scroll.width).toBeLessThanOrEqual(viewport.width);
  });

  test('with reduced motion the warning appears without animation', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(EASY_1);
    await playSolution(page, PUSH_INTO_EDGE);
    await expect(stuckNotice(page)).toBeVisible();
    const animations = await page.evaluate(() =>
      ['.stuck-notice', '.piece__stuck', '.piece--box .piece__sprite'].map(
        (selector) => getComputedStyle(document.querySelector(selector)!).animationName,
      ),
    );
    expect(animations).toEqual(['none', 'none', 'none']);
  });
});

test.describe('stuck boxes by touch (mobile emulation)', () => {
  test.skip(({ isMobile }) => !isMobile, 'touch tests run on the mobile projects');

  test('tapping the warning buttons undoes and restarts', async ({ page }) => {
    await page.goto(EASY_1);
    await playSolution(page, 'drrU');
    const notice = page.getByTestId('stuck-notice');
    await expect(notice).toBeVisible();
    await notice.getByRole('button', { name: 'Eén zet terug' }).tap();
    await expect(notice).toBeHidden();
    await expect(moves(page)).toHaveText('Zetten: 3');
    await page.keyboard.press('ArrowUp');
    await expect(notice).toBeVisible();
    await notice.getByRole('button', { name: 'Opnieuw proberen' }).tap();
    await expect(notice).toBeHidden();
    await expect(moves(page)).toHaveText('Zetten: 0');
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
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

      for (const name of ['Ongedaan maken', 'Opnieuw beginnen', 'Hint']) {
        await expect(page.getByRole('button', { name, exact: true })).toBeInViewport({
          ratio: 1,
        });
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
