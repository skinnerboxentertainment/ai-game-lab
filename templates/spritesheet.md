# Spritesheet spec template

Generate a spritesheet for an AI game with a locked style. Keep every sheet
under 1920px wide (hosts silently downscale wider sheets).

## Prompt block

> Create a single isolated [SUBJECT] as a micro-scale [GENRE] RPG overworld
> sprite. Low-resolution pixel art, compact full-body silhouette, front-facing or
> slight 3/4 stance, limited color palette, dark pixel outline, minimal 1-2 step
> shading, crisp square pixels, no painterly blur or smooth gradients. Readable
> at small sizes, simple anatomy, not chibi, not illustration-like. Subject
> details: [EXACT DESIGN]. Composition: one full-body sprite, centered, standing
> pose, clean edges, no extra characters, no scenery, plain solid high-contrast
> background so the sprite can be easily separated.

## Animation sheet

> For each action specify: frame count per action, layout (e.g. `2×4, horizontal
> arrangement`), background: transparent, style/palette (e.g. `16-bit,
> low-saturation dark colors`). Multi-action sheets as sequential blocks.

## 8-direction sheet

> 3×3 grid with empty center; 8 full-body views each facing outward away from
> the center (top-center = back to top edge, bottom-center = front to bottom
> edge). Do not mirror or duplicate views; diagonal views must be true diagonal
> rotations. No text, labels, arrows, or UI.

## Post-generation

1. Run through a lattice snapper (pixel pitch + k-means quantize).
2. Aseprite cleanup: grid align, palette lock, strip edges.
3. Export at 4-5× nearest-neighbor; check delivered pixel size on the real host
   (1920px downscale trap).
