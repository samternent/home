<script setup>
import { shallowRef, watch, computed } from "vue";
import { SButton } from "ternent-ui/components";

const props = defineProps(["modelValue", "filename"]);
const emit = defineEmits(["update:modelValue", "update:filename"]);

// emit("update:modelValue", compressedFiles);
async function openFile() {
  // Create a programmatic download link
  const elem = window.document.createElement("a");
  elem.href = window.URL.createObjectURL(props.modelValue);
  elem.download = `${props.filename}.gz`;
  window.document.body.appendChild(elem);
  elem.click();
  window.document.body.removeChild(elem);
}

const sizeInKb = computed(() =>
  props.modelValue?.size ? props.modelValue.size / 1024 : 0
);
const sizeInMb = computed(() => sizeInKb.value / 1024);

const filename = computed({
  get() {
    return props.filename;
  },
  set(value) {
    emit("update:filename", value);
  },
});
</script>
<template>
  <div class="flex justify-between flex-col px-4">
    <div class="flex flex-col items-center mb-8">
      <div class="text-xl mb-8">{{ filename }}</div>
      <input
        density="compact"
        v-model="filename"
        class="w-full"
        placeholder="filename.extension"
      />
      <SButton
        :disabled="!props.modelValue"
        variant="tonal"
        size="large"
        color="secondary"
        @click="openFile"
        >Download gzip file</SButton
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
