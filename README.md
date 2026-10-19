# Dozendoolhof

Een vrolijke, kindvriendelijke Sokoban-achtige puzzelgame voor iPhone en iPad, gemaakt voor
een kind van zes jaar. Duw de dozen naar de blauwe doelen. Er is geen tijdsdruk en je hoeft
niet te kunnen lezen om te spelen.

> **Status: fase 1 (speelbare basis).** De vormgeving is tijdelijk: eenvoudige CSS-vormen in
> de kleuren van het moodboard. De definitieve graphics volgen in fase 2.

Speel online (zodra GitHub Pages aan staat): <https://hopeisdope.github.io/DozenDoolhof/>

## Spelen

| Actie            | Touch                                          | Toetsenbord      |
| ---------------- | ---------------------------------------------- | ---------------- |
| Lopen / duwen    | Veeg over het speelveld                        | Pijltjestoetsen  |
| Ongedaan maken   | Knop met de gebogen pijl                       | `z` of Backspace |
| Opnieuw beginnen | Knop met de ronde pijl (ook ongedaan te maken) | `r`              |
| Volgende level   | Groene pijlknop na "Gelukt!"                   | Enter            |

Een specifiek level openen kan met `?level=3` achter de URL.

## Lokaal draaien

Vereist: Node.js 22.12 of nieuwer en npm.

```bash
npm ci            # installeer de exacte versies uit package-lock.json
npm run dev       # ontwikkelserver: http://localhost:5173/DozenDoolhof/
```

Op een iPhone of iPad in hetzelfde wifi-netwerk: `npm run dev -- --host` en open het
getoonde netwerkadres (inclusief `/DozenDoolhof/`).

## Commando's

| Commando               | Wat het doet                                                      |
| ---------------------- | ----------------------------------------------------------------- |
| `npm run dev`          | Vite-ontwikkelserver met hot reload                               |
| `npm run build`        | Typecheck + productiebuild naar `dist/`                           |
| `npm run preview`      | De productiebuild lokaal bekijken                                 |
| `npm run lint`         | ESLint                                                            |
| `npm run format`       | Prettier formatteert alle bestanden                               |
| `npm run format:check` | Controleert de opmaak (zoals in CI)                               |
| `npm run typecheck`    | TypeScript zonder output                                          |
| `npm test`             | Unit tests (Vitest): spelregels, parser, oplosbaarheid van levels |
| `npm run test:e2e`     | End-to-endtests (Playwright, Chromium) tegen de productiebuild    |
| `npm run check`        | Lint, opmaak, typecheck, unit tests en build in één keer          |

De e2e-tests draaien in Chromium met desktop-, iPhone SE-, iPhone 15 (liggend)- en
iPad mini-viewports. Dat is **emulatie in Chromium**, geen test in Safari/WebKit op iOS.
Eenmalig Chromium installeren: `npx playwright install chromium`.

## Projectstructuur

```
src/
  engine/       pure spelregels, zonder DOM (state, move, history/undo)
  levels/       levelparser, leveldefinities, LURD-oplossingen
  render/       DOM-weergave van het bord
  ui/           spelscherm, swipe- en toetsenbordinvoer
  styles/       CSS
  main.ts       startpunt
tests/
  engine/       unit tests voor de spelregels
  levels/       unit tests voor parser en levels
  e2e/          Playwright-tests
```

## Levels toevoegen

Levels staan in `src/levels/definitions.ts` in het standaard Sokoban-tekstformaat:

| Teken | Betekenis | Teken | Betekenis      |
| ----- | --------- | ----- | -------------- |
| `#`   | muur      | `.`   | doel           |
| ` `   | vloer     | `*`   | doos op doel   |
| `@`   | speler    | `+`   | speler op doel |
| `$`   | doos      |       |                |

Elk level heeft een bekende oplossing in LURD-notatie (`u d l r` = lopen, `U D L R` =
duwen). De tests spelen die oplossing na, zodat elk level aantoonbaar oplosbaar is.

## Publiceren op GitHub Pages

De workflow `.github/workflows/deploy.yml` bouwt en publiceert de game bij elke push naar
`main`. Eenmalig handmatig instellen:

1. Ga in de repository naar **Settings → Pages**.
2. Kies bij **Source**: **GitHub Actions**.

Daarna verschijnt elke deployment onder **Actions** en in de omgeving `github-pages`. De
Vite-`base` staat op `/DozenDoolhof/` (hoofdlettergevoelig, gelijk aan de repositorynaam).

`.github/workflows/ci.yml` draait lint, opmaakcontrole, typecheck, unit tests, build en
e2e-tests op elke push en pull request.

## Licentie

De code valt onder de [MIT-licentie](LICENSE).
