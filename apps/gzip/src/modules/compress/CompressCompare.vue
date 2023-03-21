<script setup lang="ts">
import { shallowRef, computed, onMounted } from "vue";
import {
  JSONtoStream,
  compressStream,
  responseToBuffer,
  responseToJSON,
} from "./compress";

const props = defineProps(["url"]);

const size = shallowRef(0);
const compressedSize = shallowRef(0);
const data = shallowRef(null);

onMounted(async () => {
  data.value = await responseToJSON(await fetch(props.url));

  size.value = new TextEncoder().encode(JSON.stringify(data.value)).length;

  compressedSize.value = (
    await responseToBuffer(await compressStream(JSONtoStream(data.value)))
  ).byteLength;
});

const sizeInKb = computed(() => size.value / 1024);
const sizeInMb = computed(() => sizeInKb.value / 1024);

const compressedSizeInKb = computed(() => compressedSize.value / 1024);
const compressedSizeInMb = computed(() => compressedSizeInKb.value / 1024);

async function openFile() {
  // Get response Blob
  const blob = await (await compressStream(JSONtoStream(data.value))).blob();

  // Create a programmatic download link
  const elem = window.document.createElement("a");
  const newBlob = blob.slice(0, blob.size, "application/gzip");
  elem.href = window.URL.createObjectURL(newBlob);
  elem.download = `${props.url}.gzip`;
  window.document.body.appendChild(elem);
  elem.click();
  console.log(elem, newBlob);
  window.document.body.removeChild(elem);
}
</script>
<template>
  <div v-if="size" class="my-4">
    <div class="break-all w-96 truncate text-blue-500">
      <a :href="url" target="_blank">{{ url }}</a>
    </div>
    <div v-if="size">
      <div>
        JSON size:
        {{
          sizeInKb > 1
            ? sizeInMb > 1
              ? `${Math.round((sizeInMb + Number.EPSILON) * 100) / 100}MB`
              : `${Math.floor(sizeInKb)}KB`
            : `${size}B`
        }}
      </div>
      <div>
        gzip size:
        {{
          compressedSizeInKb > 1
            ? compressedSizeInMb > 1
              ? `${
                  Math.round((compressedSizeInMb + Number.EPSILON) * 100) / 100
                }MB`
              : `${Math.floor(compressedSizeInKb)}KB`
            : `${compressedSize}B`
        }}
      </div>
      <div class="text-green">
        {{ Math.round(100 - (compressedSize / size) * 100) }}% reduction
      </div>
      <VBtn variant="tonal" size="x-small" color="secondary" @click="openFile"
        >Download gzip file</VBtn
      >
    </div>
    <div v-else>loading...</div>
  </div>
</template>
