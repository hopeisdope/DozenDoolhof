# Handoff — 2026-10-19

Concise state for reloading into a fresh session. Details are in `WORKLIST.md`.

## State

- `main` bevat fase 1 (speelbare basis), fase 2 (visuele stijl) en de levelstructuur
  (branch `phase-3-level-structure`, op verzoek van de gebruiker gemerged).
- 60 levels: `src/levels/tiers/{easy,medium,hard}.ts`, elk 20. Startscherm is de levelkeuze
  (`src/ui/level-select.ts`); geen tutorial.
- Oplosser in `src/solver/solver.ts`; tests valideren alle levels (oplossing naspelen, oplosser,
  geen duplicaten, maximaal 10×10, oplopende moeilijkheid tussen niveaus).
- Voortgang staat alleen in het geheugen (`src/ui/progress.ts`).
- Wacht op beoordeling door de gebruiker.

## Watch out for

- Levels zijn ontworpen met een tijdelijke hulptool (niet in de repo): kamers met de hand,
  doosposities verkend met de oplosser, keuze en volgorde met de hand.
- Opgeslagen oplossingen komen van de oplosser: minimaal aantal duwen, niet minimaal aantal zetten.
- Vite-`base` is `/DozenDoolhof/` (hoofdlettergevoelig); niet wijzigen.
- Alleen getest in Chromium met mobiele emulatie, niet op iOS/WebKit.
- De e2e-suite telt ~270 tests (o.a. layout van alle 60 levels × 4 viewports); duurt ~1,5 min.
- @playwright/test vast op 1.56.1 (aanwezige Chromium), TypeScript op 6.0.x.
- De commit-msg-hook (`.githooks/`) per clone aanzetten: `git config core.hooksPath .githooks`.
