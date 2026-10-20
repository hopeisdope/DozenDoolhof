# Handoff — 2026-10-20

Concise state for reloading into a fresh session. Details are in `WORKLIST.md`.

## State

- Fase 5 klaar op branch `phase-5-hints` (gemerged naar `main` als de checks groen zijn; zie
  de git-log). Wacht op beoordeling door de gebruiker; niet aan fase 6 beginnen.
- Hints: lampknop rechts in de bedieningsrij (`data-testid="hint-button"`, toets `h`).
  Stap 1 omlijnt de volgende doos en ringt haar doel, stap 2 voegt pijl en standplaats toe,
  stap 3 een ghost-preview (looproute + hoogstens 3 duwen); een vierde tik herhaalt stap 3.
  Sluiten met de ronde X boven het bord (staat buiten `.stage`, want die vangt pointers voor
  swipes) of Escape.
- Logica: `src/hints/hint.ts` (puur), `src/hints/controller.ts` (stappen, verouderde hints
  wissen, late zoekresultaten negeren via token), `src/hints/worker-solver.ts` +
  `solver-worker.ts` (Web Worker, budget 60 000 duwstanden, terugval op de main thread).
  Weergave: `src/render/hint-layer.ts`. Oplosser: `search(level, state, budget)` geeft
  `solved | unsolvable | gave-up`; `solve()` werkt als voorheen.
- Op het pad van de opgeslagen oplossing wordt niet gezocht (directe hint). Een zet die de
  hint volgt werkt hem bij; elke andere zet, undo, herstart, levelwissel of winst wist hem.
- Onoplosbaar: melding "Zo lukt het niet meer" met "Eén zet terug" en "Helemaal opnieuw".
  Budget op: "Even geen hint" (geen verzonnen route).

## Watch out for

- Bedieningsknoppen schalen nu met `clamp(62px, 19vw, 76px)` (liggend: `20vh`) zodat er vier
  op een iPhone SE passen.
- Ghost-animatie gebruikt de Web Animations API; met reduced motion staat de ghost stil op
  het eindpunt.
- Worker wordt als iife gebouwd en met `type: 'module'` gestart (iOS 15+); faalt dat, dan
  rekent de main thread (kort hapergevoel mogelijk bij moeilijke levels).
- Alleen getest in Chromium met mobiele emulatie, niet op iOS/WebKit.
- Nieuwe levels zijn gemaakt met een tijdelijke generator (niet in de repo).
- easy-10 en easy-14 hebben dezelfde oplossing (gespiegeld); bewuste uitzondering in de test.
- Vite-`base` is `/DozenDoolhof/` (hoofdlettergevoelig); niet wijzigen.
- @playwright/test vast op 1.56.1 (aanwezige Chromium), TypeScript op 6.0.x.
- De commit-msg-hook (`.githooks/`) per clone aanzetten: `git config core.hooksPath .githooks`.
