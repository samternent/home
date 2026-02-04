# Stickerbook Pack Themes

This folder documents the pack theme system for stickerbook catalogue generation.

## Directory map

- `apps/ternent-api/stickerbook/themes`: Theme registry and generators.
- `apps/ternent-api/stickerbook/generate-series.mjs`: Generic series generator.
- `apps/concord/src/module/stickerbook/Sticker8Bit.vue`: Renderer for the 8bit theme.
- `apps/concord/src/module/stickerbook/kits/8bit-sprites.json`: Sprite kit data.

## Theme system overview

A pack theme encapsulates deterministic generation plus visual constraints:

- `id`, `name`, `version`
- kit assets (parts) and palettes
- rarity rules (how visuals change by rarity)
- `createCandidate`, `validateCandidate`, `applyRarity`, and fallback logic
- scoring and rejection rules to keep outcomes high-quality

The generator uses deterministic rejection sampling: for candidate index `i`, seed is
`${seriesId}:${i}`. Candidates failing validation or score thresholds are rejected.
Generation stops after `maxAttempts`, then fills remaining slots with a safe fallback.

## 8bit-sprites kit authoring

The 8bit theme uses a curated kit stored in
`apps/concord/src/module/stickerbook/kits/8bit-sprites.json`.

Kit format:

```json
{
  "id": "8bit-sprites",
  "version": "1.0.0",
  "size": 16,
  "palettes": [
    { "id": "arcade", "variant": "base", "colors": ["#...", "#...", "#...", "#..."] }
  ],
  "bodies": [{ "id": "slime", "data": ["................", "....####....", "..."] }],
  "eyes": [{ "id": "dots", "data": ["................", ".....*..*....."] }],
  "accessories": [{ "id": "crown", "data": [".....+..+..+...."] }],
  "frames": [{ "id": "frame-square", "data": ["++++++++++++++++", "+............+"] }],
  "fx": [{ "id": "sparkles", "data": ["....+......+...."] }]
}
```

Sprite encoding:

- `.` = empty
- `#` = foreground
- `*` = shadow
- `+` = highlight

Keep sprites within 16x16 or 24x24 grids. Accessories should touch the body or frame
so component counts stay reasonable. Palettes are 4-color pixel art palettes.

## Rarity behavior

Rarity affects visuals (not just drop rates):

- **common**: body + eyes only
- **uncommon**: subtle frame + small accessory chance
- **rare**: guaranteed accessory + stronger finish (foil/holo)
- **mythic**: mythic palette variant + unique FX overlay + prismatic finish

Rarity finish mapping is defined on the theme, attached to catalogue entries,\n+and used by the pack route.

## Scoring and rejection

The 8bit theme validates candidates using:

- connected components <= 2
- fill ratio within bounds
- contrast minimum between background and foreground
- symmetry minimum
- score threshold (weighted fill/symmetry/contrast)

These values live in `apps/ternent-api/stickerbook/themes/8bit-sprites/theme.mjs`.

## Generating a series

Run:

```bash
node apps/ternent-api/stickerbook/generate-series.mjs
```

Override defaults with env vars:

- `SERIES_ID`
- `SERIES_SEED`
- `THEME_ID`
- `TARGET_COUNT`
- `MAX_ATTEMPTS`
- `OUTPUT_PATH`

## Adding a new theme

1) Create a kit data file (JSON) with palettes + parts.
2) Add a theme module under `apps/ternent-api/stickerbook/themes/<theme-id>/theme.mjs`.
3) Register the theme in `apps/ternent-api/stickerbook/themes/index.mjs`.
4) Implement a renderer component in `apps/concord/src/module/stickerbook/`.
5) Update `WorkspaceStickerbook.vue` to route `catalogue.themeId` to the new renderer.
6) Add tests under `apps/ternent-api/stickerbook/themes/__tests__/`.

## Tests

Run:

```bash
node --test apps/ternent-api/stickerbook/themes/__tests__/8bit-sprites.test.mjs
```
