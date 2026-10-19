# Handoff — 2026-10-19

Concise state for reloading into a fresh session. Details are in `WORKLIST.md`.

## State

- Fase 1 (speelbare basis) staat op branch `phase-1-playable-base` (commit `909f793`),
  gepusht; CI is groen. Nog niet gemerged naar `main`, dus nog niet op GitHub Pages.
- Lokaal: 53 unit tests en 33 e2e-tests (Chromium-emulatie) slagen.
- Wacht op beoordeling en expliciete goedkeuring door de gebruiker vóór fase 2.

## Watch out for

- GitHub Pages staat nog uit; de gebruiker moet het zelf aanzetten (Source: GitHub Actions).
- Vite-`base` is `/DozenDoolhof/` (hoofdlettergevoelig); niet wijzigen.
- Er is niet getest op echte iOS/WebKit; alleen Chromium met mobiele emulatie.
- @playwright/test staat vast op 1.56.1 zodat de aanwezige Chromium (build 1194) gebruikt
  wordt; TypeScript op 6.0.x omdat typescript-eslint 7.x nog niet ondersteunt.
- De commit-msg-hook (`.githooks/`) moet per clone aangezet worden:
  `git config core.hooksPath .githooks`.
