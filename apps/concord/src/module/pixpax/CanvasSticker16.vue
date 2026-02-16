<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from "vue";
import type { PackPalette16, StickerArt16 } from "./sticker-types";
import { argbToRgbaTuple, decodeIdx4ToIndices } from "./pixel";
import { assertPalette16, assertStickerArt16 } from "./domain/protocol";

type CanvasStickerProps = {
  art: StickerArt16;
  palette: PackPalette16;
  scale?: number | null;
  class?: any;
};

const props = defineProps<CanvasStickerProps>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
const workCanvasRef = ref<HTMLCanvasElement | null>(null);
const workCtxRef = ref<CanvasRenderingContext2D | null>(null);
const imageDataRef = ref<ImageData | null>(null);
const measuredCssSizeRef = ref<number>(0);
let resizeObserver: ResizeObserver | null = null;

function ensureBuffers() {
  if (!workCanvasRef.value) {
    workCanvasRef.value = document.createElement("canvas");
    workCanvasRef.value.width = 16;
    workCanvasRef.value.height = 16;
    workCtxRef.value = workCanvasRef.value.getContext("2d");
    if (workCtxRef.value) {
      imageDataRef.value = workCtxRef.value.createImageData(16, 16);
    }
  }
}

function draw() {
  const canvas = canvasRef.value;
  if (!canvas) return;

  ensureBuffers();
  const workCanvas = workCanvasRef.value;
  const workCtx = workCtxRef.value;
  const imageData = imageDataRef.value;
  if (!workCanvas || !workCtx || !imageData) return;

  const explicitScale = Number(props.scale);
  const hasExplicitScale = Number.isFinite(explicitScale) && explicitScale > 0;
  const dpr =
    typeof window !== "undefined"
      ? Math.max(1, window.devicePixelRatio || 1)
      : 1;

  if (hasExplicitScale) {
    const scale = Math.max(1, Math.floor(explicitScale));
    canvas.width = 16 * scale;
    canvas.height = 16 * scale;
    canvas.style.width = `${16 * scale}px`;
    canvas.style.height = `${16 * scale}px`;
  } else {
    const measuredCssSize = Math.max(1, Math.floor(measuredCssSizeRef.value));
    const fallbackCssSize = 16 * 8;
    const cssSize = measuredCssSize || fallbackCssSize;
    canvas.width = Math.max(16, Math.floor(cssSize * dpr));
    canvas.height = Math.max(16, Math.floor(cssSize * dpr));
    canvas.style.width = `${cssSize}px`;
    canvas.style.height = `${cssSize}px`;
  }

  assertStickerArt16(props.art);
  assertPalette16(props.palette);
  const indices = decodeIdx4ToIndices(props.art);
  const data = imageData.data;
  for (let i = 0; i < indices.length; i += 1) {
    const paletteIndex = indices[i];
    const color = props.palette.colors[paletteIndex] ?? 0x00000000;
    const [r, g, b, a] = argbToRgbaTuple(color);
    const offset = i * 4;
    data[offset] = r;
    data[offset + 1] = g;
    data[offset + 2] = b;
    data[offset + 3] = a;
  }

  workCtx.putImageData(imageData, 0, 0);

  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(workCanvas, 0, 0, canvas.width, canvas.height);
}

function observeSize() {
  const canvas = canvasRef.value;
  if (!canvas || props.scale) return;
  const parent = canvas.parentElement;
  if (!parent) return;
  const updateMeasuredSize = () => {
    const width = Math.floor(parent.clientWidth);
    const height = Math.floor(parent.clientHeight);
    const next = Math.max(1, Math.min(width || 0, height || width || 0));
    if (next !== measuredCssSizeRef.value) {
      measuredCssSizeRef.value = next;
    }
  };
  updateMeasuredSize();
  resizeObserver = new ResizeObserver(updateMeasuredSize);
  resizeObserver.observe(parent);
}

function resetSizeObserver() {
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
  measuredCssSizeRef.value = 0;
}

onMounted(() => {
  observeSize();
  draw();
});

onUnmounted(() => {
  resetSizeObserver();
});

watch(() => props.art, draw, { deep: true });
watch(() => props.palette, draw, { deep: true });
watch(
  () => props.scale,
  () => {
    resetSizeObserver();
    observeSize();
    draw();
  },
);
watch(() => measuredCssSizeRef.value, draw);
</script>

<template>
  <canvas
    ref="canvasRef"
    :class="props.class"
    class="pixel-canvas"
    width="128"
    height="128"
  />
</template>

<style scoped>
.pixel-canvas {
  display: block;
  width: 100%;
  height: 100%;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}
</style>
