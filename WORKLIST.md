# Worklist

Read at the start of every session; update when something is done or added.

## Now

- [ ] Gebruiker beoordeelt fase 1 (branch `phase-1-playable-base`)
- [ ] GitHub Pages aanzetten: Settings → Pages → Source: GitHub Actions (gebruiker)
- [ ] Na goedkeuring: `phase-1-playable-base` naar `main` mergen, eerste deploy controleren
- [ ] Fase 1 testen op een echte iPhone en iPad (swipen, niet scrollen/zoomen in Safari)

## Next

- [ ] Fase 2: visuele stijl en game-assets (moodboard, wandtegels met autotiling, bouwvakkertje)
- [ ] Fase 3: touchbediening en kindvriendelijke UX (tik-om-te-lopen, feedback)
- [ ] Fase 4: levelontwerp en puzzelcontrole (oplosser, ~30 levels, validatie in CI)
- [ ] Fase 5: wereldkaart, sterren en voortgang in localStorage
- [ ] Fase 6: hints, detectie van vastlopen, moeilijkheidsopbouw
- [ ] Fase 7: PWA, service worker, offline spelen
- [ ] Fase 8: eindtest op iPhone en iPad

## Open questions

- Hoe worden de assets gemaakt: SVG in code, AI-afbeeldingen (ImageGen-koppeling nog niet
  geautoriseerd) of een mix? Nodig vóór fase 2.
- Geluid en muziek: gewenst, en waar komen ze vandaan?
- Interface: Nederlandse tekst of zo veel mogelijk zonder tekst?

## Done

- [x] Fase 0: inspectie van de repository en technisch bouwplan
- [x] Fase 1: speelbare basis (engine, parser, 5 testlevels, swipe/toetsen, undo/herstart,
      CI- en deploy-workflow): commit `909f793`, CI groen
