# PixPax Sticker Spec

## Format

Sticker art is a fixed 16x16 index grid:

- `v`: `1`
- `w`: `16`
- `h`: `16`
- `fmt`: `"idx4"`
- `px`: base64 for 128 bytes (4bpp packed)

Pixel order is row-major (`y` then `x`).

Packing rule:

- two pixels per byte
- `byte = (p0 << 4) | p1`
- `p0` is first pixel, `p1` is second pixel

## Palette ownership model

Palette belongs to **collection/pack**, not sticker.

- each collection defines one `PackPalette16`
- sticker art stores only indices
- render uses `sticker.art + collection.palette`

Palette rules:

- exactly 16 colors
- `colors[0] = 0x00000000` (transparent)
- `colors[1..15]` alpha must be `0xFF`

## Hashing rules

### `artHash`

Hash canonical sticker art only:

- `v,w,h,fmt` header bytes
- decoded index bytes (not base64 string)

Palette changes must not affect `artHash`.

### `paletteHash`

Hash all 16 palette values as raw uint32 values in order.

### `renderHash`

`hash(artHash + paletteHash)` helper for render-level identity.

## Rendering rules

- renderer resolves index -> ARGB through collection palette
- index `0` is transparent and must let card background show through
- canvas renderer must disable smoothing (`imageSmoothingEnabled=false`)
- `image-rendering: pixelated` is required

## Forward compatibility

- future format versions must increment `v`
- old clients should reject unsupported `v`/`fmt`
- additional metadata fields are allowed but must not change canonical hash inputs unless version changes
