<script setup>
import { computed } from "vue";
import daytimeAssets from "./daytimeAssets";
import nighttimeAssets from "./nighttimeAssets";
import oneAssets from "./oneAssets";
import twoAssets from "./twoAssets";

const props = defineProps({
  scene: { type: String },
  width: { type: Number },
  cameraX: { type: Number },
  cameraY: { type: Number },
  layerMultiplier: { type: Number },
});

const assetPack = computed(() => {
  switch (props.scene) {
    case "light":
      return daytimeAssets;
    case "dark":
      return nighttimeAssets;
    default:
      return daytimeAssets;
  }
});
</script>
<template>
  <div class="absolute top-0 left-0 overflow-hidden bottom-0 right-0">
    <div
      v-for="(_scene, i) in assetPack"
      :key="i"
      :style="{
        backgroundImage: `url('${_scene.image}')`,
        transform: `translate3d(${
          _scene.fixedX ? 0 : cameraX / (assetPack.length - i || 1)
        }px, ${_scene.fixedY ? 0 : cameraY / 5}px, 0)`,
        width: `${width}px`,
        zIndex: _scene.position === 'front' ? 25 : 1,
      }"
      class="background-scene h-screen absolute"
    />
  </div>
</template>
<style scoped>
.background-scene {
  background-position-x: left;
  background-position-y: bottom;
  background-repeat: repeat-x;
  background-size: contain;
  transition: transform 0.1s;
  transition-timing-function: linear;
  height: 100vh;
  width: 100vw;
}
</style>
