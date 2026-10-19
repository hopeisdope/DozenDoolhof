# Dozendoolhof

Een vrolijke, kindvriendelijke Sokoban-achtige puzzelgame voor iPhone en iPad, gemaakt voor
een kind van zes jaar. Duw de dozen naar de blauwe doelen. Er is geen tijdsdruk en je hoeft
niet te kunnen lezen om te spelen.

> **Status: levelstructuur.** 60 levels in drie niveaus (Makkelijk, Gemiddeld, Moeilijk) van
> elk twintig levels, direct te kiezen vanaf het startscherm, zonder tutorial. Glanzende
> cartoonstijl met een geanimeerd bouwvakkertje. Voortgang wordt nog niet bewaard na herladen.

Speel online: <https://hopeisdope.github.io/DozenDoolhof/>

## Spelen

| Actie            | Touch                                          | Toetsenbord      |
| ---------------- | ---------------------------------------------- | ---------------- |
| Lopen / duwen    | Veeg over het speelveld                        | Pijltjestoetsen  |
| Ongedaan maken   | Knop met de gebogen pijl                       | `z` of Backspace |
| Opnieuw beginnen | Knop met de ronde pijl (ook ongedaan te maken) | `r`              |
| Volgende level   | Groene pijlknop na "Gelukt!"                   | Enter            |
| Naar de levels   | Knop met de vier vakjes                        | Escape           |

Het startscherm toont de drie niveaus en de twintig levels van het gekozen niveau. Een gehaald
level krijgt een ster (alleen tijdens dit bezoek). Een level direct openen kan met
`?tier=medium&level=3` achter de URL (`tier` is `easy`, `medium` of `hard`).

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
  levels/       levelparser, niveaus, leveldefinities per niveau (tiers/), LURD-oplossingen
  solver/       Sokoban-oplosser (valideert levels, meet moeilijkheid)
  assets/       SVG-artwork: tegels, kisten, bouwvakkertje, UI
  render/       DOM-weergave van het bord, muur-autotiling, spelerhouding
  ui/           spelscherm, swipe- en toetsenbordinvoer
  styles/       CSS
  main.ts       startpunt
tests/
  engine/       unit tests voor de spelregels
  levels/       unit tests voor parser en alle 60 levels
  solver/       unit tests voor de oplosser
  e2e/          Playwright-tests
```

## Levels toevoegen

Levels staan per niveau in `src/levels/tiers/easy.ts`, `medium.ts` en `hard.ts`, in het
standaard Sokoban-tekstformaat (`src/levels/definitions.ts` bundelt ze tot niveaus):

| Teken | Betekenis | Teken | Betekenis      |
| ----- | --------- | ----- | -------------- |
| `#`   | muur      | `.`   | doel           |
| ` `   | vloer     | `*`   | doos op doel   |
| `@`   | speler    | `+`   | speler op doel |
| `$`   | doos      |       |                |

Elk level heeft een bekende oplossing in LURD-notatie (`u d l r` = lopen, `U D L R` =
duwen). De tests spelen die oplossing na en laten de oplosser (`src/solver/solver.ts`) elk
level opnieuw oplossen. Ze controleren ook dat er geen dubbele (gedraaide of gespiegelde)
puzzels zijn, dat borden hoogstens 10×10 zijn en dat de niveaus in moeilijkheid oplopen.

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
