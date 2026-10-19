import starUrl from '../assets/ui/star.svg';
import type { Tier } from '../levels/definitions';
import { starRow } from './icons';
import type { Progress } from './progress';

/**
 * Start screen: pick a tier (Makkelijk, Gemiddeld, Moeilijk) and one of its twenty
 * levels. Every tier and level is open from the start; there is no tutorial.
 */
export class LevelSelect {
  readonly element = document.createElement('section');
  private readonly tabs: HTMLButtonElement[] = [];
  private readonly grid = document.createElement('ol');
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

    const gridWrap = document.createElement('div');
    gridWrap.className = 'select__levels';
    this.grid.className = 'levels';
    this.grid.id = 'level-grid';
    this.grid.setAttribute('role', 'tabpanel');
    gridWrap.append(this.grid);

    this.element.append(title, tabList, gridWrap);
    this.render();
  }

  /** Shows the given tier; called when returning from a level so the tier stays put. */
  selectTier(index: number): void {
    this.tierIndex = index;
    this.render();
  }

  render(): void {
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
        <span class="tier__done">${done}/${tier.levels.length}</span>`;
    });

    const tier = this.tiers[this.tierIndex];
    if (!tier) return;
    this.grid.className = `levels levels--${tier.id}`;
    this.grid.setAttribute('aria-labelledby', `tier-${tier.id}`);
    this.grid.replaceChildren(
      ...tier.levels.map((level, index) => {
        const done = this.progress.isCompleted(level.id);
        const item = document.createElement('li');
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'level-button';
        button.classList.toggle('is-done', done);
        button.dataset.testid = 'level-button';
        button.setAttribute(
          'aria-label',
          `Level ${index + 1}, ${tier.name}${done ? ', gehaald' : ''}`,
        );
        button.innerHTML = `<span class="level-button__number">${index + 1}</span>${
          done ? `<img class="level-button__star" src="${starUrl}" alt="" />` : ''
        }`;
        button.addEventListener('click', () => this.onPick(this.tierIndex, index));
        item.append(button);
        return item;
      }),
    );
  }
}
