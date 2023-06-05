<script setup lang="ts">
import { shallowRef, computed } from "vue";
import { createEngine } from "@concords/game-kit";

const canvas = shallowRef();
const ctx = computed(() => canvas.value?.getContext("2d"));

const { onLoop } = createEngine();

function drawScene() {
  if (!ctx.value) return;

  ctx.value.fillStyle = "#fff";
  ctx.value.fillRect(0, 0, window.innerWidth, window.innerHeight);

  ctx.value.font = "300 18px Work Sans";
  ctx.value.textAlign = "center";
  ctx.value.fillStyle = Math.random() > 0.1 ? "#fc0" : "#f0c";
  ctx.value.fillText(
    "https://hub.ternent.dev",
    canvas.value.width - 110,
    canvas.value.height - 15
  );
}

onLoop(drawScene);
</script>

<template>
  <canvas ref="canvas">hello</canvas>
</template>
