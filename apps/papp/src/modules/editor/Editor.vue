<script setup lang="ts">
import { onMounted, onBeforeUnmount, watch, ref } from "vue";
import { Editor, EditorContent } from "@tiptap/vue-3";
import StarterKit from "@tiptap/starter-kit";
import { OnClickOutside } from "@vueuse/components";
import EditorControls from "./EditorControls.vue";

const props = defineProps({
  modelValue: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["save", "update:modelValue"]);
const editor = ref(null);
const showTools = ref(false);

onMounted(() => {
  editor.value = new Editor({
    extensions: [StarterKit],
    content: props.modelValue.value,
    autofocus: false,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl m-5 focus:outline-none min-h-[12rem]",
      },
    },
    onUpdate: () => {
      // HTML
      emit("update:modelValue", editor.value.getHTML());
      // JSON
      // this.$emit('update:modelValue', this.editor.getJSON())
    },
  });
});
onBeforeUnmount(() => {
  editor.value.destroy();
});
watch([() => props.modelValue, editor], ([value]) => {
  if (!editor.value) return;
  // HTML
  const isSame = editor.value.getHTML() === value;
  // JSON
  // const isSame = JSON.stringify(this.editor.getJSON()) === JSON.stringify(value)
  if (isSame) {
    return;
  }
  editor.value.commands.setContent(value, false);
});
</script>
<template>
  <div class="flex-1 flex-col flex group relative h-full">
    <div class="z-20 bg-base-100">
      <div
        v-if="editor"
        class="transition group-hover:opacity-100 flex no-scrollbar justify-between bg-base-100 z-20 overflow-x-auto pt-1"
      >
        <EditorControls :editor="editor" />
      </div>
    </div>
    <EditorContent
      :editor="editor"
      class="flex-1 flex overflow-y-auto text-left rounded px-4 border border-2 border-gray-600 my-4 pb-4"
    />
  </div>
</template>
