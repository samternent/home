<script setup lang="ts">
import { shallowRef, watch, computed } from "vue";
import { useLocalStorage } from "@vueuse/core";

const props = defineProps(["modelValue", "filename"]);
const emit = defineEmits(["update:modelValue", "update:filename"]);

const activeCompressView = useLocalStorage("activeCompressView", "url");

const files = shallowRef([]);

function readFileAsync(file): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    let reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result);
    };

    reader.onerror = reject;

    reader.readAsArrayBuffer(file);
  });
}

watch(files, async (_files) => {
  emit("update:modelValue", compressedFiles);
  emit("update:filename", _files[0].name);
});

const textInput = shallowRef("");
watch(textInput, async (_textInput) => {
  if (!_textInput) return;
  const stream = new Blob([_textInput], { type: "application/gzip" }).stream();
  const compressedReadableStream = stream.pipeThrough(
    new CompressionStream("gzip")
  );
  const compressedFile = await new Response(compressedReadableStream).blob();

  emit("update:modelValue", compressedFile);
});

watch(activeCompressView, () => {
  emit("update:modelValue", null);
  emit("update:filename", null);
  textInput.value = "";
  files.value = [];
});

const size = computed(() => {
  switch (activeCompressView.value) {
    case "file":
      return files.value[0]?.size || 0;
    case "text":
      return new TextEncoder().encode(textInput.value).length;
    default:
      return 0;
  }
});
const sizeInKb = computed(() => size.value / 1024);
const sizeInMb = computed(() => sizeInKb.value / 1024);
</script>
<template>
  <div class="flex flex-col">
    <!-- <VTabs v-model="activeCompressView" class="sticky top-0 bg-zinc-800 z-20">
      <VTab value="url">URL</VTab>
      <VTab value="json">JSON</VTab>
      <VTab value="file">File</VTab>
      <VTab value="text">Text</VTab>
    </VTabs> -->

    <div class="flex flex-1 justify-between flex-col">
      <div
        class="flex flex-1 justify-center items-center"
        v-if="activeCompressView === 'url'"
      >
        <input
          v-model="files"
          color="primary"
          placeholder="https://gzip.app/api/sample.json"
          prepend-icon=""
          variant="outlined"
          :show-size="1024"
          clearable
        />
        <VBtn
          v-model="files"
          color="primary"
          placeholder="https://gzip.app/api/sample.json"
          prepend-icon=""
          variant="outlined"
          :show-size="1024"
          clearable
          >get</VBtn
        >
      </div>
      <div
        class="flex flex-1 justify-center items-center"
        v-if="activeCompressView === 'json'"
      >
        <v-file-input
          v-model="files"
          color="primary"
          placeholder="Select your file"
          prepend-icon=""
          variant="outlined"
          :show-size="1024"
          clearable
        />
      </div>
      <div
        class="flex flex-1 justify-center items-center"
        v-if="activeCompressView === 'file'"
      >
        <v-file-input
          v-model="files"
          color="primary"
          placeholder="Select your file"
          prepend-icon=""
          variant="outlined"
          :show-size="1024"
          clearable
        />
      </div>
      <div
        class="flex flex-1 justify-center items-center"
        v-if="activeCompressView === 'text'"
      >
        <v-textarea
          clearable
          clear-icon="mdi-close-circle"
          rows="16"
          v-model="textInput"
        ></v-textarea>
      </div>
      <div
        class="text-6xl font-bold text-zinc-500 justify-center items-center flex"
      >
        {{
          sizeInKb > 1
            ? sizeInMb > 1
              ? `${(
                  Math.round((sizeInMb + Number.EPSILON) * 100) / 100
                ).toFixed(1)}MB`
              : `${(
                  Math.round((sizeInKb + Number.EPSILON) * 100) / 100
                ).toFixed(1)}KB`
            : `${size}B`
        }}
      </div>
    </div>

    <div v-if="activeCompressView === 'tar'">
      <!-- <v-file-input
        v-model="files"
        color="primary"
        counter
        label="File input"
        multiple
        placeholder="Select your files"
        prepend-icon=""
        variant="outlined"
        :show-size="1000"
        clearable
      >
        <template v-slot:selection="{ fileNames }">
          <template v-for="(fileName, index) in fileNames" :key="fileName">
            <v-chip color="secondary" label size="small" class="me-2">
              {{ fileName }}
            </v-chip>
          </template>
        </template>
      </v-file-input> -->
    </div>
  </div>
</template>
