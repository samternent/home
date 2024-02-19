<script setup>
import { computed, shallowRef, watch } from "vue";
import { useLedger } from "./useLedger";

const props = defineProps({
  searchResults: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["update:modelValue"]);

const { getCollections } = useLedger();

const searchTerm = shallowRef();
const searchResults = computed(() => {
  if (!searchTerm.value) return [];
  const collections = getCollections();
  const collectionNames = Object.keys(collections);
  const results = collectionNames.reduce((acc, collectionName) => {
    return [
      ...acc,
      ...collections[collectionName].find({
        "data.completed": { $regex: new RegExp(searchTerm.value, "i") },
      }),
    ];
  }, []);

  return results;
});

const searchInFocus = shallowRef(false);
const shouldShowSearchResults = shallowRef(false);
let timeout = null;

watch(
  searchInFocus,
  (value) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      shouldShowSearchResults.value = value;
    }, 200);
  },
  { immediate: true }
);

function formatContentResult(content) {
  const doc = new DOMParser().parseFromString(content, "text/html");
  const strippedText = doc.body.textContent || "";

  const position = strippedText
    .toLowerCase()
    .indexOf(searchTerm.value.toLowerCase());

  return strippedText
    .substr(position)
    .replace(
      new RegExp(searchTerm.value, "i"),
      `<mark>${searchTerm.value}</mark>`
    );
}

function generateHtml(result) {
  return result.data.name.replace(
    new RegExp(searchTerm.value, "i"),
    `<mark>${searchTerm.value}</mark>`
  );
}
</script>
<template>
  <div class="form-control flex-1 relative z-50 overflow-visible w-96">
    <div class="input-group flex items-center">
      <input
        type="text"
        placeholder="Search…"
        v-model="searchTerm"
        @focus="searchInFocus = true"
        @blur="searchInFocus = false"
        class="input input-bordered w-full input-sm"
      />
      <div class="p-3 opacity-70">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
    </div>
    <div
      v-if="searchResults.length && shouldShowSearchResults"
      class="absolute top-full flex z-50 mt-2 right-10 left-0"
    >
      <ul
        tabindex="0"
        class="p-2 bg-base-200 rounded-box flex-1 shadow-lg border border-base-100"
      >
        <li
          v-for="result in searchResults"
          :key="`${result.id}_${result.content}`"
          @click="searchTerm = ''"
          class="flex"
        >
          <div class="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4 opacity-80"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-3 w-3 mx-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
            <span class="text-primary" v-html="generateHtml(result)" />
          </div>
          <div
            class="truncate w-64"
            v-if="result.content"
            v-html="`..${formatContentResult(result.content)}`"
          />
        </li>
      </ul>
    </div>
  </div>
</template>
