# Dozendoolhof

Een vrolijke, kindvriendelijke Sokoban-achtige puzzelgame voor iPhone en iPad, gemaakt voor
een kind van zes jaar. Duw de dozen naar de blauwe doelen. Er is geen tijdsdruk en je hoeft
niet te kunnen lezen om te spelen.

> **Status: fase 7.** 120 levels in drie niveaus (Makkelijk, Gemiddeld, Moeilijk) van elk
> veertig levels, direct te kiezen vanaf het startscherm, zonder tutorial. Glanzende
> cartoonstijl met een geanimeerd bouwvakkertje. Gehaalde levels en sterren blijven bewaard
> in de browser (localStorage). Een optionele lampknop geeft hints in drie stapjes. Een doos
> die echt vastzit krijgt een slotje, met knoppen voor één zet terug en opnieuw proberen.
> Gehaalde levels leveren helmen, shirts, stickers en gereedschap op voor het bouwvakkertje,
> te kiezen in de kledingkast.

Speel online: <https://hopeisdope.github.io/DozenDoolhof/>

## Spelen

| Actie            | Touch                                           | Toetsenbord      |
| ---------------- | ----------------------------------------------- | ---------------- |
| Lopen / duwen    | Veeg over het speelveld                         | Pijltjestoetsen  |
| Ongedaan maken   | Knop met de gebogen pijl                        | `z` of Backspace |
| Opnieuw beginnen | Knop met de ronde pijl (ook ongedaan te maken)  | `r`              |
| Volgende level   | Groene pijlknop na "Gelukt!"                    | Enter            |
| Naar de levels   | Knop met de vier vakjes                         | Escape           |
| Hint             | Blauwe knop met het lampje (tik nog eens)       | `h`              |
| Hint sluiten     | Ronde grijze knop met het kruisje               | Escape           |
| Kledingkast      | Paarse knop met het bouwvakkertje (startscherm) | Escape = terug   |

Het startscherm toont de drie niveaus en de veertig levels van het gekozen niveau (op een
telefoon scrolt alleen het levelraster). Een gehaald level krijgt één tot drie sterren: drie
voor hoogstens zoveel zetten als de bekende oplossing, twee voor tot anderhalf keer zoveel,
anders één. Het beste resultaat blijft staan; een slechtere herhaling overschrijft het niet.
Een level direct openen kan met `?tier=medium&level=3` achter de URL (`tier` is `easy`,
`medium` of `hard`, `level` is de positie in het niveau).

### Hints

De lampknop is optioneel en kost niets: geen sterren, geen extra zetten. Elke tik geeft
iets meer hulp (de puntjes boven de knop tonen hoeveel):

1. Een gele omlijning om de doos die nu aan de beurt is en een gestippelde ring om het doel
   waar die doos heen moet.
2. Daarbij een pijl op de doos (welke kant op duwen) en een ring waar het bouwvakkertje moet
   gaan staan.
3. Een doorzichtig bouwvakkertje en doosje spelen de volgende zetten voor (looproute met
   stipjes en een paar duwen). Nog een tik speelt het opnieuw af.

De hint voert zelf nooit een zet uit; je blijft gewoon spelen terwijl hij zichtbaar is. Speel
je de getoonde zet, dan schuift de hint mee; doe je iets anders, undo of opnieuw beginnen,
dan verdwijnt hij. De hint wordt berekend vanaf de stand op het bord (in een Web Worker, zodat
het spel niet hapert). Kan het level vanaf hier niet meer worden opgelost, dan verschijnt
"Zo lukt het niet meer" met knoppen voor één zet terug en helemaal opnieuw.

### Vastgelopen dozen

Duw je een doos ergens waar ze nooit meer naar een doel kan, dan krijgt die doos meteen een
rood rondje met een slotje en wiebelt ze even. Onder het bord (liggend: links naast het bord)
verschijnt een rode melding "Deze doos zit vast" met twee grote knoppen: **één zet terug** en
**opnieuw proberen**. Er gebeurt niets vanzelf: je mag gewoon verder spelen, de melding
blokkeert het bord niet en kost geen zetten of sterren. Zodra undo of opnieuw beginnen de doos
bevrijdt, verdwijnt de melding. De lampknop wijst dan naar de melding in plaats van een hint te
zoeken.

De game waarschuwt alleen als het zeker is (bewezen, nooit een gok):

- **Dode cel**: geen enkele reeks duwen brengt een doos vanaf deze cel nog op een doel, zelfs
  op een leeg bord (een hoek zonder doel, of langs een muur waar geen doel aan ligt).
- **Bevroren doos**: de doos kan in geen enkele richting meer bewegen, geblokkeerd door muren
  en door andere dozen die zelf ook vastzitten (twee dozen naast elkaar tegen een muur, een
  blok van 2×2, …), en staat niet op een doel.

Een doos op een doel telt nooit als vastgelopen. Ingewikkeldere gevallen (bijvoorbeeld als het
bouwvakkertje nergens meer achter een doos kan komen) krijgen geen slotje; die vindt de
hintknop met "Zo lukt het niet meer".

### Beloningen en kledingkast

Gehaalde levels leveren spulletjes op voor het bouwvakkertje. Ze zijn alleen om te zien:
ze veranderen niets aan de puzzels, zetten, sterren of hints. Er is niets te kopen en je
kunt niets kwijtraken door te spelen.

- **Direct zichtbaar.** Haalt een winst een nieuw spulletje binnen, dan staat het op de
  "Gelukt!"-kaart (het bouwvakkertje dat het al draagt, plus een plaatje met "Nieuw!") en
  trekt het bouwvakkertje het meteen aan, ook op het bord.
- **Kledingkast.** De paarse knop met het bouwvakkertje onderaan het startscherm (liggend:
  rechts) opent de kledingkast. Een rood bolletje telt de spulletjes die je nog niet hebt
  bekeken. Per rij één soort: helmen, shirts, stickers, gereedschap. Tik op een plaatje om
  het aan te trekken (groen met een witte rand = aan). Wat nog op slot zit is een donker
  silhouet met een slotje en een balkje dat volloopt naarmate je dichterbij komt. De eerste
  knop van elke rij is het oorspronkelijke uiterlijk (bij stickers en gereedschap: niets).

| Spulletje      | Hoe je het krijgt             |
| -------------- | ----------------------------- |
| Stersticker    | 1 level gehaald               |
| Rode helm      | 3 levels                      |
| Hamer          | 5 levels                      |
| Groen shirt    | 8 levels                      |
| Hartjessticker | 12 levels                     |
| Blauwe helm    | 16 levels                     |
| Moersleutel    | 20 levels                     |
| Paars shirt    | 25 levels                     |
| Bloemensticker | 30 levels                     |
| Schep          | alle levels van Makkelijk     |
| Roze shirt     | 100 sterren in totaal (bonus) |
| Gouden helm    | alle levels van Gemiddeld     |

"Levels" telt gehaalde levels over alle niveaus samen. Welke spulletjes vrij zijn wordt niet
apart opgeslagen maar steeds uitgerekend uit de voortgang; wie al levels had gehaald voor er
beloningen waren, krijgt ze dus meteen (met het rode bolletje op de kledingkastknop, maar het
bouwvakkertje trekt ze pas aan als je dat zelf kiest). Nieuwe spulletjes toevoegen: een regel
in `src/rewards/catalog.ts` en een tekening in `src/render/hero.ts`.

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

De kledingkast staat apart onder `dozendoolhof.wardrobe`: wat het bouwvakkertje draagt en
welke beloningen je al hebt gezien.

```json
{ "version": 1, "equipped": { "helmet": "helmet-red" }, "seen": ["helmet-red", "sticker-star"] }
```

Ook hier geldt: onbekende of beschadigde gegevens worden overgeslagen. Draagt het
bouwvakkertje volgens de opslag iets dat (nog) op slot zit, dan krijgt dat onderdeel gewoon
het oorspronkelijke uiterlijk.

Wissen: de grijze prullenbakknop onderaan het startscherm, met een bevestigingsstap; dat
wist de voortgang en de kledingkast. Bekijken of wissen kan ook in DevTools (Application →
Local Storage) of in de console met `localStorage.getItem('dozendoolhof.progress')` en
`localStorage.removeItem('dozendoolhof.progress')` (en zo ook `dozendoolhof.wardrobe`).

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
  solver/       Sokoban-oplosser (valideert levels, meet moeilijkheid, zoekt voor hints)
  hints/        hintkeuze, hintstappen en de oplosser in een Web Worker
  rewards/      beloningen: catalogus, ontgrendeling uit de voortgang, kledingkast-opslag
  assets/       SVG-artwork: tegels, kisten, bouwvakkertje, UI
  render/       DOM-weergave van het bord, muur-autotiling, spelerhouding, hintlaag,
                bouwvakkertje met outfit
  ui/           startscherm, spelscherm, kledingkast, voortgang (localStorage), swipe en
                toetsenbord
  styles/       CSS
  main.ts       startpunt
tests/
  engine/       unit tests voor de spelregels
  levels/       unit tests voor parser en alle 120 levels
  ui/           unit tests voor voortgang (opslag, migratie, beschadigde data)
  solver/       unit tests voor de oplosser
  hints/        unit tests voor hintkeuze en hintstappen
  rewards/      unit tests voor beloningen, ontgrendeling en kledingkast-opslag
  render/       unit tests voor muren, spelerhouding en het bouwvakkertje met outfit
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
