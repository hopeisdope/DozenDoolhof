# CLAUDE.md: projectregels voor Dozendoolhof

Dozendoolhof is een Sokoban-achtige puzzelgame voor een kind van 6 jaar, als webapp voor
iPhone en iPad (later een PWA), gehost op GitHub Pages.

General working agreements are in `~/.claude/CLAUDE.md`. This file adds what is
specific to this project.

## Session start

Read `WORKLIST.md` and `HANDOFF.md` before doing anything else. Run
`git pull` first so you start from the latest `main`.

Every commit must update `WORKLIST.md`/`HANDOFF.md`, reference an issue (`#42`) or carry
`[skip worklist]`; the hook in `.githooks/commit-msg` enforces this once enabled with
`git config core.hooksPath .githooks` (once per clone).

## Git: merge to main after every commit

`main` is the single source of truth, so every session on every device starts
from the same state.

- After every commit, push it. If you are on a branch other than `main`, merge
  it into `main` right away and push `main`:
  `git checkout main && git pull --ff-only && git merge --no-edit <branch> && git push && git checkout <branch>`
- If you are already on `main`, just `git push`.
- If the merge conflicts, the pull is not a fast-forward, or pushing to `main`
  is refused, stop and tell the user. Never force-push, never resolve a conflict
  by discarding someone else's changes.

## Werkwijze

- Werk in fases. Elke fase krijgt een eigen branch (`phase-N-...`); elke commit daarop gaat
  direct naar `main` volgens de Git-sectie hierboven, alleen met groene checks
  (`npm run check` en `npm run test:e2e`). Nooit force-pushen. Begin nooit zelf aan de
  volgende fase.
- Commit niet rechtstreeks op `main` en deploy niet handmatig; deployment gaat alleen via
  `.github/workflows/deploy.yml` bij een push naar `main`.
- Wijzig geen repository-instellingen (Pages, branchbeveiliging) zonder toestemming.
- Rapporteer testresultaten eerlijk. Chromium-emulatie is geen test op iOS.

## Stack

- TypeScript (strict, `noUncheckedIndexedAccess`), Vite, vanilla DOM: geen framework.
- Vitest (unit), Playwright (e2e, alleen Chromium), ESLint, Prettier, npm met
  `package-lock.json`. Dependencies exact gepind; voeg er alleen een toe als het echt nodig is.
- Vite-`base` is `/DozenDoolhof/` (`vite.config.ts`, `BASE_PATH`). Niet wijzigen zonder ook
  Pages en de tests aan te passen.

## Architectuur

- `src/engine/`: pure, onveranderlijke spellogica zonder DOM.
  - `state.ts`: types. Posities zijn celindexen (`y * width + x`); `boxes` is altijd
    oplopend gesorteerd.
  - `move.ts`: `tryMove` geeft `null` bij een geblokkeerde zet.
  - `history.ts`: `Game` met undo-geschiedenis. Een geblokkeerde zet, undo zonder historie of
    een herstart van een onaangeraakt level geeft **hetzelfde object** terug (identiteit =
    "niets veranderd"). Herstart is zelf ongedaan te maken.
- `src/levels/`: parser voor het Sokoban-tekstformaat; `definitions.ts` bundelt de niveaus
  (`TIERS`: Makkelijk, Gemiddeld, Moeilijk) uit `tiers/easy.ts`, `medium.ts` en `hard.ts`,
  elk veertig levels met een bekende LURD-oplossing. ID's (`easy-01`…`easy-40`) zijn stabiel
  en sleutel van de voortgang; de volgorde in het bestand is de speelvolgorde.
- `src/solver/solver.ts`: BFS-oplosser over duwen (fewest pushes), met dode-cel-snoei.
  `search()` zoekt vanaf elke spelstatus (opgelost / onoplosbaar / budget op); gebruikt
  door de tests en de hints.
- `src/hints/`: `hint.ts` (pure hintkeuze uit een oplossing), `controller.ts` (hintstappen
  1–3, wist verouderde hints, negeert late zoekresultaten; zonder DOM) en
  `worker-solver.ts`/`solver-worker.ts` (oplosser in een Web Worker, terugval op de main
  thread). Hints veranderen nooit de spelstatus, zetten, sterren of voortgang.
- `src/render/board.ts`: vloer- en doeltegels in een CSS-grid, daarboven één muurlaag (SVG),
  speler en dozen als absoluut gepositioneerde stukken met `transform`. Alles schaalt via
  container query units; er is geen resize-code.
- `src/render/walls.ts`: muur-autotiling. Elke muurcel wordt een baksteen waarvan de vorm
  afhangt van de vier buren (voeg naar een muur, dikke contour naar buiten, grote bocht op de
  buitenhoek). Pure functies, getest in `tests/render/`.
- `src/solver/deadlock.ts`: `findStuckBoxes()` vindt dozen die bewezen nooit meer op een
  doel komen: dode cellen (`liveCells` van de oplosser) en bevroren dozen (geblokkeerd door
  muren en andere bevroren dozen, niet op een doel). Bij twijfel geen melding. Het spelscherm
  rekent alleen opnieuw als de `boxes`-array verandert; de melding (`stuck-notice`) staat
  naast het bord, nooit eroverheen, en verandert de spelstatus niet.
- `src/render/hint-layer.ts`: tekent hints boven het bord (omlijning, doelring, pijl,
  ghost-preview); `pointer-events: none`.
- `src/render/motion.ts`: leidt kijkrichting, loopanimatie en duwhouding af uit twee
  opeenvolgende spelstatussen (ook bij undo en herstart).
- `src/assets/`: handgemaakte SVG's. Tegels en kisten zijn CSS-achtergronden; `player.svg`
  wordt inline geladen (`?raw`) zodat CSS de onderdelen kan animeren (`.hero__*`-klassen).
- `src/ui/`: `level-select.ts` is het startscherm (niveau en level kiezen), `game-screen.ts`
  het spelscherm, `progress.ts` de voortgang (sterren per level-ID in `localStorage`, versie +
  migraties, valt terug op geheugen), `input.ts` swipe
  (pointer events, één zet per gebaar) en toetsenbord, `icons.ts` gedeelde iconen.

Houd de engine vrij van DOM-code; de weergave mag later vervangen worden (bijvoorbeeld door
Canvas) zonder de regels te raken.

## Conventies

- Code, identifiers en commentaar in het Engels; UI-teksten en documentatie in het Nederlands.
- Art direction: glanzende cartoonstijl, dikke donkerbruine contouren (`#3b1d0e`/`#4a1606`),
  licht van linksboven, schaduwen naar rechtsonder. Geen CSS-filters op spelobjecten (iOS),
  geen emoji als asset, geen externe afbeeldingen; assets blijven binnen hun tegel.
- Spelen mag geen leesvaardigheid vereisen: knoppen zijn iconen met een `aria-label`.
- Touch-doelen minimaal ~60 pt. Het bord mag de pagina nooit laten scrollen of zoomen.
- Geen backend, accounts, analytics, advertenties of persoonsgegevens.

## Levels

- Formaat: `#` muur, spatie vloer, `@` speler, `$` doos, `.` doel, `*` doos op doel,
  `+` speler op doel. Het level moet volledig door muren omsloten zijn.
- Elk level krijgt een `solution` in LURD (`udlr` lopen, `UDLR` duwen); de tests spelen hem
  na en de oplosser moet het level ook oplossen. Houd levels maximaal 10×10, zodat ze op een
  iPhone passen. Geen dubbele puzzels, ook niet gedraaid of gespiegeld (getest).
- Niveaus: Makkelijk 1–2 dozen en korte routes; Gemiddeld 1–2 dozen, langere routes en
  volgorde; Moeilijk 2–4 dozen en echte planning. Binnen een niveau oplopend in moeilijkheid
  (beoordeeld op duwen, richtingswisselingen, looproute en zoekruimte van de oplosser).

## Commando's

```bash
npm ci                 # installeren
npm run dev            # http://localhost:5173/DozenDoolhof/
npm run check          # lint + format:check + typecheck + unit tests + build
npm run test:e2e       # Playwright (bouwt en start zelf `vite preview`)
npm run format         # Prettier toepassen
```

## Testvereisten

- Elke wijziging aan de spelregels krijgt unit tests in `tests/engine/`.
- Elke parserwijziging krijgt tests voor geldige en ongeldige input in `tests/levels/`.
- Nieuwe levels moeten slagen in `tests/levels/definitions.test.ts` en in
  `tests/solver/deadlock.test.ts` (geen vastgelopen-melding op een oplosbare stand).
- UI-gedrag (spelen, undo/herstart, swipe, layout op mobiele viewports) wordt gedekt in
  `tests/e2e/game.spec.ts`.
- Voor een commit moeten `npm run check` en `npm run test:e2e` slagen.

## Debugging

- Er is geen backend, geen logbestand en (nog) geen datastore. Fouten verschijnen in de
  browserconsole (DevTools; op iOS via Safari → Ontwikkel → het toestel).
- Een e2e-fout laat een trace achter in `test-results/`: `npx playwright show-trace <pad>/trace.zip`.
  In CI staat het Playwright-rapport als artifact `playwright-report` bij een mislukte run.
- Een level direct openen: `?tier=easy|medium|hard&level=N` achter de URL.
- Voortgang staat in `localStorage` onder `dozendoolhof.progress`. Bekijken: DevTools →
  Application → Local Storage, of `localStorage.getItem('dozendoolhof.progress')`. Wissen: de
  prullenbakknop op het startscherm of `localStorage.removeItem('dozendoolhof.progress')`.

## End of task

When a task is finished (tests pass, work committed):

1. Update `HANDOFF.md` (state, open issues, next step) and tick off `WORKLIST.md`.
2. Commit, merge to `main` and push as described above.
3. End your reply with: `✅ Done. Safe to /clear or start a fresh session.`

Do not start the next unrelated task in the same context; the user clears first.

## Compact instructions

When compacting, keep only decisions, changed file paths and open problems.
Drop tool output and exploration.
