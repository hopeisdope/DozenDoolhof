# Worklist

Read at the start of every session; update when something is done or added.

## Now

- [ ] Gebruiker test fase 10 met een kind van 4–6: snapt het kind het handje zonder uitleg,
      tikt het liever dan dat het veegt, en vindt het het volgende level via het
      bouwvakkertje op de knop?
- [ ] Gebruiker test fase 9 op een echt toestel: "Zet op beginscherm" op iPhone en iPad,
      icoon en naam, openen in vliegtuigstand (alle niveaus, hint, kledingkast), en een
      update na een nieuwe deploy (groene knop op het startscherm)
- [ ] Gebruiker beoordeelt fase 8 op een echt toestel: klinken de geluidjes prettig (niet
      irritant bij veel lopen), welke Nederlandse stem kiest iOS en is die verstaanbaar, volgt
      het geluid de stil-schakelaar, en is de stem standaard aan de goede keuze?
- [ ] Gebruiker beoordeelt fase 7: beloningen op de "Gelukt!"-kaart en de kledingkast, op
      iPhone en iPad (vooral: snapt een kind van 4–6 de slotjes en balkjes zonder uitleg, en
      zijn de mijlpalen niet te ver uit elkaar?)
- [ ] Gebruiker beoordeelt fase 6: slotje op een vastgelopen doos en de rode melding met
      "één zet terug" en "opnieuw proberen", op iPhone en iPad (vooral: snapt een kind van
      4–6 het slotje, en is het verschil met de blauwe hint duidelijk?)
- [ ] Gebruiker beoordeelt fase 5: hints in drie stapjes (lampknop), op iPhone en iPad
      (vooral: begrijpt een kind van 4–6 de omlijning, pijl en ghost-preview zonder uitleg?)
- [ ] Gebruiker beoordeelt fase 4 nog op een echt toestel, als dat niet al gebeurd is

## Next

- [ ] Geen fase ingepland: fases 7–10 zijn klaar. De gebruiker kiest de volgende stap na de
      tests op echte toestellen.

## Later (nog niet ingepland)

- [ ] Wereldkaart
- [ ] Eindtest op iPhone en iPad (echte toestellen)

## Open questions

- Moodboard als bestand in de repo zetten (bijv. `docs/art/`) zodat latere sessies het
  kunnen raadplegen? Het staat nu alleen als upload in de fase-0/2-sessie.
- Geluid: nu zelf gesynthetiseerde effecten zonder muziek. Achtergrondmuziek gewenst?
- Interface: Nederlandse tekst of zo veel mogelijk zonder tekst?
- Sterrennorm (3 = hoogstens de zetten van de bekende oplossing, 2 = tot 1,5×) goed voor een
  kind van zes, of milder?
- easy-10 en easy-14 zijn dezelfde puzzel in een andere kamer (zelfde oplossing gespiegeld);
  één vervangen? Dat kost een ID-wijziging of een nieuw ontwerp onder hetzelfde ID.

## Done

- [x] Fase 0: inspectie van de repository en technisch bouwplan
- [x] Fase 1: speelbare basis (engine, parser, 5 testlevels, swipe/toetsen, undo/herstart,
      CI- en deploy-workflow): commit `909f793`, gemerged via PR #1, getest op iPhone
- [x] Fase 2: visuele stijl (SVG-tegels, muur-autotiling, kisten, doelen, bouwvakkertje met
      loop-/duwhouding, glanzende UI), branch `phase-2-visual-assets`
- [x] Levelstructuur (branch `phase-3-level-structure`): 3 niveaus × 20 levels, levelkeuze
      als startscherm, oplosser, validatie van alle 60 levels in de tests
- [x] Fase 4 (branch `phase-4-progress-and-levels`): 120 levels (20 nieuwe per niveau,
      ontworpen met oplosser-gestuurde generator en tussen de bestaande gezet), voortgang en
      sterren in localStorage (versie 1, migratiestructuur, veilig inlezen, terugval op
      geheugen), wisknop met bevestiging
- [x] Fase 5 (branch `phase-5-hints`): optioneel hintsysteem in drie stappen (doos + doel,
      pijl + standplaats, ghost-preview), berekend vanaf de actuele stand met de oplosser in
      een Web Worker; vastgelopen stand geeft een melding met undo/herstart; hints raken
      spelstatus, zetten, sterren en voortgang niet
- [x] Fase 6 (branch `phase-6-deadlock-detection`): vastgelopen dozen automatisch herkend
      (dode cellen en bevroren dozen, alleen bewezen gevallen), slotje op de doos, melding
      naast het bord met undo/opnieuw; hintknop wijst dan naar de melding; geen invloed op
      zetten, sterren of voortgang
- [x] Fase 7 (branch `phase-7-character-rewards`): beloningen voor het bouwvakkertje (4 helmen,
      4 shirts, 3 stickers, 3 stuks gereedschap), ontgrendeld door gehaalde levels, een niveau
      uitspelen of sterren (bonus); afgeleid uit de voortgang, niet apart opgeslagen. Nieuw
      spulletje staat op de "Gelukt!"-kaart en wordt meteen aangetrokken; kledingkast vanaf het
      startscherm met teller voor nieuwe spulletjes; keuze bewaard onder
      `dozendoolhof.wardrobe` (versie 1, defensief ingelezen); wissen wist ook de kast
- [x] Fase 8 (branch `phase-8-sound-feedback`): korte geluidjes via Web Audio (gesynthetiseerd,
      geen bestanden; voetstappen gevarieerd en afgeremd), stem via de ingebouwde Web Speech
      API (alleen Nederlandse stem, alleen bij winst, vastgelopen doos en "zo lukt het niet
      meer"), instellingen Geluiden/Stem apart (`dozendoolhof.settings`), niets vóór het
      eerste gebaar, iOS volgt de stil-schakelaar; overlays respecteren nu reduced motion
- [x] Fase 9 (branch `phase-9-pwa-offline`): installeerbare PWA (manifest en iconen onder
      `/DozenDoolhof/`, iconen uit de eigen art), service worker zonder dependency (precache
      per versie met de exacte buildlijst, navigaties uit de eigen versie, oude cache pas
      weg na de wissel), update-knop op het startscherm, offline getest (e2e) inclusief hints
      en voortgang; iOS-beperkingen gedocumenteerd
- [x] Fase 10 (branch `phase-10-ux-improvements`): drie gerichte verbeteringen na analyse:
      tikbediening (naast het bouwvakkertje = stap/duw, verderop = loop erheen via de
      kortste weg zonder duwen), markering van het volgende level op het startscherm (met
      automatisch scrollen) en een eenmalig handje dat de eerste zet voordoet
- [x] Werkafspraken bijgewerkt (project-start): CLAUDE.md met Session start, "Git: merge to
      main after every commit", End of task en Compact instructions
