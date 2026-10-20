# Worklist

Read at the start of every session; update when something is done or added.

## Now

- [ ] Gebruiker beoordeelt fase 4: 120 levels (40 per niveau, nieuwe levels tussen de oude),
      sterren 1–3, bewaarde voortgang en wisknop, op iPhone en iPad

## Next

- [ ] Fase 3: touchbediening en kindvriendelijke UX (tik-om-te-lopen, feedback)
- [ ] Fase 5: wereldkaart en beloningen
- [ ] Fase 6: hints, detectie van vastlopen, moeilijkheidsopbouw
- [ ] Fase 7: PWA, service worker, offline spelen
- [ ] Fase 8: eindtest op iPhone en iPad

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
- [x] Werkafspraken bijgewerkt (project-start): CLAUDE.md met Session start, "Git: merge to
      main after every commit", End of task en Compact instructions
