import starUrl from '../assets/ui/star.svg';
import type { Tier } from '../levels/definitions';
import { ICONS, iconButton, starRow } from './icons';
import type { Progress } from './progress';

/**
 * Start screen: pick a tier (Makkelijk, Gemiddeld, Moeilijk) and one of its levels.
 * Every tier and level is open from the start; there is no tutorial. A muted button
 * below the levels wipes all saved progress after a confirmation.
 */
export class LevelSelect {
  readonly element = document.createElement('section');
  private readonly tabs: HTMLButtonElement[] = [];
  private readonly grid = document.createElement('ol');
  private readonly gridWrap = document.createElement('div');
  private readonly notice = document.createElement('p');
  private readonly resetButton = iconButton('button--reset', 'Voortgang wissen', ICONS.trash);
  private readonly confirm = document.createElement('div');
  private readonly confirmYes = iconButton('button--confirm', 'Ja, alles wissen', ICONS.trash);
  private readonly confirmNo = iconButton('button--cancel', 'Niet wissen', ICONS.close);
  private tierIndex = 0;

  constructor(
    private readonly tiers: readonly Tier[],
    private readonly progress: Progress,
    private readonly onPick: (tierIndex: number, levelIndex: number) => void,
  ) {
    this.element.className = 'screen select';
    this.element.dataset.testid = 'level-select';

    const title = document.createElement('h1');
    title.className = 'select__title';
    title.textContent = 'Dozendoolhof';

    this.notice.className = 'select__notice';
    this.notice.dataset.testid = 'storage-notice';
    this.notice.textContent = 'Voortgang wordt alleen tijdelijk bewaard';

    const tabList = document.createElement('div');
    tabList.className = 'select__tiers';
    tabList.setAttribute('role', 'tablist');
    tabList.setAttribute('aria-label', 'Moeilijkheid');
    tiers.forEach((tier, index) => {
      const tab = document.createElement('button');
      tab.type = 'button';
      tab.className = `tier tier--${tier.id}`;
      tab.id = `tier-${tier.id}`;
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-controls', 'level-grid');
      tab.addEventListener('click', () => this.selectTier(index));
      this.tabs.push(tab);
      tabList.append(tab);
    });

    this.gridWrap.className = 'select__levels';
    this.grid.className = 'levels';
    this.grid.id = 'level-grid';
    this.grid.setAttribute('role', 'tabpanel');
    this.gridWrap.append(this.grid);

    this.resetButton.dataset.testid = 'reset-progress';
    this.resetButton.addEventListener('click', () => this.openConfirm());
    this.buildConfirm();

    this.element.append(title, this.notice, tabList, this.gridWrap, this.resetButton, this.confirm);
    this.render();
  }

  /** Shows the given tier; called when returning from a level so the tier stays put. */
  selectTier(index: number): void {
    if (index !== this.tierIndex) this.gridWrap.scrollTop = 0;
    this.tierIndex = index;
    this.render();
  }

  render(): void {
    this.notice.hidden = this.progress.persistent;
    this.tiers.forEach((tier, index) => {
      const tab = this.tabs[index];
      if (!tab) return;
      const done = this.progress.countCompleted(tier.levels.map((level) => level.id));
      const selected = index === this.tierIndex;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      tab.innerHTML = `
        <span class="tier__name">${tier.name}</span>
        <span class="tier__stars" aria-hidden="true">${starRow(tier.stars, starUrl)}</span>
        <span class="tier__done" data-testid="tier-done">${done}/${tier.levels.length}</span>`;
    });

    const tier = this.tiers[this.tierIndex];
    if (!tier) return;
    this.grid.className = `levels levels--${tier.id}`;
    this.grid.setAttribute('aria-labelledby', `tier-${tier.id}`);
    this.grid.replaceChildren(
      ...tier.levels.map((level, index) => {
        const stars = this.progress.stars(level.id);
        const item = document.createElement('li');
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'level-button';
        button.classList.toggle('is-done', stars > 0);
        button.dataset.testid = 'level-button';
        button.dataset.levelId = level.id;
        button.dataset.stars = String(stars);
        const result =
          stars > 0 ? `, gehaald met ${stars} ${stars === 1 ? 'ster' : 'sterren'}` : '';
        button.setAttribute('aria-label', `Level ${index + 1}, ${tier.name}${result}`);
        button.innerHTML = `<span class="level-button__number">${index + 1}</span>${
          stars > 0
            ? `<span class="level-button__stars" aria-hidden="true">${starRow(stars, starUrl, 3)}</span>`
            : ''
        }`;
        button.addEventListener('click', () => this.onPick(this.tierIndex, index));
        item.append(button);
        return item;
      }),
    );
  }

  private buildConfirm(): void {
    this.confirm.className = 'overlay';
    this.confirm.dataset.testid = 'reset-confirm';
    this.confirm.hidden = true;
    this.confirm.setAttribute('role', 'alertdialog');
    this.confirm.setAttribute('aria-modal', 'true');
    this.confirm.setAttribute('aria-labelledby', 'reset-title');
    this.confirm.innerHTML = `
      <div class="overlay__card confirm">
        <h2 class="overlay__title confirm__title" id="reset-title">Alles wissen?</h2>
        <p class="overlay__moves">Alle sterren en gehaalde levels verdwijnen.</p>
        <div class="confirm__buttons"></div>
      </div>`;
    this.confirm.querySelector('.confirm__buttons')?.append(this.confirmNo, this.confirmYes);
    this.confirmNo.addEventListener('click', () => this.closeConfirm());
    this.confirmYes.addEventListener('click', () => {
      this.progress.clear();
      this.closeConfirm();
      this.render();
    });
    this.confirm.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') this.closeConfirm();
    });
  }

  private openConfirm(): void {
    this.confirm.hidden = false;
    this.confirmNo.focus();
  }

  private closeConfirm(): void {
    this.confirm.hidden = true;
    this.resetButton.focus();
  }
}
