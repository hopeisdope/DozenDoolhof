import { TIERS } from '../levels/definitions';
import {
  itemsInSlot,
  outfitKey,
  SLOTS,
  type ItemId,
  type RewardItem,
  type SlotId,
} from '../rewards/catalog';
import { unlockProgress, type RewardStats, type Rewards } from '../rewards/rewards';
import { heroMarkup, itemIcon } from '../render/hero';
import { ICONS, icon, iconButton } from './icons';

const SLOT_NAMES: Record<SlotId, string> = {
  helmet: 'Helmen',
  shirt: 'Shirts',
  sticker: 'Stickers',
  tool: 'Gereedschap',
};

/** What a locked item still needs, in words, for screen readers and tooltips. */
function requirement(item: RewardItem, stats: RewardStats): string {
  const { unlock } = item;
  switch (unlock.kind) {
    case 'start':
      return '';
    case 'levels': {
      const left = Math.max(unlock.count - stats.levels, 0);
      return `nog ${left} ${left === 1 ? 'level' : 'levels'}`;
    }
    case 'stars': {
      const left = Math.max(unlock.count - stats.stars, 0);
      return `nog ${left} ${left === 1 ? 'ster' : 'sterren'}`;
    }
    case 'tier': {
      const name = TIERS.find((tier) => tier.id === unlock.tier)?.name ?? unlock.tier;
      return `alle levels van ${name}`;
    }
  }
}

/** Restarts a CSS animation by toggling its class across a forced reflow. */
function replay(element: HTMLElement, className: string): void {
  element.classList.remove(className);
  void element.offsetWidth;
  element.classList.add(className);
}

/**
 * The wardrobe: the worker in the middle and every item below, one row per slot. Unlocked
 * items are bright and put on with one tap; locked ones are dark silhouettes with a padlock
 * and a bar that fills up as the player gets closer. Rewards that are new since the last
 * visit sparkle once. Nothing here affects the game itself.
 */
export class WardrobeScreen {
  readonly element = document.createElement('section');
  private readonly preview = document.createElement('div');
  private readonly rows = document.createElement('div');
  private readonly backButton = iconButton('button--levels', 'Naar de levels', ICONS.levels);
  private fresh = new Set<ItemId>();

  constructor(
    private readonly rewards: Rewards,
    private readonly onExit: () => void,
  ) {
    this.element.className = 'screen wardrobe';
    this.element.dataset.testid = 'wardrobe';
    this.element.hidden = true;

    const top = document.createElement('header');
    top.className = 'wardrobe__top';
    const title = document.createElement('h1');
    title.className = 'wardrobe__title';
    title.textContent = 'Kledingkast';
    this.backButton.addEventListener('click', () => this.exit());
    top.append(this.backButton, title);

    const stage = document.createElement('div');
    stage.className = 'wardrobe__stage';
    this.preview.className = 'hero-preview wardrobe__hero';
    this.preview.dataset.testid = 'wardrobe-hero';
    stage.append(this.preview);

    this.rows.className = 'wardrobe__items';
    this.element.append(top, stage, this.rows);

    window.addEventListener('keydown', (event) => {
      if (!this.element.hidden && event.key === 'Escape') this.exit();
    });
  }

  open(): void {
    const unseen = this.rewards.unseen();
    this.fresh = new Set(unseen.map((item) => item.id as ItemId));
    this.rewards.markSeen(unseen);
    this.render();
    this.element.hidden = false;
    this.backButton.focus();
  }

  private exit(): void {
    this.element.hidden = true;
    this.onExit();
  }

  private render(): void {
    const outfit = this.rewards.outfit();
    const stats = this.rewards.stats();
    this.preview.innerHTML = heroMarkup(outfit);
    this.preview.dataset.outfit = outfitKey(outfit);

    this.rows.replaceChildren(
      ...SLOTS.map((slot) => {
        const row = document.createElement('div');
        row.className = 'wardrobe__row';
        row.setAttribute('role', 'group');
        row.setAttribute('aria-label', SLOT_NAMES[slot]);
        row.append(...itemsInSlot(slot).map((item) => this.itemButton(item, stats, outfit[slot])));
        return row;
      }),
    );
  }

  private itemButton(item: RewardItem, stats: RewardStats, worn: ItemId): HTMLButtonElement {
    const id = item.id as ItemId;
    const progress = unlockProgress(item, stats);
    const locked = progress < 1;
    const fresh = this.fresh.has(id);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'item-button';
    button.dataset.testid = 'wardrobe-item';
    button.dataset.item = id;
    button.classList.toggle('is-locked', locked);
    button.classList.toggle('is-new', fresh);
    button.setAttribute('aria-pressed', String(id === worn));

    let label = item.name;
    if (locked) {
      label += `, op slot: ${requirement(item, stats)}`;
      button.setAttribute('aria-disabled', 'true');
    } else if (fresh) {
      label += ', nieuw';
    }
    button.setAttribute('aria-label', label);
    button.title = label;

    button.innerHTML =
      itemIcon(item, locked) +
      (locked
        ? `<span class="item-button__lock" aria-hidden="true">${icon(ICONS.lock)}</span>
           <span class="item-button__progress" aria-hidden="true"><span
             style="width: ${Math.round(progress * 100)}%"></span></span>`
        : '');

    button.addEventListener('click', () => {
      if (locked) {
        replay(button, 'is-denied');
        return;
      }
      if (this.rewards.choose(id)) {
        this.render();
        replay(this.preview, 'is-changed');
        this.rows.querySelector<HTMLElement>(`[data-item="${id}"]`)?.focus();
      }
    });
    return button;
  }
}
