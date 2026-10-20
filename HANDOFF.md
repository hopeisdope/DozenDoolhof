# Handoff — 2026-10-20

Concise state for reloading into a fresh session. Details are in `WORKLIST.md`.

## State

- Fase 6 klaar op branch `phase-6-deadlock-detection` (gemerged naar `main`; zie de
  git-log). Wacht op beoordeling door de gebruiker; niet aan fase 7 beginnen.
- Detectie: `src/solver/deadlock.ts`, `findStuckBoxes(level, state)` → `{ cell, reason }[]`
  met `reason` `dead-cell` (hergebruikt `liveCells` van de oplosser, per level gecachet) of
  `frozen` (doos op geen enkele as meer te duwen door muren, andere bevroren dozen of omdat
  elke duw op een dode cel eindigt; standaard freeze-deadlock, dozen op het pad tellen als
  muur). Dozen op een doel worden nooit gemarkeerd. Al het andere: geen melding.
- Spelscherm (`src/ui/game-screen.ts`): `updateStuck()` draait alleen als
  `state.boxes` een andere array is (duw, undo/herstart daarvan, levelwissel). Doos krijgt
  `is-stuck`/`data-stuck` en een slotjesbadge (`src/assets/pieces/stuck-badge.svg`) plus
  wiebel; melding `data-testid="stuck-notice"` met "Eén zet terug" en "Opnieuw proberen"
  (bestaande undo/restart).
- Melding staat in een eigen gridrij onder het bord (staand) of in de HUD-kolom (liggend,
  `max-height: 540px`), nooit over het bord; het bord krimpt alleen als er geen ruimte over is.
- Hintknop met een vastgelopen doos: geen zoektocht, maar de melding en de doos wiebelen
  opnieuw (`is-nudged`). Zo verschijnt "Zo lukt het niet meer" nooit tegelijk.
- Validatie: `tests/solver/deadlock.test.ts` verkent tot 4000 bereikbare standen per level
  (alle 120) en controleert elke melding onafhankelijk (dode cel: losse-doos-BFS; bevroren:
  oplosser zegt `unsolvable`); geen melding langs de bekende oplossingen.

## Watch out for

- De bestaande e2e-test "a stuck board gets a friendly notice" gebruikt nu easy-31 na één duw
  naar rechts (onoplosbaar zonder bewezen patroon), omdat de oude stand (easy-01, `drrU`) nu
  door de slotjesmelding wordt afgehandeld.
- Bedieningsknoppen schalen met `clamp(62px, 19vw, 76px)` (liggend: `20vh`).
- Ghost-animatie gebruikt de Web Animations API; met reduced motion staat de ghost stil.
  Reduced motion zet ook badge-, wiebel- en meldinganimaties uit.
- Worker wordt als iife gebouwd en met `type: 'module'` gestart (iOS 15+).
- Alleen getest in Chromium met mobiele emulatie, niet op iOS/WebKit. De melding gebruikt
  `:has()` voor de gridrij (Safari 15.4+).
- easy-10 en easy-14 hebben dezelfde oplossing (gespiegeld); bewuste uitzondering in de test.
- Vite-`base` is `/DozenDoolhof/` (hoofdlettergevoelig); niet wijzigen.
- @playwright/test vast op 1.56.1 (aanwezige Chromium), TypeScript op 6.0.x.
- De commit-msg-hook (`.githooks/`) per clone aanzetten: `git config core.hooksPath .githooks`.
