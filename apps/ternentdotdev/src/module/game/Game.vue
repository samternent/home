<script setup>
import { shallowRef, computed, onMounted, reactive, watch } from "vue";
import {
  reactiveComputed,
  useLocalStorage,
  useElementSize,
} from "@vueuse/core";
import { createEngine, createSprite } from "sams-game-kit";
import { ScrollingBackgroundImage } from "./background";

import boyIdle from "@/assets/boy/idle.png";
import boyWalk from "@/assets/boy/walk.png";
import boyRun from "@/assets/boy/run.png";
import boyJump from "@/assets/boy/jump.png";

import dinoIdle from "@/assets/dino/idle.png";
import dinoWalk from "@/assets/dino/walk.png";
import dinoRun from "@/assets/dino/run.png";
import dinoJump from "@/assets/dino/jump.png";

const canvas = shallowRef();
const bg = shallowRef();
const platform = shallowRef();
const characterType = useLocalStorage("app/characterType", "boy");
const ctx = computed(() => canvas.value?.getContext("2d"));
const characterState = shallowRef("idle");
const size = reactive(
  useElementSize(bg, { width: 0, height: 0 }, { box: "border-box" })
);

const { onLoop } = createEngine();
const { drawSprite: drawBoySprite } = createSprite(
  {
    idle: boyIdle,
    walk: boyWalk,
    run: boyRun,
    jump: boyJump,
  },
  { state: characterState.value, width: 614, height: 564 }
);
const { drawSprite: drawDinoSprite } = createSprite(
  {
    idle: dinoIdle,
    walk: dinoWalk,
    run: dinoRun,
    jump: dinoJump,
  },
  { state: characterState.value, width: 680, height: 472 }
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
    // characterState.value = "punch";
    punchFrames.value -= 1;
  } else if (rollFrames.value > 0) {
    // characterState.value = "roll";
    rollFrames.value -= 1;
  } else if (cameraY.value > 0) {
    characterState.value = "jump";
  } else if (speed.value > 0 && !rollFrames.value && isMoving.value) {
    // if (isCrouching.value) {
    //   characterState.value = "crouchWalk";
    // } else {
    characterState.value = speed.value > 8 ? "run" : "walk";
    // }
  } else {
    characterState.value = "idle"; // isCrouching.value ? "crouchIdle" : "idle";
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

  // ctx.fillStyle = "red";
  // ctx.value.fillRect(100 - cameraX.value + -1, -100, 100, 100);

  if (characterType.value === "boy") {
    drawBoySprite(ctx.value, {
      state: characterState.value,
      position: {
        x: size.width / 2 - 81,
        y: cameraY.value * -1 + 20,
      },
      repeatAnimation: ["idle", "walk", "run"].includes(characterState.value),
    });
  } else if (characterType.value === "dino") {
    drawDinoSprite(ctx.value, {
      state: characterState.value,
      position: {
        x: size.width / 2 - 81,
        y: cameraY.value * -1 + 20,
      },
      repeatAnimation: ["idle", "walk", "run"].includes(characterState.value),
    });
  }

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
    if (cameraY.value === 0) {
      velocityY.value = e.shiftKey ? 2 : 1.7;
    }
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
      return 1.5;
    case "dark":
      return 1;
    default:
      return 1;
  }
});

const percentageCompleted = computed(() =>
  Math.round(((cameraX.value * -1) / (sceneWidth.value - size.width)) * 100)
);
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
      class="absolute top-0 h-6 text-xs left-0 w-full bg-base-100 border-r-2 border-primary flex-1 z-30 flex justify-end items-center"
      :style="{
        width: `${((cameraX * -1) / (sceneWidth - size.width)) * 100}%`,
      }"
    >
      <span v-if="percentageCompleted > 3" class="mx-2"
        >{{ percentageCompleted }}%</span
      >
    </div>
    <div
      class="text-xs font-light absolute w-full bg-base-200 bottom-0 flex justify-between items-center px-4"
      :style="`height: 30px`"
    >
      <select v-model="characterType" class="z-20 bg-transparent">
        <option value="boy">Boy</option>
        <option value="dino">Dino</option>
      </select>
      <span class="w-10 text-right">{{ fps }}fps</span>
    </div>
  </div>
</template>
