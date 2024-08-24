<script setup>
import { shallowRef, watch, computed } from "vue";
import { useLocalStorage } from "@vueuse/core";
import { SFileInput } from "ternent-ui/components";

const compressedFile = defineModel({ type: File, required: true });
const filename = defineModel("filename", { type: String, required: "" });

const emit = defineEmits(["update:modelValue", "update:filename"]);

const activeCompressView = useLocalStorage("activeCompressView", "url");

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
      return new TextEncoder().encode(JSON.stringify(urlFile.value)).length;
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
    <div class="flex flex-1 justify-center items-center">
      <SFileInput v-model="compressedFile" v-model:filename="filename" />
    </div>
  </div>
</template>
