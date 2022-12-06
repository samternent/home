<script setup lang="ts">
import { shallowRef } from "vue";
defineProps({
  editor: {
    type: Object,
    required: true,
  },
});
const password = shallowRef(null);
</script>
<template>
  <div class="flex justify-between flex-1">
    <div class="flex gap-2 justify-start flex-1">
      <button
        @click="editor.chain().focus().toggleBold().run()"
        :class="{ 'text-primary': editor.isActive('bold') }"
        class="btn btn-square btn-sm mr-1 mb-1 opacity-80 hover:opacity-100"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          class="w-6 h-6 fill-current"
        >
          <path fill="none" d="M0 0h24v24H0z" />
          <path
            d="M8 11h4.5a2.5 2.5 0 1 0 0-5H8v5zm10 4.5a4.5 4.5 0 0 1-4.5 4.5H6V4h6.5a4.5 4.5 0 0 1 3.256 7.606A4.498 4.498 0 0 1 18 15.5zM8 13v5h5.5a2.5 2.5 0 1 0 0-5H8z"
          />
        </svg>
      </button>
      <button
        @click="editor.chain().focus().toggleItalic().run()"
        :class="{ 'text-primary': editor.isActive('italic') }"
        class="btn btn-square btn-sm mr-1 mb-1 opacity-80 hover:opacity-100"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          class="w-6 h-6 fill-current"
        >
          <path fill="none" d="M0 0h24v24H0z" />
          <path d="M15 20H7v-2h2.927l2.116-12H9V4h8v2h-2.927l-2.116 12H15z" />
        </svg>
      </button>
      <button
        @click="editor.chain().focus().toggleStrike().run()"
        :class="{ 'text-primary': editor.isActive('strike') }"
        class="btn btn-square btn-sm mr-1 mb-1 opacity-80 hover:opacity-100"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          class="w-6 h-6 fill-current"
        >
          <path fill="none" d="M0 0h24v24H0z" />
          <path
            d="M17.154 14c.23.516.346 1.09.346 1.72 0 1.342-.524 2.392-1.571 3.147C14.88 19.622 13.433 20 11.586 20c-1.64 0-3.263-.381-4.87-1.144V16.6c1.52.877 3.075 1.316 4.666 1.316 2.551 0 3.83-.732 3.839-2.197a2.21 2.21 0 0 0-.648-1.603l-.12-.117H3v-2h18v2h-3.846zm-4.078-3H7.629a4.086 4.086 0 0 1-.481-.522C6.716 9.92 6.5 9.246 6.5 8.452c0-1.236.466-2.287 1.397-3.153C8.83 4.433 10.271 4 12.222 4c1.471 0 2.879.328 4.222.984v2.152c-1.2-.687-2.515-1.03-3.946-1.03-2.48 0-3.719.782-3.719 2.346 0 .42.218.786.654 1.099.436.313.974.562 1.613.75.62.18 1.297.414 2.03.699z"
          />
        </svg>
      </button>
      <button
        @click="editor.chain().focus().toggleCode().run()"
        :class="{ 'text-primary': editor.isActive('code') }"
        class="btn btn-square btn-sm mr-1 mb-1 opacity-80 hover:opacity-100"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          class="w-6 h-6 fill-current"
        >
          <path fill="none" d="M0 0h24v24H0z" />
          <path
            d="M23 12l-7.071 7.071-1.414-1.414L20.172 12l-5.657-5.657 1.414-1.414L23 12zM3.828 12l5.657 5.657-1.414 1.414L1 12l7.071-7.071 1.414 1.414L3.828 12z"
          />
        </svg>
      </button>
      <!-- <button @click="editor.chain().focus().unsetAllMarks().run()">
    clear marks
  </button>
  <button @click="editor.chain().focus().clearNodes().run()">
    clear nodes
  </button> -->
      <button
        @click="editor.chain().focus().setParagraph().run()"
        :class="{ 'text-primary': editor.isActive('paragraph') }"
        class="btn btn-square btn-sm mr-1 mb-1 opacity-80 hover:opacity-100"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          class="w-6 h-6 fill-current"
        >
          <path fill="none" d="M0 0h24v24H0z" />
          <path
            d="M12 6v15h-2v-5a6 6 0 1 1 0-12h10v2h-3v15h-2V6h-3zm-2 0a4 4 0 1 0 0 8V6z"
          />
        </svg>
      </button>
      <button
        @click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
        :class="{ 'text-primary': editor.isActive('heading', { level: 1 }) }"
        class="btn btn-square btn-sm mr-1 mb-1 opacity-80 hover:opacity-100"
      >
        h1
      </button>
      <button
        @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
        :class="{ 'text-primary': editor.isActive('heading', { level: 2 }) }"
        class="btn btn-square btn-sm mr-1 mb-1 opacity-80 hover:opacity-100"
      >
        h2
      </button>
      <button
        @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
        :class="{ 'text-primary': editor.isActive('heading', { level: 3 }) }"
        class="btn btn-square btn-sm mr-1 mb-1 opacity-80 hover:opacity-100"
      >
        h3
      </button>
      <button
        @click="editor.chain().focus().toggleHeading({ level: 4 }).run()"
        :class="{ 'text-primary': editor.isActive('heading', { level: 4 }) }"
        class="btn btn-square btn-sm mr-1 mb-1 opacity-80 hover:opacity-100"
      >
        h4
      </button>
      <!-- <button @click="editor.chain().focus().toggleHeading({ level: 5 }).run()" :class="{ 'text-primary': editor.isActive('heading', { level: 5 }) }">
    h5
  </button>
  <button @click="editor.chain().focus().toggleHeading({ level: 6 }).run()" :class="{ 'text-primary': editor.isActive('heading', { level: 6 }) }">
    h6
  </button> -->
      <button
        @click="editor.chain().focus().toggleBulletList().run()"
        :class="{ 'text-primary': editor.isActive('bulletList') }"
        class="btn btn-square btn-sm mr-1 mb-1 opacity-80 hover:opacity-100"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          class="w-6 h-6 fill-current"
        >
          <path fill="none" d="M0 0h24v24H0z" />
          <path
            d="M8 4h13v2H8V4zM4.5 6.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm0 7a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm0 6.9a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM8 11h13v2H8v-2zm0 7h13v2H8v-2z"
          />
        </svg>
      </button>
      <button
        @click="editor.chain().focus().toggleOrderedList().run()"
        :class="{ 'text-primary': editor.isActive('orderedList') }"
        class="btn btn-square btn-sm mr-1 mb-1 opacity-80 hover:opacity-100"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          class="w-6 h-6 fill-current"
        >
          <path fill="none" d="M0 0h24v24H0z" />
          <path
            d="M8 4h13v2H8V4zM5 3v3h1v1H3V6h1V4H3V3h2zM3 14v-2.5h2V11H3v-1h3v2.5H4v.5h2v1H3zm2 5.5H3v-1h2V18H3v-1h3v4H3v-1h2v-.5zM8 11h13v2H8v-2zm0 7h13v2H8v-2z"
          />
        </svg>
      </button>
      <button
        @click="editor.chain().focus().toggleCodeBlock().run()"
        :class="{ 'text-primary': editor.isActive('codeBlock') }"
        class="btn btn-square btn-sm mr-1 mb-1 opacity-80 hover:opacity-100"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          class="w-6 h-6 fill-current"
        >
          <path fill="none" d="M0 0h24v24H0z" />
          <path
            d="M3 3h18a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm1 2v14h16V5H4zm16 7l-3.536 3.536-1.414-1.415L17.172 12 15.05 9.879l1.414-1.415L20 12zM6.828 12l2.122 2.121-1.414 1.415L4 12l3.536-3.536L8.95 9.88 6.828 12zm4.416 5H9.116l3.64-10h2.128l-3.64 10z"
          />
        </svg>
      </button>
      <button
        @click="editor.chain().focus().toggleBlockquote().run()"
        :class="{ 'text-primary': editor.isActive('blockquote') }"
        class="btn btn-square btn-sm mr-1 mb-1 opacity-80 hover:opacity-100"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          class="w-6 h-6 fill-current"
        >
          <path fill="none" d="M0 0h24v24H0z" />
          <path
            d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 0 1-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 0 1-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z"
          />
        </svg>
      </button>
      <button
        @click="editor.chain().focus().setHorizontalRule().run()"
        class="btn btn-square btn-sm mr-1 mb-1 opacity-80 hover:opacity-100"
      >
        hr
      </button>
      <!-- <button @click="editor.chain().focus().setHardBreak().run()" class="btn btn-square btn-sm mr-1 mb-1 opacity-80 hover:opacity-100">
    hard break
  </button> -->
      <button
        @click="editor.chain().focus().undo().run()"
        class="btn btn-square btn-sm mr-1 mb-1 opacity-80 hover:opacity-100"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          class="w-6 h-6 fill-current"
        >
          <path fill="none" d="M0 0h24v24H0z" />
          <path
            d="M5.828 7l2.536 2.536L6.95 10.95 2 6l4.95-4.95 1.414 1.414L5.828 5H13a8 8 0 1 1 0 16H4v-2h9a6 6 0 1 0 0-12H5.828z"
          />
        </svg>
      </button>
      <button
        @click="editor.chain().focus().redo().run()"
        class="btn btn-square btn-sm mr-1 mb-1 opacity-80 hover:opacity-100"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          class="w-6 h-6 fill-current"
        >
          <path fill="none" d="M0 0h24v24H0z" />
          <path
            d="M18.172 7H11a6 6 0 1 0 0 12h9v2h-9a8 8 0 1 1 0-16h7.172l-2.536-2.536L17.05 1.05 22 6l-4.95 4.95-1.414-1.414L18.172 7z"
          />
        </svg>
      </button>
    </div>
    <div>
      <button
        @click="$emit('encrypt', password)"
        class="btn btn-square btn-sm mr-1 mb-1 opacity-80 hover:opacity-100"
      >
        🔐
      </button>
    </div>
  </div>
</template>
