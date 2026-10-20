# Worklist

Read at the start of every session; update when something is done or added.

## Now

- [ ] Gebruiker beoordeelt fase 5: hints in drie stapjes (lampknop), op iPhone en iPad
      (vooral: begrijpt een kind van 4–6 de omlijning, pijl en ghost-preview zonder uitleg?)
- [ ] Gebruiker beoordeelt fase 4 nog op een echt toestel, als dat niet al gebeurd is

## Next

Gekozen volgorde (projectfases; niet de nummers van de oude featurelijst):

- [ ] Fase 6: vastgelopen dozen herkennen en vriendelijk helpen
- [ ] Fase 7: beloningen voor het bouwvakkertje
- [ ] Fase 8: optionele geluidseffecten en korte gesproken feedback
- [ ] Fase 9: PWA en offline spelen

## Later (nog niet ingepland)

- [ ] Tik-om-te-lopen en extra touchfeedback
- [ ] Wereldkaart
- [ ] Eindtest op iPhone en iPad (echte toestellen)

## Open questions

- Moodboard als bestand in de repo zetten (bijv. `docs/art/`) zodat latere sessies het
  kunnen raadplegen? Het staat nu alleen als upload in de fase-0/2-sessie.
- Geluid en muziek: gewenst, en waar komen ze vandaan?
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
- [x] Werkafspraken bijgewerkt (project-start): CLAUDE.md met Session start, "Git: merge to
      main after every commit", End of task en Compact instructions
