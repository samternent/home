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
  if (!_files.length) return;
  const fileBuffer = await readFileAsync(_files[0]);
  const stream = new Blob([fileBuffer], { type: _files[0].type }).stream();

  const compressedReadableStream = stream.pipeThrough(
    new CompressionStream("gzip")
  );
  const compressedFiles = await new Response(compressedReadableStream).blob();

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
    case "url":
      return new TextEncoder().encode(urlFile.value).length;
    default:
      return 0;
  }
});
const sizeInKb = computed(() => size.value / 1024);
const sizeInMb = computed(() => sizeInKb.value / 1024);

const url = shallowRef("");
const username = shallowRef("");
const password = shallowRef("");

const urlFile = shallowRef();
async function fetchUrl() {
  try {
    const urlStream = await fetch(`${url.value}`, {
      mode: username.value || password.value ? "cors" : "no-cors",
      headers: new Headers({
        Authorization: `Basic ${btoa(`${username.value}:${password.value}`)}`,
      }),
    });

    const contentType = urlStream.headers.get("Content-Type");
    if (contentType?.includes("application/json")) {
      urlFile.value = await urlStream.clone().json();
    } else {
      urlFile.value = await urlStream.clone().text();
    }
    const compressedReadableStream = urlStream.body?.pipeThrough(
      new CompressionStream("gzip")
    );
    const compressedFile = await new Response(compressedReadableStream).blob();

    emit("update:modelValue", compressedFile);
    emit("update:filename", url.value);
  } catch (e) {
    throw e;
  }
}
</script>
<template>
  <div class="flex flex-col">
    <VTabs v-model="activeCompressView" class="sticky top-0 bg-zinc-800 z-20">
      <VTab value="url">URL</VTab>
      <!-- <VTab value="json">JSON</VTab> -->
      <VTab value="file">File</VTab>
      <VTab value="text">Text</VTab>
    </VTabs>

    <div class="flex flex-1 justify-between flex-col">
      <div
        class="flex flex-1 flex-col w-full"
        v-if="activeCompressView === 'url'"
      >
        <VTextField
          v-model="url"
          color="primary"
          name="url"
          placeholder="https://gzip.app/api/sample.json"
          prepend-icon=""
          variant="outlined"
          :show-size="1024"
          clearable
          class="w-full"
        />
        <span>Basic Auth</span>
        <div class="flex w-full">
          <VTextField
            v-model="username"
            color="primary"
            placeholder="username"
            type="password"
            prepend-icon=""
            variant="outlined"
            :show-size="1024"
            clearable
            class="w-full"
          />
          <VTextField
            v-model="password"
            color="primary"
            placeholder="password"
            type="password"
            prepend-icon=""
            variant="outlined"
            :show-size="1024"
            clearable
            class="w-full"
          />
        </div>
        <VBtn @click="fetchUrl" color="primary" variant="outlined">get</VBtn>
        <pre class="overflow-auto h-96 w-full"><code>{{
          urlFile
        }}</code></pre>
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
