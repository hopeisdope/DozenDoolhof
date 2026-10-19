# CLAUDE.md: projectregels voor Dozendoolhof

Dozendoolhof is een Sokoban-achtige puzzelgame voor een kind van 6 jaar, als webapp voor
iPhone en iPad (later een PWA), gehost op GitHub Pages.

## Werkwijze

- Werk in fases. Elke fase krijgt een eigen branch (`phase-N-...`) en wordt pas gemerged na
  goedkeuring door de gebruiker. Begin nooit zelf aan de volgende fase.
- Commit of push niet naar `main` en deploy niet handmatig; deployment gaat alleen via
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
- `src/levels/`: parser voor het Sokoban-tekstformaat, leveldefinities met een bekende
  LURD-oplossing per level.
- `src/render/board.ts`: tegels in een CSS-grid, speler en dozen als absoluut
  gepositioneerde stukken met `transform`. Alles schaalt via container query units; er is geen
  resize-code.
- `src/ui/`: `game-screen.ts` regelt het scherm, `input.ts` swipe (pointer events, één zet
  per gebaar) en toetsenbord.

Houd de engine vrij van DOM-code; de weergave mag later vervangen worden (bijvoorbeeld door
Canvas) zonder de regels te raken.

## Conventies

- Code, identifiers en commentaar in het Engels; UI-teksten en documentatie in het Nederlands.
- Spelen mag geen leesvaardigheid vereisen: knoppen zijn iconen met een `aria-label`.
- Touch-doelen minimaal ~60 pt. Het bord mag de pagina nooit laten scrollen of zoomen.
- Geen backend, accounts, analytics, advertenties of persoonsgegevens.

## Levels

- Formaat: `#` muur, spatie vloer, `@` speler, `$` doos, `.` doel, `*` doos op doel,
  `+` speler op doel. Het level moet volledig door muren omsloten zijn.
- Elk level krijgt een `solution` in LURD (`udlr` lopen, `UDLR` duwen); de tests spelen hem
  na. Houd levels maximaal 10×10, zodat ze op een iPhone passen.

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
- Nieuwe levels moeten slagen in `tests/levels/definitions.test.ts`.
- UI-gedrag (spelen, undo/herstart, swipe, layout op mobiele viewports) wordt gedekt in
  `tests/e2e/game.spec.ts`.
- Voor een commit moeten `npm run check` en `npm run test:e2e` slagen.
