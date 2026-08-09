# Skill: kenney-assets

Query the Kenney.nl CC0 asset catalog (212 packs, all tagged) to find the
right packs for a game's sprite/audio/texture needs.

## When to use

When the builder needs to pick game assets — characters, tiles, UI elements,
backgrounds, audio, effects — and doesn't have visual access to the packs.
This skill is the builder's eyes into every Kenney pack.

## Data

The catalog lives in `catalog/catalog.json` (also available as a standalone
copy in this skill directory). Every pack has:

- `slug`, `name` — identifier
- `category` — 2D, 3D, Audio, Textures, Other
- `series` — thematic grouping (e.g. "Pixel Platformer", "Mini")
- `tags` — keywords from Kenney (e.g. `["platformer", "tile", "character"]`)
- `fileCount` — number of files in the pack
- `summary` — brief description
- `downloadUrl` — if available, verified zip download URL

## Query tool

```bash
node catalog/query.mjs <search terms> [flags]
```

### Search (free-text, ranked)

```bash
node catalog/query.mjs platformer tile          # Tile-based platformer packs
node catalog/query.mjs character walk enemy      # Character + enemy sprites
node catalog/query.mjs ui button pixel          # Pixel UI elements
node catalog/query.mjs audio music sfx          # Audio packs
```

The query matches across name, slug, tags, category, and series. Results are
ranked by relevance.

### Filters

| Flag | Effect |
|------|--------|
| `--category 2D\|3D\|Audio\|Textures\|Other` | Filter by category |
| `--tag <tag>` | Exact tag match |
| `--platformer` | Only platformer-relevant packs |
| `--has-download` | Only packs with verified download URLs |
| `--top <n>`, `-n <n>` | Limit results |
| `--json` | Output as JSON (default: Markdown) |

### Examples

```bash
# Top 10 platformer tile packs with downloads
node catalog/query.mjs --platformer --has-download --top 10

# All 2D character packs as JSON
node catalog/query.mjs --tag character --category 2D --json

# Search for dungeon/cave themes
node catalog/query.mjs dungeon cave roguelike
```

## Integration with game building

When a game spec calls for specific asset types:

1. **Translate spec needs to query terms** — "player character with walk animation,
   ground tiles, background" → `"platformer character tile background"`
2. **Run the query** — get ranked packs with tags and file counts
3. **Pick the best pack** — prefer packs with `downloadUrl`, higher file counts,
   matching tags
4. **Tell the user** — "Download Pixel Platformer from kenney.nl (200 files, tags:
   platformer, tile, character). It has player walk cycles, ground tiles, and
   backgrounds."
5. **Map files to game slots** — use filename patterns from the wiring table
   (see wiring section below)

## Asset wiring patterns

When a pack is downloaded, map its files to game slots by filename matching.
Common Kenney filename patterns:

| Game Slot | Kenney Patterns |
|-----------|----------------|
| Player idle | `*_stand`, `*_idle`, `*_front` |
| Player walk | `*_walk1`, `*_walk01`, `*_walk_a` |
| Player jump | `*_jump` |
| Ground tile | `*ground*`, `*grass*`, `*dirt*`, `*stone*`, `*tile*` |
| Platform | `*platform*`, `*box*`, `*crate*`, `*half*` |
| Hazard/spike | `*spike*`, `*lava*`, `*acid*` |
| Background | `*bg*`, `*background*`, `*sky*`, `*parallax*` |
| Enemy | `*enemy*`, `*monster*`, `*creature*`, `*bee*`, `*slime*` |
| Pickup | `*coin*`, `*gem*`, `*key*`, `*heart*`, `*item*` |
| Effect/particle | `*particle*`, `*smoke*`, `*effect*`, `*sparkle*` |

## Watch-outs

- A pack with `downloadUrl` is ready to use; without one, the user needs to
  download manually from kenney.nl.
- 3D packs are `.glb`/`.obj` models, not sprites — don't suggest them for 2D
  games unless the spec calls for 3D.
- Audio packs are `.wav`/`.mp3`/`.ogg` — useful for SFX and music.
- The catalog only covers Kenney.nl CC0 assets. For anything outside that scope,
  fall back to procedural generation (see `skills/add-sprite.md`).
