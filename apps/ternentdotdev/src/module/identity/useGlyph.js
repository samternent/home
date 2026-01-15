import { ref, computed, watch, unref } from "vue";

const GRID_SIZE = 11;
const HALF_GRID = Math.ceil(GRID_SIZE / 2);

function toBytes(value) {
  return new TextEncoder().encode(value);
}

function toUint32Bytes(value) {
  const buffer = new ArrayBuffer(4);
  const view = new DataView(buffer);
  view.setUint32(0, value >>> 0);
  return new Uint8Array(buffer);
}

function concatBytes(...arrays) {
  const total = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

async function hashBytes(alg, bytes) {
  const digest = await crypto.subtle.digest(alg, bytes);
  return new Uint8Array(digest);
}

async function expandBytes(seed, needed) {
  const chunks = [];
  let total = 0;
  let counter = 0;
  while (total < needed) {
    const block = await hashBytes(
      "SHA-512",
      concatBytes(seed, toUint32Bytes(counter))
    );
    chunks.push(block);
    total += block.length;
    counter += 1;
  }
  return concatBytes(...chunks).slice(0, needed);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function hslToRgb(h, s, l) {
  const sat = s / 100;
  const light = l / 100;
  const c = (1 - Math.abs(2 * light - 1)) * sat;
  const hp = h / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0;
  let g = 0;
  let b = 0;

  if (hp >= 0 && hp < 1) {
    r = c;
    g = x;
  } else if (hp >= 1 && hp < 2) {
    r = x;
    g = c;
  } else if (hp >= 2 && hp < 3) {
    g = c;
    b = x;
  } else if (hp >= 3 && hp < 4) {
    g = x;
    b = c;
  } else if (hp >= 4 && hp < 5) {
    r = x;
    b = c;
  } else if (hp >= 5 && hp <= 6) {
    r = c;
    b = x;
  }

  const m = light - c / 2;
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}

function paletteFromBytes(bytes) {
  const colors = [];
  for (let i = 0; i < 8; i += 1) {
    const hue = ((bytes[i] << 8) + bytes[(i + 8) % bytes.length]) % 360;
    const sat = 55 + (bytes[(i + 16) % bytes.length] % 31);
    let lightness = 35 + (bytes[(i + 24) % bytes.length] % 41);

    if (i === 0) {
      lightness = 72 + (bytes[(i + 4) % bytes.length] % 9);
    } else if (i === 1) {
      lightness = 30 + (bytes[(i + 12) % bytes.length] % 11);
    }

    colors.push(hslToRgb(hue, sat, lightness));
  }
  return colors;
}

function pickActiveIndices(indices, count, seedBytes) {
  const pool = indices.slice();
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = seedBytes[i % seedBytes.length] % (i + 1);
    const temp = pool[i];
    pool[i] = pool[j];
    pool[j] = temp;
  }
  return pool.slice(0, count);
}

function pickSymmetry(seedByte) {
  return ["none", "horizontal", "vertical", "quadrant"][seedByte % 4];
}

function applySymmetry(grid, size, mode) {
  const next = grid.map((row) => row.slice());
  if (mode === "horizontal") {
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < Math.floor(size / 2); x += 1) {
        next[y][size - 1 - x] = next[y][x];
      }
    }
  } else if (mode === "vertical") {
    for (let y = 0; y < Math.floor(size / 2); y += 1) {
      next[size - 1 - y] = next[y].slice();
    }
  } else if (mode === "quadrant") {
    const half = Math.ceil(size / 2);
    for (let y = 0; y < half; y += 1) {
      for (let x = 0; x < half; x += 1) {
        const value = next[y][x];
        next[y][size - 1 - x] = value;
        next[size - 1 - y][x] = value;
        next[size - 1 - y][size - 1 - x] = value;
      }
    }
  }
  return next;
}

function smoothGrid(grid, backgroundIndex) {
  const size = grid.length;
  const next = grid.map((row) => row.slice());
  const counts = new Array(8).fill(0);

  for (let y = 1; y < size - 1; y += 1) {
    for (let x = 1; x < size - 1; x += 1) {
      counts.fill(0);
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          if (dx === 0 && dy === 0) continue;
          counts[grid[y + dy][x + dx]] += 1;
        }
      }

      let bestIndex = backgroundIndex;
      let bestCount = counts[backgroundIndex];
      for (let i = 0; i < counts.length; i += 1) {
        if (counts[i] > bestCount) {
          bestCount = counts[i];
          bestIndex = i;
        }
      }

      if (counts[backgroundIndex] >= 4) {
        bestIndex = backgroundIndex;
      }

      if (bestCount >= 5) {
        next[y][x] = bestIndex;
      }
    }
  }
  return next;
}

function scoreGrid(grid, backgroundIndex) {
  const size = grid.length;
  const total = size * size;
  let bgCount = 0;
  let nonBgCount = 0;
  let centerScore = 0;
  let speckleCount = 0;
  const quadrantCounts = [0, 0, 0, 0];
  const center = (size - 1) / 2;
  const maxDist = center * 2;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const value = grid[y][x];
      if (value === backgroundIndex) {
        bgCount += 1;
        continue;
      }
      nonBgCount += 1;
      const dist = Math.abs(x - center) + Math.abs(y - center);
      centerScore += 1 - dist / maxDist;

      let neighborCount = 0;
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          if (dx === 0 && dy === 0) continue;
          const ny = y + dy;
          const nx = x + dx;
          if (ny < 0 || ny >= size || nx < 0 || nx >= size) continue;
          if (grid[ny][nx] !== backgroundIndex) neighborCount += 1;
        }
      }
      if (neighborCount < 2) speckleCount += 1;

      const qx = x < size / 2 ? 0 : 1;
      const qy = y < size / 2 ? 0 : 1;
      quadrantCounts[qy * 2 + qx] += 1;
    }
  }

  const bgFraction = bgCount / total;
  const target = 0.4;
  const occupancyRange = 0.15;
  let occupancyScore = 1 - Math.abs(bgFraction - target) / occupancyRange;
  occupancyScore = clamp(occupancyScore, -1, 1);

  const centerNorm = nonBgCount ? centerScore / nonBgCount : 0;
  const speckleRatio = nonBgCount ? speckleCount / nonBgCount : 1;
  const avgQuadrant = nonBgCount / 4 || 1;
  const maxDiff = Math.max(
    ...quadrantCounts.map((count) => Math.abs(count - avgQuadrant))
  );
  const balanceScore = clamp(1 - maxDiff / avgQuadrant, 0, 1);

  return (
    occupancyScore * 2 +
    centerNorm * 1.5 +
    (1 - speckleRatio) +
    balanceScore
  );
}

function buildCandidate({
  seedBytes,
  backgroundIndex,
  activeIndices,
  offset,
}) {
  const styleId = seedBytes[(offset + 2) % seedBytes.length] % 5;
  const symmetry = pickSymmetry(seedBytes[(offset + 1) % seedBytes.length]);
  const baseThreshold =
    0.25 + (seedBytes[(offset + 3) % seedBytes.length] / 255) * 0.2;
  const threshold = clamp(baseThreshold, 0.25, 0.45);

  const baseGrid = Array.from({ length: GRID_SIZE }, () =>
    new Array(GRID_SIZE).fill(backgroundIndex)
  );

  const chooseIndex = (value, x, y) => {
    let t = value;
    if (styleId === 1) {
      t = Math.pow(value, 1.6);
    } else if (styleId === 2) {
      t = 1 - Math.pow(1 - value, 1.6);
    } else if (styleId === 3) {
      const bands = activeIndices.length + 1;
      t = Math.floor(value * bands) / bands;
    } else if (styleId === 4) {
      const center = (GRID_SIZE - 1) / 2;
      const dist = Math.abs(x - center) + Math.abs(y - center);
      const bias = 1 - dist / (GRID_SIZE * 0.9);
      t = clamp(value * 0.7 + bias * 0.3, 0, 1);
    }

    if (t < threshold) return backgroundIndex;
    const bucket = Math.floor(
      ((t - threshold) / (1 - threshold)) * activeIndices.length
    );
    return activeIndices[Math.min(activeIndices.length - 1, bucket)];
  };

  const fillWidth =
    symmetry === "horizontal" || symmetry === "quadrant"
      ? HALF_GRID
      : GRID_SIZE;
  const fillHeight =
    symmetry === "vertical" || symmetry === "quadrant"
      ? HALF_GRID
      : GRID_SIZE;

  let cursor = offset + 8;
  for (let y = 0; y < fillHeight; y += 1) {
    for (let x = 0; x < fillWidth; x += 1) {
      const value = seedBytes[cursor % seedBytes.length] / 255;
      cursor += 1;
      baseGrid[y][x] = chooseIndex(value, x, y);
    }
  }

  let shaped = applySymmetry(baseGrid, GRID_SIZE, symmetry);
  shaped = smoothGrid(shaped, backgroundIndex);

  return shaped;
}

export default function useGlyph(identity, variant = 0) {
  const grid = ref([]);
  const colors = ref([]);
  const isReady = computed(() => grid.value.length > 0 && colors.value.length);

  let requestId = 0;

  watch(
    () => [unref(identity), unref(variant)],
    async ([identityValue, variantValue]) => {
      const normalizedIdentity = identityValue || "";
      const nextId = (requestId += 1);
      grid.value = [];
      colors.value = [];

      if (!normalizedIdentity) return;

      try {
        const baseSeed = await hashBytes(
          "SHA-256",
          toBytes(normalizedIdentity)
        );
        if (nextId !== requestId) return;

        const paletteSeed = await hashBytes(
          "SHA-256",
          concatBytes(baseSeed, toBytes("palette"))
        );
        if (nextId !== requestId) return;

        colors.value = paletteFromBytes(paletteSeed);

        const patternSeed = concatBytes(
          baseSeed,
          toBytes("grid"),
          toUint32Bytes(Number(variantValue) || 0)
        );
        const needed = GRID_SIZE * GRID_SIZE + 256;
        const patternBytes = await expandBytes(patternSeed, needed);
        if (nextId !== requestId) return;

        const activeSeed = await hashBytes(
          "SHA-256",
          concatBytes(
            baseSeed,
            toBytes("active"),
            toUint32Bytes(Number(variantValue) || 0)
          )
        );
        if (nextId !== requestId) return;

        const bgIndex = paletteSeed[0] % 8;
        const remaining = Array.from({ length: 8 }, (_, i) => i).filter(
          (i) => i !== bgIndex
        );
        const activeIndices = pickActiveIndices(remaining, 4, activeSeed);

        let bestGrid = null;
        let bestScore = -Infinity;
        for (let i = 0; i < 4; i += 1) {
          const candidate = buildCandidate({
            seedBytes: patternBytes,
            backgroundIndex: bgIndex,
            activeIndices,
            offset: i * 41,
          });
          const score = scoreGrid(candidate, bgIndex);
          if (score > bestScore) {
            bestScore = score;
            bestGrid = candidate;
          }
        }

        grid.value = bestGrid || [];
      } catch {
        grid.value = [];
        colors.value = [];
      }
    },
    { immediate: true }
  );

  return {
    grid,
    colors,
    isReady,
  };
}
