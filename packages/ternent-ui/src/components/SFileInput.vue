<script setup>
import { computed, ref, useId } from "vue";

const props = defineProps({
  accept: {
    type: String,
    default: "*/*",
  },
  multiple: {
    type: Boolean,
    default: false,
  },
  maxSize: {
    type: Number,
    default: null, // in bytes
  },
  compress: {
    type: Boolean,
    default: false,
  },
  variant: {
    type: String,
    default: "default",
    validator: (value) => ["default", "dropzone"].includes(value),
  },
  size: {
    type: String,
    default: "md",
    validator: (value) => ["sm", "md", "lg"].includes(value),
  },
  placeholder: {
    type: String,
    default: "Choose file...",
  },
});

const emit = defineEmits(["error"]);
const file = defineModel({ type: [File, Array], required: true });
const filename = defineModel("filename", { type: String, default: "" });

const isDragOver = ref(false);
const inputId = useId();

const sizeClasses = computed(() => ({
  sm: "px-3 py-2 text-sm",
  md: "px-4 py-3 text-sm",
  lg: "px-5 py-3 text-base",
}));

function readFileAsync(file) {
  return new Promise((resolve, reject) => {
    let reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

async function processFile(rawFile) {
  if (props.maxSize && rawFile.size > props.maxSize) {
    throw new Error(`File size exceeds ${props.maxSize} bytes`);
  }

  if (!props.compress) {
    return rawFile;
  }

  const fileBuffer = await readFileAsync(rawFile);
  const stream = new Blob([fileBuffer], { type: rawFile.type }).stream();
  const compressedReadableStream = stream.pipeThrough(new CompressionStream("gzip"));
  return await new Response(compressedReadableStream).blob();
}

async function uploadFile(e) {
  const files = Array.from(e.target.files || []);
  
  try {
    if (props.multiple) {
      const processedFiles = await Promise.all(files.map(processFile));
      file.value = processedFiles;
      filename.value = files.map(f => f.name).join(", ");
    } else {
      const processedFile = await processFile(files[0]);
      file.value = processedFile;
      filename.value = files[0].name;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "File processing error";
    emit("error", message);
  }
}

function handleDrop(e) {
  e.preventDefault();
  isDragOver.value = false;
  const files = Array.from(e.dataTransfer.files);
  uploadFile({ target: { files } });
}

function handleDragOver(e) {
  e.preventDefault();
  isDragOver.value = true;
}

function handleDragLeave() {
  isDragOver.value = false;
}
</script>
<template>
  <div v-if="variant === 'dropzone'" class="w-full">
    <div
      @drop="handleDrop"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      :class="[
        'border-2 border-dashed rounded-[var(--ui-radius-lg)] transition-all duration-200 cursor-pointer',
        'border-[var(--ui-border)] bg-[var(--ui-surface)] text-[var(--ui-fg-muted)]',
        'hover:bg-[var(--ui-surface-hover)]',
        sizeClasses[size],
        isDragOver
          ? 'border-[var(--ui-primary)] bg-[var(--ui-primary-muted)] text-[var(--ui-fg)]'
          : ''
      ]"
    >
      <input
        type="file"
        :accept="accept"
        :multiple="multiple"
        @change="uploadFile"
        class="sr-only"
        :id="inputId"
      />
      <label :for="inputId" class="cursor-pointer block text-center">
        <div class="flex flex-col items-center gap-3">
          <div class="rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface-hover)] p-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="h-6 w-6 text-[var(--ui-fg-muted)]"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"
              />
            </svg>
          </div>
          <div>
            <p class="text-sm font-medium text-[var(--ui-fg)]">
              Drop files here or click to browse
            </p>
            <p class="mt-1 text-xs text-[var(--ui-fg-muted)]">
              {{ placeholder }}
            </p>
          </div>
        </div>
      </label>
    </div>
  </div>

  <div v-else class="relative">
    <input
      type="file"
      :accept="accept"
      :multiple="multiple"
      @change="uploadFile"
      class="sr-only"
      :id="inputId"
    />
    <label
      :for="inputId"
      :class="[
        'inline-flex items-center gap-2 rounded-[var(--ui-radius-md)] border border-[var(--ui-border)]',
        'cursor-pointer bg-[var(--ui-surface)] font-medium text-[var(--ui-fg)]',
        'transition-all duration-200 hover:bg-[var(--ui-surface-hover)] hover:border-[var(--ui-primary)]',
        sizeClasses[size]
      ]"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        class="w-5 h-5"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"
        />
      </svg>
      {{ filename || placeholder }}
    </label>
  </div>
</template>
