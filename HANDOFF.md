# Handoff — 2026-10-19

Concise state for reloading into a fresh session. Details are in `WORKLIST.md`.

## State

- Fase 1 is gemerged naar `main` (PR #1) en door de gebruiker getest op iPhone.
- Fase 2 (visuele stijl) is gebouwd op `phase-2-visual-assets` en naar `main` gemerged op
  verzoek van de gebruiker. GitHub Pages staat aan; deploy gaat via `deploy.yml`.
- Artwork: handgemaakte SVG's in `src/assets/`; muren worden per level gegenereerd door
  `src/render/walls.ts`; spelerhouding komt uit `src/render/motion.ts`.
- Wacht op beoordeling door de gebruiker vóór fase 3.

## Watch out for

- Vite-`base` is `/DozenDoolhof/` (hoofdlettergevoelig); niet wijzigen.
- Alleen getest in Chromium met mobiele emulatie, niet op iOS/WebKit.
- Kleine SVG's worden door Vite als data-URL in de CSS gezet (assetsInlineLimit); dat is
  bewust zo gelaten.
- De HUD moet op 320 px breed passen; de e2e-layouttest controleert dat.
- @playwright/test vast op 1.56.1 (aanwezige Chromium), TypeScript op 6.0.x.
- De commit-msg-hook (`.githooks/`) per clone aanzetten: `git config core.hooksPath .githooks`.
