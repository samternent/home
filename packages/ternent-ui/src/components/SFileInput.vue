<script setup>
import { computed, ref } from "vue";

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

const file = defineModel({ type: [File, Array], required: true });
const filename = defineModel("filename", { type: String, default: "" });

const isDragOver = ref(false);

const sizeClasses = computed(() => ({
  sm: "px-3 py-2 text-sm",
  md: "px-4 py-3 text-base",
  lg: "px-6 py-4 text-lg",
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
    console.error("File processing error:", error);
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
        'border-2 border-dashed rounded-2xl transition-all duration-200 cursor-pointer',
        'hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/20',
        sizeClasses[size],
        isDragOver
          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30'
          : 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50'
      ]"
    >
      <input
        type="file"
        :accept="accept"
        :multiple="multiple"
        @change="uploadFile"
        class="sr-only"
        id="file-upload"
      />
      <label for="file-upload" class="cursor-pointer block text-center">
        <div class="flex flex-col items-center gap-3">
          <div class="p-3 bg-indigo-100 dark:bg-indigo-950/50 rounded-xl">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="w-6 h-6 text-indigo-600 dark:text-indigo-400"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"
              />
            </svg>
          </div>
          <div>
            <p class="text-sm font-medium text-slate-900 dark:text-slate-100">
              Drop files here or click to browse
            </p>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
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
      id="file-input"
    />
    <label
      for="file-input"
      :class="[
        'inline-flex items-center gap-2 border border-base-300 rounded-xl',
        'bg-base-100 hover:bg-base-200',
        'cursor-pointer transition-all duration-200 hover:border-primary',
        'text-base-content font-medium',
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
