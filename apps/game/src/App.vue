<script setup lang="ts">
import { shallowRef, computed, onMounted } from "vue";
import { onKeyDown, useDebounceFn } from "@vueuse/core";
import { createEngine, createSprite } from "@concords/game-kit";

import clouds1 from "@/assets/game_background_4/layers/clouds_1.png";
import clouds2 from "@/assets/game_background_4/layers/clouds_2.png";
import ground from "@/assets/game_background_4/layers/ground.png";
import rocks from "@/assets/game_background_4/layers/rocks.png";
import sky from "@/assets/game_background_4/layers/sky.png";

import idle from "@/assets/character3/idle.png";
import walk from "@/assets/character3/walk.png";
import run from "@/assets/character3/run.png";

const canvas = shallowRef();
const ctx = computed(() => canvas.value?.getContext("2d"));
const characterState = shallowRef('idle');

const { onLoop } = createEngine();
const { drawSprite } = createSprite({ idle, walk, run }, { state: characterState.value, width: 48, height: 48 });

function resizeScene() {
  canvas.value.width = window.innerWidth;
  canvas.value.height = window.innerHeight;
}

onMounted(resizeScene);
new ResizeObserver(useDebounceFn(resizeScene)).observe(document.body);


const characterDirection = shallowRef(1);


function drawScene() {
  if (!ctx.value) return;
  ctx.value.clearRect(0, 0, window.innerWidth, window.innerHeight);

  ctx.value.font = "300 18px Work Sans";
  ctx.value.textAlign = "center";
  ctx.value.fillStyle = Math.random() > 0.1 ? "#fc0" : "#f0c";
  ctx.value.fillText(
    "https://hub.ternent.dev",
    canvas.value.width - 110,
    canvas.value.height - 15
  );

  ctx.value.save(); // save the current canvas state
  ctx.value.setTransform(
    characterDirection.value > 0 ? 1 : -1,
    0, // set the direction of x axis
    0,
    1, // set the direction of y axis
    characterDirection.value > 0 ? 0 : window.innerWidth, // set the x origin
    window.innerHeight
  );
  drawSprite(ctx.value, { state: characterState.value, position: { x: (window.innerWidth / 2) - 96, y: 0 } });
  ctx.value.restore(); // restore

}

onLoop(drawScene);

// walk 1.42 metre per second
// 1 metre === 100px

const velocity = shallowRef(1);
const speed = computed(() => velocity.value);

const cameraX = shallowRef(0);
const cameraY = shallowRef(0);

function onKeydown(e) {
  if (e.key === "d" || e.key === "ArrowRight") {
    cameraX.value -= 10;
    characterDirection.value = 1;
    characterState.value = 'walk';
  } else if (e.key === "a" || e.key === "ArrowLeft") {
    cameraX.value += 10;
    characterDirection.value = -1;
    characterState.value = 'walk';
  } else {
    characterState.value = 'idle';
  }
}
function onKeyup(e) {
  if (e.key === "d" || e.key === "ArrowRight") {
    characterState.value = 'idle';
  } else if (e.key === "a" || e.key === "ArrowLeft") {
    characterState.value = 'idle';
  }
}
window.addEventListener("keydown", onKeydown, false);
window.addEventListener("keyup", onKeyup, false);
</script>

<template>
  <div class="fixed top-0 left-0 w-screen h-screen">
    <div
      :style="{
        backgroundImage: `url('${sky}')`,
        transform: `translate3d(${(cameraX * speed) / 10}px, ${cameraY}px, 0)`,
      }"
      class="background-scene h-screen absolute"
    />
    <div
      :style="{
        backgroundImage: `url('${clouds1}')`,
        transform: `translate3d(${(cameraX * speed) / 7}px, ${cameraY}px, 0)`,
      }"
      class="background-scene h-screen absolute"
    />
    <div
      :style="{
        backgroundImage: `url('${rocks}')`,
        transform: `translate3d(${(cameraX * speed) / 8}px, ${cameraY}px, 0)`,
      }"
      class="background-scene h-screen absolute"
    />
    <div
      :style="{
        backgroundImage: `url('${clouds2}')`,
        transform: `translate3d(${(cameraX * speed) / 4}px, ${cameraY}px, 0)`,
      }"
      class="background-scene h-screen absolute"
    />
    <div
      :style="{
        backgroundImage: `url('${ground}')`,
        transform: `translate3d(${cameraX * speed}px, ${cameraY}px, 0)`,
      }"
      class="background-scene h-screen absolute"
    />
  </div>
  <canvas ref="canvas" class="fixed top-0 left-0 w-screen h-screen"></canvas>
  <div class="relative text-white">This is going over</div>
</template>

<style scoped>
.background-scene {
  background-position-x: center;
  background-position-y: bottom;
  background-repeat: repeat-x;
  background-size: contain;
  width: 10760px;
  transition: transform 0.3s;
  left: 0;
}
</style>
