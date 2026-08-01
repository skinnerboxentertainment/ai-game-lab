# Skill: add-sprite (procedural + pixel-art pipeline)

Add a sprite/asset to a game using the generate-then-convert pipeline. Agents
are bad at producing art directly — route art through this, not through coding
prompts.

## Steps
1. Lock a style manifest (palette hexes, outline rule, size spec) + one master
   reference image. Reuse verbatim in every prompt.
2. Generate on a flat uncommon background color (e.g. `#7B2CFF`) for reliable
   chroma-keying.
3. Generate faux pixel art, then run a lattice **snapper**
   (e.g. spritefusion-pixel-snapper / proper-pixel-art). Prompt:
   `32x32, pixel-perfect pixel art, grid-aligned pixels, sprite for a game asset`.
4. Clean every accepted asset in Aseprite: align to grid, lock palette, strip
   black outlines + semi-transparent edge pixels (every AI pass leaves these).
5. Animate via prompt → Pixel Engine / Nano Banana → sheet; export at 4-5× and
   downscale to kill flicker; hand-fix in Aseprite (~1 min/frame).
6. Prefer 2x2 spritesheets from loose vibe prompts for grunts; locked specs for
   heroes/bosses. Buy hero/icon/UI packs; reserve AI for volume.

## Watch-outs
- AI "pixels" are anti-aliased and off-grid — never nearest-neighbor downscale;
  detect pitch and resample onto a real grid.
- Consistency is a prompt-time problem: camera angle, lighting, color temp
  locked in every prompt, or generations drift.
