<script setup lang="ts">
import { computed, normalizeClass, ref, useAttrs, useId } from "vue";
import { twMerge } from "tailwind-merge";
import { fileInputProps } from "./FileInput.props";
import {
  fileInputButtonBaseClass,
  fileInputButtonSizeClasses,
  fileInputButtonStateClasses,
  fileInputDropzoneBaseClass,
  fileInputDropzoneSizeClasses,
  fileInputDropzoneStateClasses,
  fileInputIconClass,
  fileInputRootClass,
  fileInputTextMutedClass,
  fileInputTextStrongClass,
} from "./FileInput.variants";
import type { FileInputValue } from "./FileInput.types";

defineOptions({ inheritAttrs: false });

const emit = defineEmits<{
  "update:modelValue": [value: FileInputValue];
  "update:filename": [value: string];
}>();

const attrs = useAttrs();
const props = defineProps(fileInputProps);

const inputId = useId();
const isDragOver = ref(false);

const rootClass = computed(() =>
  twMerge(fileInputRootClass, normalizeClass(attrs.class)),
);

const rootAttrs = computed(() => {
  const { class: _class, ...rest } = attrs;
  return rest;
});

const selectedLabel = computed(() => {
  const value = props.modelValue;

  if (Array.isArray(value)) {
    return value.length ? value.map((item) => item.name).join(", ") : props.placeholder;
  }

  return value?.name || props.placeholder;
});

const defaultButtonClass = computed(() =>
  twMerge(
    fileInputButtonBaseClass,
    fileInputButtonSizeClasses[props.size],
    props.invalid ? fileInputButtonStateClasses.invalid : fileInputButtonStateClasses.default,
    props.disabled ? fileInputButtonStateClasses.disabled : "",
  ),
);

const dropzoneClass = computed(() =>
  twMerge(
    fileInputDropzoneBaseClass,
    fileInputDropzoneSizeClasses[props.size],
    props.invalid ? fileInputDropzoneStateClasses.invalid : fileInputDropzoneStateClasses.default,
    isDragOver.value ? fileInputDropzoneStateClasses.drag : "",
    props.disabled ? fileInputDropzoneStateClasses.disabled : "",
  ),
);

function emitFiles(fileList: FileList | File[]) {
  const files = Array.from(fileList);

  if (!files.length) {
    emit("update:modelValue", null);
    emit("update:filename", "");
    return;
  }

  if (props.multiple) {
    emit("update:modelValue", files);
    emit("update:filename", files.map((file) => file.name).join(", "));
    return;
  }

  emit("update:modelValue", files[0] ?? null);
  emit("update:filename", files[0]?.name ?? "");
}

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement;
  emitFiles(target.files ?? []);
}

function handleDragOver(event: DragEvent) {
  if (props.disabled) return;
  event.preventDefault();
  isDragOver.value = true;
}

function handleDragLeave() {
  isDragOver.value = false;
}

function handleDrop(event: DragEvent) {
  if (props.disabled) return;
  event.preventDefault();
  isDragOver.value = false;
  emitFiles(event.dataTransfer?.files ?? []);
}
</script>

<template>
  <div :class="rootClass" v-bind="rootAttrs">
    <input
      :id="inputId"
      class="sr-only"
      type="file"
      :accept="props.accept"
      :multiple="props.multiple"
      :disabled="props.disabled"
      @change="handleInput"
    />

    <label
      v-if="props.variant === 'dropzone'"
      :for="inputId"
      :class="dropzoneClass"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
    >
      <span :class="fileInputIconClass" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" class="size-5">
          <path
            d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </span>
      <span :class="fileInputTextStrongClass">{{ props.dropzoneTitle }}</span>
      <span :class="fileInputTextMutedClass">{{ selectedLabel }}</span>
    </label>

    <label v-else :for="inputId" :class="defaultButtonClass">
      <span :class="fileInputIconClass" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" class="size-5">
          <path
            d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </span>
      <span class="min-w-0">
        <span :class="fileInputTextStrongClass">Upload file</span>
        <span class="block truncate" :class="fileInputTextMutedClass">{{ selectedLabel }}</span>
      </span>
    </label>
  </div>
</template>
