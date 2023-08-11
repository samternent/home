<script setup lang="ts">
import { shallowRef, computed, onMounted } from "vue";
import { useDebounceFn, useLocalStorage } from "@vueuse/core";
import { createEngine, createSprite } from "sams-game-kit";
import { ScrollingBackgroundImage } from "@/module/background";

import idle from "@/assets/character/idle.png";
import walk from "@/assets/character/walk.png";
import run from "@/assets/character/run.png";
import jump from "@/assets/character/jump.png";
import jumpSpin from "@/assets/character/jump-spin.png";
import land from "@/assets/character/land.png";
import punch from "@/assets/character/punch.png";
import crouchIdle from "@/assets/character/crouch-idle.png";
import crouchWalk from "@/assets/character/crouch-walk.png";
import roll from "@/assets/character/roll.png";

const canvas = shallowRef();
const ctx = computed(() => canvas.value?.getContext("2d"));
const characterState = shallowRef("idle");

const { onLoop } = createEngine();
const { drawSprite } = createSprite(
  { idle, walk, run, jump, jumpSpin, land, punch, crouchIdle, crouchWalk, roll },
  { state: characterState.value, width: 384, height: 384 }
);

function resizeScene() {
  canvas.value.width = window.innerWidth;
  canvas.value.height = window.innerHeight;
}

onMounted(resizeScene);
new ResizeObserver(useDebounceFn(resizeScene)).observe(document.body);

const characterDirection = shallowRef(0);
const sceneWidth = shallowRef(30000);

let oldTimeStamp: EpochTimeStamp;

const punchFrames = shallowRef(0);
const rollFrames = shallowRef(0);

const isCrouching = shallowRef(false);

// walk 1.42 metre per second
// 1 metre === 100px

const velocityX = shallowRef(4.5);
const velocityY = shallowRef(0);
const speed = shallowRef(0);

function drawScene(timestamp: EpochTimeStamp) {
  if (!ctx.value) return;
  ctx.value.clearRect(0, 0, window.innerWidth, window.innerHeight);

  // Calculate the number of seconds passed since the last frame
  const deltaTime = (timestamp - oldTimeStamp);
  oldTimeStamp = timestamp;


  // Calculate fps
  const fps = Math.round(1 / (deltaTime / 1000));

  if (velocityY.value) {
    cameraY.value += velocityY.value * deltaTime;
  }

  if (velocityY.value) {
    velocityY.value -= 0.1;
  }

  cameraY.value = cameraY.value <= 0 ? 0 : cameraY.value + velocityY.value;

  if (cameraY.value === 0) {
    velocityY.value = 0;
  }

  if (punchFrames.value > 0) {
    characterState.value = "punch";
    punchFrames.value -= 1;
  } else if (rollFrames.value > 0) {
    characterState.value = "roll";
    rollFrames.value -= 1;
  } else if (cameraY.value > 0) {
    characterState.value = speed.value > 8 ? "jumpSpin" : "jump";
  } else if (speed.value > 0 && !rollFrames.value) {
    if (isCrouching.value) {
      characterState.value = "crouchWalk";
    }
    else {
      characterState.value = speed.value > 8 ? "run" : "walk";
    }
  } else {
    characterState.value = isCrouching.value ? "crouchIdle" : "idle";
  }

  if (speed.value > 0) {
    cameraX.value -= speed.value * characterDirection.value;
    if (cameraX.value > 0) {
      cameraX.value = 0;
    }
    if (cameraX.value < (sceneWidth.value - window.innerWidth) * -1) {
      cameraX.value = (sceneWidth.value - window.innerWidth) * -1;
    }
  }

  ctx.value.font = "300 18px Work Sans";
  ctx.value.textAlign = "center";
  ctx.value.fillStyle = Math.random() > 0.1 ? "#fc0" : "#f0c";
  ctx.value.fillText(
    `animation test at ${fps}fps`,
    canvas.value?.width - 110,
    canvas.value?.height - 15
  );

  ctx.value.save(); // save the current canvas state
  ctx.value.setTransform(
    characterDirection.value >= 0 ? 1 : -1,
    0, // set the direction of x axis
    0,
    1, // set the direction of y axis
    characterDirection.value >= 0 ? 0 : window.innerWidth, // set the x origin
    window.innerHeight
  );
  drawSprite(ctx.value, {
    state: characterState.value,
    position: { x: window.innerWidth / 2 - 81, y: cameraY.value * -1 },
    repeatAnimation: ["idle", "walk", "run", "crouchWalk", "crouchIdle"].includes(characterState.value)
  });
  ctx.value.restore(); // restore
}

onLoop(drawScene);

const cameraX = shallowRef(0);
const cameraY = shallowRef(0);

function onKeydown(e: KeyboardEvent) {
  if (e.key === "d" || e.key === "ArrowRight") {
    characterDirection.value = 1;
    speed.value = e.shiftKey ? velocityX.value * 2 : velocityX.value;
  } else if (e.key === "a" || e.key === "ArrowLeft") {
    characterDirection.value = -1;
    speed.value = e.shiftKey ? velocityX.value * 2 : velocityX.value;
  }
  if (e.key === "w" || e.key === "ArrowUp") {
    velocityY.value = 1.5;
  }
  if (e.key === "s" || e.key === "ArrowDown") {
    isCrouching.value = true;
  }
  if (e.key === " ") {
    punchFrames.value = 8*4;
  }
  if (e.key === "r") {
    if (cameraY.value === 0) {
      rollFrames.value = 7*4;
    }
  }
}
function onKeyup(e: KeyboardEvent) {
  if (
    ((e.key === "d" || e.key === "ArrowRight") &&
      characterDirection.value > 0) ||
    ((e.key === "a" || e.key === "ArrowLeft") && characterDirection.value < 0)
  ) {
    speed.value = 0;
  }

  if (e.key === "s" || e.key === "ArrowDown") {
    isCrouching.value = false;
  }
}
window.addEventListener("keydown", onKeydown, false);
window.addEventListener("keyup", onKeyup, false);

const sceneType = useLocalStorage("sceneAssets", "night");

const sceneLayerMultiplier = computed(() => {
  switch (sceneType.value) {
    case "day":
      return 0.9;
    case "night":
      return 1;
    default:
      return 1;
  }
});
</script>

<template>
  <ScrollingBackgroundImage
    :scene="sceneType"
    :width="sceneWidth"
    :cameraX="cameraX"
    :cameraY="cameraY"
    :layerMultiplier="sceneLayerMultiplier"
  />
  <canvas ref="canvas" class="fixed top-0 left-0 w-screen h-screen z-20"></canvas>
  <div class="relative z-30">
    <select v-model="sceneType">
      <option value="day">Day</option>
      <option value="night">Night</option>
      <option value="one">One</option>
      <option value="two">Two</option>
    </select>
  </div>
</template>
