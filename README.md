# Dozendoolhof

Een vrolijke, kindvriendelijke Sokoban-achtige puzzelgame voor iPhone en iPad, gemaakt voor
een kind van zes jaar. Duw de dozen naar de blauwe doelen. Er is geen tijdsdruk en je hoeft
niet te kunnen lezen om te spelen.

> **Status: fase 4.** 120 levels in drie niveaus (Makkelijk, Gemiddeld, Moeilijk) van elk
> veertig levels, direct te kiezen vanaf het startscherm, zonder tutorial. Glanzende
> cartoonstijl met een geanimeerd bouwvakkertje. Gehaalde levels en sterren blijven bewaard
> in de browser (localStorage).

Speel online: <https://hopeisdope.github.io/DozenDoolhof/>

## Spelen

| Actie            | Touch                                          | Toetsenbord      |
| ---------------- | ---------------------------------------------- | ---------------- |
| Lopen / duwen    | Veeg over het speelveld                        | Pijltjestoetsen  |
| Ongedaan maken   | Knop met de gebogen pijl                       | `z` of Backspace |
| Opnieuw beginnen | Knop met de ronde pijl (ook ongedaan te maken) | `r`              |
| Volgende level   | Groene pijlknop na "Gelukt!"                   | Enter            |
| Naar de levels   | Knop met de vier vakjes                        | Escape           |

Het startscherm toont de drie niveaus en de veertig levels van het gekozen niveau (op een
telefoon scrolt alleen het levelraster). Een gehaald level krijgt één tot drie sterren: drie
voor hoogstens zoveel zetten als de bekende oplossing, twee voor tot anderhalf keer zoveel,
anders één. Het beste resultaat blijft staan; een slechtere herhaling overschrijft het niet.
Een level direct openen kan met `?tier=medium&level=3` achter de URL (`tier` is `easy`,
`medium` of `hard`, `level` is de positie in het niveau).

### Voortgang

De voortgang staat in `localStorage` onder de sleutel `dozendoolhof.progress`, per stabiele
level-ID (bijvoorbeeld `easy-07`) en met een versienummer:

```json
{ "version": 1, "bestStars": { "easy-01": 3, "medium-12": 2 } }
```

Een level telt als gehaald als het een sterrenwaarde heeft. Beschadigde of ongeldige gegevens
laten de game niet vastlopen: ongeldige regels worden overgeslagen, onleesbare opslag geldt
als lege voortgang. Gegevens van een nieuwere versie worden nooit overschreven. Zonder
werkende `localStorage` (bijvoorbeeld geblokkeerd) speelt de game gewoon en meldt het
startscherm dat de voortgang alleen tijdelijk wordt bewaard.

Wissen: de grijze prullenbakknop onderaan het startscherm, met een bevestigingsstap.
Bekijken of wissen kan ook in DevTools (Application → Local Storage) of in de console met
`localStorage.getItem('dozendoolhof.progress')` en `localStorage.removeItem('dozendoolhof.progress')`.

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
  ui/           startscherm, spelscherm, voortgang (localStorage), swipe en toetsenbord
  styles/       CSS
  main.ts       startpunt
tests/
  engine/       unit tests voor de spelregels
  levels/       unit tests voor parser en alle 120 levels
  ui/           unit tests voor voortgang (opslag, migratie, beschadigde data)
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
puzzels zijn, ook niet met dezelfde (gedraaide of gespiegelde) oplossing in een andere kamer,
dat borden hoogstens 10×10 zijn en dat de moeilijkheid tussen en binnen de niveaus oploopt.

Level-ID's zijn stabiel en de voortgang hangt eraan: verander of hergebruik nooit een ID. De
positie in het niveau mag wel veranderen. `easy-01` t/m `easy-20` zijn de oorspronkelijke
levels; `easy-21` t/m `easy-40` (en zo ook voor `medium` en `hard`) zijn in fase 4 toegevoegd
en staan ertussen, zodat de moeilijkheid geleidelijk oploopt.

Wijzigt het opslagformaat ooit, verhoog dan `STORAGE_VERSION` in `src/ui/progress.ts` en voeg
een stap toe aan `MIGRATIONS` (oude versie → nieuwe versie), met een test.

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
