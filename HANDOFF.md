# Handoff — 2026-10-19

Concise state for reloading into a fresh session. Details are in `WORKLIST.md`.

## State

- Fase 4 klaar op branch `phase-4-progress-and-levels` (gemerged naar `main` als de checks
  groen zijn; zie de git-log).
- 120 levels: `src/levels/tiers/{easy,medium,hard}.ts`, elk 40. ID's `<tier>-01`…`-40` zijn
  stabiel; 01–20 zijn de oude levels, 21–40 nieuw en om en om ertussen gezet. De positie
  (`Level 3`) is dus niet het ID-nummer.
- Voortgang: `src/ui/progress.ts`, `localStorage`-sleutel `dozendoolhof.progress`,
  `{ version: 1, bestStars: { id: 1|2|3 } }`. Migraties via `MIGRATIONS`; data van een
  nieuwere versie wordt niet overschreven; zonder localStorage alleen in het geheugen (met
  melding op het startscherm).
- Sterren: `starsFor(moves, par)`, par = lengte van de opgeslagen oplossing.
- Startscherm: levelraster scrolt binnen zijn eigen vak (40 knoppen), wisknop onderaan.
- Wacht op beoordeling door de gebruiker.

## Watch out for

- Nieuwe levels zijn gemaakt met een tijdelijke generator (niet in de repo): willekeurige
  kamers, plaatsing willekeurig of via omgekeerd zoeken (dozen van de doelen af trekken),
  gefilterd en geordend op oplosserstatistieken, ontdubbeld op kamervorm en oplossing.
- easy-10 en easy-14 hebben dezelfde oplossing (gespiegeld); bewuste uitzondering in de test.
- Opgeslagen oplossingen komen van de oplosser: minimaal aantal duwen, niet minimaal aantal zetten.
- Vite-`base` is `/DozenDoolhof/` (hoofdlettergevoelig); niet wijzigen.
- Alleen getest in Chromium met mobiele emulatie, niet op iOS/WebKit.
- De e2e-suite telt ~560 tests (o.a. layout van alle 120 levels × 4 viewports).
- @playwright/test vast op 1.56.1 (aanwezige Chromium), TypeScript op 6.0.x.
- De commit-msg-hook (`.githooks/`) per clone aanzetten: `git config core.hooksPath .githooks`.
