<script setup>
import { shallowRef, computed, onMounted, reactive, watch } from "vue";
import {
  reactiveComputed,
  useLocalStorage,
  useElementSize,
} from "@vueuse/core";
import { createEngine, createSprite } from "sams-game-kit";
import { ScrollingBackgroundImage } from "./background";

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
const bg = shallowRef();
const platform = shallowRef();
const ctx = computed(() => canvas.value?.getContext("2d"));
const characterState = shallowRef("idle");
const size = reactive(
  useElementSize(bg, { width: 0, height: 0 }, { box: "border-box" })
);

const { onLoop } = createEngine();
const { drawSprite } = createSprite(
  {
    idle,
    walk,
    run,
    jump,
    jumpSpin,
    land,
    punch,
    crouchIdle,
    crouchWalk,
    roll,
  },
  { state: characterState.value, width: 384, height: 384 }
);

function resizeScene() {
  canvas.value.width = size.width;
  canvas.value.height = size.height;
}

onMounted(resizeScene);
watch(size, resizeScene);

const characterDirection = shallowRef(0);
const sceneWidth = shallowRef(30000);

let oldTimeStamp;

const punchFrames = shallowRef(0);
const rollFrames = shallowRef(0);

const isCrouching = shallowRef(false);
const isMoving = shallowRef(false);

// walk 1.42 metre per second
// 1 metre === 100px

const velocityX = shallowRef(4.5);
const velocityY = shallowRef(0);
const fps = shallowRef(0);

function drawScene(timestamp) {
  if (!ctx.value) return;
  ctx.value.clearRect(0, 0, size.width, size.height);

  // Calculate the number of seconds passed since the last frame
  const deltaTime = timestamp - oldTimeStamp;
  oldTimeStamp = timestamp;

  // Calculate fps
  fps.value = Math.round(1 / (deltaTime / 1000));

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
  } else if (speed.value > 0 && !rollFrames.value && isMoving.value) {
    if (isCrouching.value) {
      characterState.value = "crouchWalk";
    } else {
      characterState.value = speed.value > 8 ? "run" : "walk";
    }
  } else {
    characterState.value = isCrouching.value ? "crouchIdle" : "idle";
  }

  if (speed.value > 0 && isMoving.value) {
    cameraX.value -= speed.value * characterDirection.value;
    if (cameraX.value > 0) {
      cameraX.value = 0;
    }
    if (cameraX.value < (sceneWidth.value - size.width) * -1) {
      cameraX.value = (sceneWidth.value - size.width) * -1;
    }
  }

  ctx.value.save(); // save the current canvas state
  ctx.value.setTransform(
    characterDirection.value >= 0 ? 1 : -1,
    0, // set the direction of x axis
    0,
    1, // set the direction of y axis
    characterDirection.value >= 0 ? 0 : size.width, // set the x origin
    size.height
  );

  ctx.fillStyle = "red";
  ctx.value.fillRect(100 - cameraX.value + -1, -100, 100, 100);

  drawSprite(ctx.value, {
    state: characterState.value,
    position: {
      x: size.width / 2 - 81,
      y: cameraY.value * -1,
    },
    repeatAnimation: [
      "idle",
      "walk",
      "run",
      "crouchWalk",
      "crouchIdle",
    ].includes(characterState.value),
  });

  ctx.value.restore(); // restore
}

onLoop(drawScene);

const cameraX = shallowRef(0);
const cameraY = shallowRef(0);

const speed = computed(() => {
  if (characterDirection.value === 0) {
    return 0;
  }
  return running.value ? velocityX.value * 2 : velocityX.value;
});

const running = shallowRef(false);
function onKeydown(e) {
  if (e.key === "d" || e.key === "ArrowRight") {
    characterDirection.value = 1;
    isMoving.value = true;
  } else if (e.key === "a" || e.key === "ArrowLeft") {
    characterDirection.value = -1;
    isMoving.value = true;
  }
  if (e.key === "w" || e.key === "ArrowUp") {
    velocityY.value = 1.5;
  }
  if (e.key === "s" || e.key === "ArrowDown") {
    isCrouching.value = true;
  }
  if (e.key === " ") {
    punchFrames.value = 8 * 4;
  }
  if (e.key === "r" || e.key === "R") {
    if (cameraY.value === 0) {
      rollFrames.value = 7 * 4;
    }
  }

  if (e.key === "Shift") {
    running.value = true;
  }
}
function onKeyup(e) {
  if (
    ((e.key === "d" || e.key === "ArrowRight") &&
      characterDirection.value > 0) ||
    ((e.key === "a" || e.key === "ArrowLeft") && characterDirection.value < 0)
  ) {
    isMoving.value = false;
  }

  if (e.key === "s" || e.key === "ArrowDown") {
    isCrouching.value = false;
  }

  if (e.key === "Shift") {
    running.value = false;
  }
}
window.addEventListener("keydown", onKeydown, false);
window.addEventListener("keyup", onKeyup, false);

const sceneType = useLocalStorage("app/themeVariation");

const sceneLayerMultiplier = computed(() => {
  switch (sceneType.value) {
    case "light":
      return 0.9;
    case "dark":
      return 1;
    default:
      return 1;
  }
});
</script>

<template>
  <ScrollingBackgroundImage
    ref="bg"
    :scene="sceneType"
    :width="sceneWidth"
    :cameraX="cameraX"
    :cameraY="cameraY"
    :layerMultiplier="sceneLayerMultiplier"
  />
  <div class="absolute flex top-0 left-0 overflow-hidden bottom-0 right-0 z-20">
    <canvas ref="canvas" class="flex-1 z-20"></canvas>
    <div
      class="absolute top-0 bottom-0 left-0 flex-1"
      :style="{
        width: `${sceneWidth}px`,
        transform: `translate3d(${cameraX}px, ${cameraY / 5}px, 0)`,
      }"
    ></div>
    <div
      class="text-xs font-light bg-base-100 absolute border-t-2 border-accent w-full bottom-0 flex justify-end items-center px-4"
      :style="`height: ${40 - cameraY / 10}px`"
    >
      <span class="absolute right-2 bottom-3">{{ fps }}fps</span>
    </div>
  </div>
</template>
