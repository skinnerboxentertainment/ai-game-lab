# Sandbox template — LittleJS single-file game

A minimal runnable example of the sandbox track: one self-contained HTML file
with the LittleJS engine vendored next to it. Deterministic seeded layout
(`?seed=`), bounce physics, click-to-spawn particles + procedural sound.

## Run

Open `index.html` directly in a browser (no build, no server). Try
`index.html?seed=7` for a different deterministic layout.

## Engine notes

- `littlejs.js` — vendored engine (from KilledByAPixel/LittleJS `dist/`).
- `LITTLEJS_CLAUDE.md` — the engine's own agent-guidance file; point any coding
  agent at it ("read LITTLEJS_CLAUDE.md before editing").
- Rules from the lab: deterministic seeded RNG; "playable at every step";
  feelings-first specs; keep the whole game in this one file.

## To make a new sandbox game

1. Copy this folder → `../<game-name>/`.
2. Rewrite the script block (keep the deterministic RNG pattern).
3. If the engine version changes, re-copy `littlejs.js` and `LITTLEJS_CLAUDE.md`.
