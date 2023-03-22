<script setup lang="ts">
import { shallowRef, watch, computed } from "vue";
import { useLocalStorage } from "@vueuse/core";

const props = defineProps(["modelValue"]);
const emit = defineEmits(["update:modelValue"]);

// emit("update:modelValue", compressedFiles);
async function openFile() {
  // Create a programmatic download link
  const elem = window.document.createElement("a");
  elem.href = window.URL.createObjectURL(props.modelValue);
  elem.download = `name.gzip`;
  window.document.body.appendChild(elem);
  elem.click();
  window.document.body.removeChild(elem);
}

const sizeInKb = computed(() =>
  props.modelValue?.size ? props.modelValue.size / 1024 : 0
);
const sizeInMb = computed(() => sizeInKb.value / 1024);
</script>
<template>
  <div class="flex justify-between flex-col">
    <div class="flex justify-center h-36">
      <VBtn
        :disabled="!props.modelValue"
        variant="tonal"
        size="large"
        color="secondary"
        @click="openFile"
        >Download gzip file</VBtn
      >
    </div>
    <div
      class="text-6xl font-bold text-zinc-500 justify-center items-center flex"
    >
      {{
        sizeInKb > 1
          ? sizeInMb > 1
            ? `${(Math.round((sizeInMb + Number.EPSILON) * 100) / 100).toFixed(
                1
              )}MB`
            : `${(Math.round((sizeInKb + Number.EPSILON) * 100) / 100).toFixed(
                1
              )}KB`
          : `${modelValue?.size || 0}B`
      }}
    </div>
  </div>
</template>
