import { ICONS, icon, iconButton } from './icons';
import type { SettingName, Settings } from './settings';

const LABELS: Record<SettingName, string> = { sound: 'Geluiden', speech: 'Stem' };
const SWITCH_ICONS: Record<SettingName, string> = { sound: ICONS.sound, speech: ICONS.speech };

/**
 * Sound settings for grown-ups, behind a muted speaker button on the start screen: two big
 * switches, one for the sound effects and one for the voice. The button shows at a
 * glance whether sound is on. Changes are saved at once.
 */
export class SettingsPanel {
  readonly button = iconButton('button--settings', 'Geluid en stem', ICONS.sound);
  readonly element = document.createElement('div');
  private readonly switches = new Map<SettingName, HTMLButtonElement>();
  private readonly note = document.createElement('p');
  private readonly done = iconButton('button--cancel', 'Klaar', ICONS.check);

  constructor(
    private readonly settings: Settings,
    /** Whether the device has a Dutch voice; without one the voice cannot be switched on. */
    private readonly speechAvailable: () => boolean,
  ) {
    this.button.dataset.testid = 'settings-button';
    this.button.addEventListener('click', () => this.open());

    this.element.className = 'overlay';
    this.element.dataset.testid = 'settings';
    this.element.hidden = true;
    this.element.setAttribute('role', 'dialog');
    this.element.setAttribute('aria-modal', 'true');
    this.element.setAttribute('aria-labelledby', 'settings-title');
    const card = document.createElement('div');
    card.className = 'overlay__card settings';
    const title = document.createElement('h2');
    title.className = 'overlay__title settings__title';
    title.id = 'settings-title';
    title.textContent = 'Geluid';
    card.append(title);

    for (const name of ['sound', 'speech'] as const) {
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'setting';
      toggle.dataset.testid = `setting-${name}`;
      toggle.setAttribute('role', 'switch');
      toggle.innerHTML = `<span class="setting__icon">${icon(SWITCH_ICONS[name])}</span>
        <span class="setting__label">${LABELS[name]}</span>
        <span class="setting__track" aria-hidden="true"><span class="setting__knob"></span></span>`;
      toggle.addEventListener('click', () => {
        this.settings.set(name, !this.settings.get(name));
        this.render();
      });
      this.switches.set(name, toggle);
      card.append(toggle);
    }

    this.note.className = 'settings__note';
    this.note.id = 'settings-note';
    this.note.textContent = 'Geen Nederlandse stem op dit apparaat';
    this.done.addEventListener('click', () => this.close());
    card.append(this.note, this.done);
    this.element.append(card);
    this.element.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') this.close();
    });
    this.render();
  }

  open(): void {
    this.render();
    this.element.hidden = false;
    this.switches.get('sound')?.focus();
  }

  close(): void {
    this.element.hidden = true;
    this.button.focus();
  }

  render(): void {
    const sound = this.settings.get('sound');
    this.button.innerHTML = icon(sound ? ICONS.sound : ICONS.soundOff);
    this.button.classList.toggle('is-off', !sound);
    const label = `Geluid en stem${sound ? '' : ', geluid uit'}`;
    this.button.setAttribute('aria-label', label);
    this.button.title = label;

    const voice = this.speechAvailable();
    for (const [name, toggle] of this.switches) {
      const usable = name !== 'speech' || voice;
      toggle.setAttribute('aria-checked', String(usable && this.settings.get(name)));
      toggle.disabled = !usable;
    }
    const speech = this.switches.get('speech');
    if (voice) speech?.removeAttribute('aria-describedby');
    else speech?.setAttribute('aria-describedby', this.note.id);
    this.note.hidden = voice;
  }
}
