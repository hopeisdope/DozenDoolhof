# Handoff — 2026-10-20

Concise state for reloading into a fresh session. Details are in `WORKLIST.md`.

## State

- Fase 8 klaar op branch `phase-8-sound-feedback` (gemerged naar `main`; zie de git-log),
  fase 7 daarvoor. Beide wachten op beoordeling door de gebruiker op een echt toestel.
- Geluid: `src/audio/sounds.ts` (recepten per `Cue`, `SoundPlayer` met lazy AudioContext,
  `unlock()` bij elk gebaar via capture-listeners in `main.ts`, voetstappen max ~11/s),
  `speech.ts` (`Speaker`, alleen Nederlandse stem, `say(text, delay)` annuleert het vorige),
  `feedback.ts` (`AudioFeedback`; het spelscherm roept `moved/blocked/undone/stuck/won/
noWayOut/stop` aan). Instellingen: `src/ui/settings.ts` + `settings-panel.ts` (grijze
  luidsprekerknop in de footer van het startscherm).
- `main.ts` stuurt bij elk gespeeld geluid een `dozendoolhof:sound`-event (testhook).
- Beloningen: `src/rewards/catalog.ts` (16 spulletjes in 4 slots: helm, shirt, sticker,
  gereedschap; per slot één `start`-item = `DEFAULT_OUTFIT`), `rewards.ts` (`Rewards`:
  ontgrendeling afgeleid uit `Progress`, `recordWin()` vervangt `progress.complete()` in het
  spelscherm en geeft nieuwe beloningen terug, trekt ze aan en markeert ze als gezien),
  `wardrobe.ts` (gekozen outfit + gezien, `dozendoolhof.wardrobe` v1, via
  `src/ui/stored-record.ts`).
- Weergave: `src/render/hero.ts` maakt de SVG van het bouwvakkertje met outfit (palette-swap
  van helm/shirt, stickers in `hero__deco`, gereedschap in `hero__tool` in de idle-armen, dus
  weg tijdens duwen; unieke gradient-ID's per kopie). Bord en hint-ghost dragen de outfit;
  `data-outfit` op de speler is de testhook.
- UI: `src/ui/wardrobe.ts` (kledingkast; Escape/levelsknop terug), kledingkastknop met teller
  op het startscherm (staand onderaan links, liggend in een eigen kolom rechts), beloning op
  de "Gelukt!"-kaart (liggend in een tweede kolom; sterren liggend kleiner zodat ze in beeld
  blijven).

## Watch out for

- Spraak is in Chromium/CI niet echt te horen (geen Nederlandse stem); e2e vervangt
  `speechSynthesis`. Op iOS zelf testen. VoiceOver en de eigen stem kunnen tegelijk praten.
- `navigator.audioSession.type = 'ambient'` (Safari 16.4+) laat het geluid de
  stil-schakelaar volgen; ongetest op een echt toestel.
- Unlocks worden niet opgeslagen: voortgang wissen zet alles weer op slot; de kast-sleutel
  wordt dan ook gewist. Een gekozen maar vergrendeld item valt terug op de standaard.
- `player.svg`: de kleuren van de gele helm en het oranje shirt worden door `hero.ts`
  vervangen; gebruik die hexwaarden nergens anders in het bestand (getest).
- Lokale e2e hergebruikt een draaiende `vite preview` op poort 4173 (`reuseExistingServer`);
  stop die eerst, anders test je een oude build.
- Bedieningsknoppen schalen met `clamp(62px, 19vw, 76px)` (liggend: `20vh`).
- Alleen getest in Chromium met mobiele emulatie, niet op iOS/WebKit. Melding gebruikt
  `:has()` (Safari 15.4+); de winkaart liggend ook.
- easy-10 en easy-14 hebben dezelfde oplossing (gespiegeld); bewuste uitzondering in de test.
- Vite-`base` is `/DozenDoolhof/` (hoofdlettergevoelig); niet wijzigen.
- @playwright/test vast op 1.56.1 (aanwezige Chromium), TypeScript op 6.0.x.
- De commit-msg-hook (`.githooks/`) per clone aanzetten: `git config core.hooksPath .githooks`.
