<script setup>
import { toRefs, watch } from "vue";
import { useEditor, EditorContent, Extension } from "@tiptap/vue-3";
import Document from "@tiptap/extension-document";
import Mention from "@tiptap/extension-mention";
import Paragraph from "@tiptap/extension-paragraph";
import Bold from "@tiptap/extension-bold";
import Text from "@tiptap/extension-text";
import HardBreak from "@tiptap/extension-hard-break";
import suggestion from "../utils/suggestion";
import { EmojiSearch } from "../utils/tiptap/emoji";

const props = defineProps({
  modelValue: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["update:modelValue", "submit"]);
const { modelValue: text } = toRefs(props);

const editor = useEditor({
  content: text.value,
  onUpdate: () => {
    // HTML
    emit("update:modelValue", editor.value.getHTML());
  },
  editorProps: {
    attributes: {
      class: "max-h-96 overflow-auto py-4 text-lg focus:outline-none",
    },
  },
  extensions: [
    Extension.create({
      addKeyboardShortcuts() {
        return {
          Enter() {
            emit("submit");
            // editor.value.commands.clearContent();
            return true;
          },
          "Shift-Enter"() {
            console.log(editor.value.commands);
            editor.value.commands.setHardBreak();
          },
        };
      },
    }),
    Document,
    Mention.configure({
      HTMLAttributes: {
        class: "mention",
      },
      suggestion,
    }),
    Paragraph,
    Text,
    HardBreak,
    Bold,
    EmojiSearch.configure({
      mentionClass: "emoji",
      suggestion: {
        char: ":",
        items: (q) => {
          if (!q) {
            this.destroySuggestionPopup();
            return [];
          }
          return this.emojiIndex.search(q);
        },
        render: () => ({
          onStart: (args) => {
            this.suggestionType = "emoji";
            this.onStartSuggestions(args);
          },
          // onUpdate: this.onUpdateSuggestions,
          onExit: async () => {
            await this.$nextTick();
            this.resetMentions();
          },
          // onKeyDown: this.onKeyDownHandler,
        }),
      },
    }),
  ],
});

watch(
  text,
  (_text) => {
    const isSame = editor.value?.getHTML() === _text;

    if (isSame) {
      return;
    }

    editor.value?.commands.setContent(_text, false);
  },
  { immediate: true }
);
</script>
<template>
  <EditorContent :editor="editor" />
</template>
