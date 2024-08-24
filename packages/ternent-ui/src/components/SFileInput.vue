<script setup>
const file = defineModel({ type: File, required: true });
const filename = defineModel("filename", { type: String, default: "" });

function readFileAsync(file) {
  return new Promise((resolve, reject) => {
    let reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result);
    };

    reader.onerror = reject;

    reader.readAsArrayBuffer(file);
  });
}

async function uploadFile(e) {
  const _files = e.target.files;

  const fileBuffer = await readFileAsync(_files[0]);
  const stream = new Blob([fileBuffer], { type: _files[0].type }).stream();

  const compressedReadableStream = stream.pipeThrough(
    new CompressionStream("gzip")
  );
  const compressedFiles = await new Response(compressedReadableStream).blob();

  file.value = compressedFiles;
  filename.value = _files[0].name;
}
</script>
<template>
  <input
    type="file"
    class="file-input file-input-bordered file-input-lg w-full max-w-xs"
    @change="uploadFile"
  />
</template>
