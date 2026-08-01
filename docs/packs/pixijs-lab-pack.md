---
name: pixijs-lab
when: "Any work touching rendering, scenes, input, assets, audio, or shaders in the production track."
triggers: "src/**/*.ts, src/**/*.frag, src/**/*.vert, index.html, vite.config.ts"
---

# PixiJS v8 Lab Pack

## When to use
Load at Frame for any visual feature and at Build for any render/input/asset
work. Verify every v8 API against the pinned reference BEFORE writing code —
LLM training data predates v8 API shapes.

## Constraints
- Pin the PixiJS version; verify APIs against a pinned reference snapshot.
- One root `Container` per scene (added on `enter`, destroyed on `exit`); one
  `Application`/ticker/InputManager at app level — never `new Application()` in
  a scene, never per-object ticker registrations, no `setInterval` for gameplay.
- No sprite/texture creation inside hot loops. Pre-allocate, pool, reuse.
- Assets: v8 `Assets` with a manifest + per-scene bundles; never load in
  `update()`; never the v7 `Loader`.
- Input: one InputManager updated before scenes; explicit `hitArea` on every
  interactive container; scenes never register their own DOM listeners.
- Audio init only after a user gesture; music/SFX volumes separate + persisted.
- Shaders: name files `[type]_[category]_[name].[ext]`; document uniforms,
  target platform, complexity budget; WebGL fallback for WebGPU-only features.

## Patterns
- **Scene graph = render hierarchy only.** Group visuals in containers for local
  transform/z-order; explicit push/pop/replace stack ops; cull or lazily create
  off-screen content.
- **Fixed logical viewport:** only the viewport root is scaled/centered; scale
  math uses `renderer.screen` (CSS px), never `renderer.width` (physical).
- **Batching-friendly order:** texture atlases, draw calls grouped, sprites
  sorted by texture; profile before/after optimizations with recorded numbers.
- **Filter-first:** prefer built-in filters over custom shaders; custom GLSL
  only when needed, pinned to WebGL.

## Anti-patterns
- Trusting LLM memory for v8 API shapes (verify, don't assume).
- Allocating textures/sprites per frame; `.text` re-rasterization per frame.
- Per-scene `new Application()` or per-object ticker subscriptions.
- GPU readbacks on main-thread hot paths.

## Checklist
- [ ] PixiJS version pinned; APIs verified against reference.
- [ ] Scene enter/exit balanced; no leaks on scene switch.
- [ ] No allocation in hot loops; pools in place.
- [ ] Assets loaded via manifest/bundles, never in `update()`.
- [ ] Input hitAreas explicit; DOM listeners only at app level.
- [ ] Verify headlessly (`scripts/verify.mjs` screenshot sampling).

## References
`src/core/Viewport.ts` · `src/scenes/ParticleGalaxy.ts` · `docs/ARCHITECTURE.md`

## Escalation
- Renderer architecture changes → orchestrator + ADR.
- Performance budgets → record numbers before/after; pull `qa-evidence`.
- State/render ownership conflicts → pull `state-authority`.
