# Worklist

Read at the start of every session; update when something is done or added.

## Now

- [ ] Gebruiker beoordeelt de levelstructuur: 60 levels, moeilijkheid per niveau, levelkeuze
      op iPhone en iPad

## Next

- [ ] Fase 3: touchbediening en kindvriendelijke UX (tik-om-te-lopen, feedback)
- [ ] Voortgang duurzaam bewaren (localStorage met versienummer en migratie); nu alleen in
      het geheugen, gaat verloren bij herladen
- [ ] Fase 5: wereldkaart en beloningen (sterren per level)
- [ ] Fase 6: hints, detectie van vastlopen, moeilijkheidsopbouw
- [ ] Fase 7: PWA, service worker, offline spelen
- [ ] Fase 8: eindtest op iPhone en iPad

## Open questions

- Moodboard als bestand in de repo zetten (bijv. `docs/art/`) zodat latere sessies het
  kunnen raadplegen? Het staat nu alleen als upload in de fase-0/2-sessie.
- Geluid en muziek: gewenst, en waar komen ze vandaan?
- Interface: Nederlandse tekst of zo veel mogelijk zonder tekst?

## Done

- [x] Fase 0: inspectie van de repository en technisch bouwplan
- [x] Fase 1: speelbare basis (engine, parser, 5 testlevels, swipe/toetsen, undo/herstart,
      CI- en deploy-workflow): commit `909f793`, gemerged via PR #1, getest op iPhone
- [x] Fase 2: visuele stijl (SVG-tegels, muur-autotiling, kisten, doelen, bouwvakkertje met
      loop-/duwhouding, glanzende UI), branch `phase-2-visual-assets`
- [x] Levelstructuur (branch `phase-3-level-structure`): 3 niveaus × 20 levels, levelkeuze
      als startscherm, oplosser, validatie van alle 60 levels in de tests
