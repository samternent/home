<script setup lang="ts">
const props = defineProps({
  fileName: {
    type: String,
    default: "concords.json",
  },
  data: {
    type: String,
    required: true,
  },
});
async function saveKey() {
  const filename = props.fileName;
  const blob = new Blob([props.data], { type: "application/x-pem-file" });
  if (window.navigator?.msSaveOrOpenBlob) {
    window.navigator.msSaveBlob(blob, filename);
  } else {
    const elem = window.document.createElement("a");
    elem.href = window.URL.createObjectURL(blob);
    elem.download = filename;
    document.body.appendChild(elem);
    elem.click();
    document.body.removeChild(elem);
  }
}
</script>
<template>
  <VBtn @click="saveKey">
    <slot />
  </VBtn>
</template>
