<script setup>
import { shallowRef, computed } from "vue";
import { tryOnBeforeMount } from "@vueuse/core";
import { marked } from "marked";
import DOMPurify from "dompurify";

const clean = DOMPurify.sanitize("<b>hello there</b>");

const changelogMarkdown = shallowRef();

tryOnBeforeMount(async () => {
  const changelogs = await fetch(
    "https://raw.githubusercontent.com/samternent/home/main/apps/ternentdotdev/CHANGELOG.md"
  );
  changelogMarkdown.value = await changelogs.text();
});

const changelog = computed(() =>
  changelogMarkdown.value
    ? DOMPurify.sanitize(marked.parse(changelogMarkdown.value))
    : "loading..."
);
</script>
<template>
  <div class="flex-1 flex w-full">
    <div class="flex-1 md" v-html="changelog" />
  </div>
</template>
<style>
.md h1 {
  font-size: 2.8em;
  margin-bottom: 0.2em;
  font-weight: 100;
  position: sticky;
  top: 1em;
  background-color: var(--vf-bg-base-100);
}
.md h2 {
  font-size: 2em;
  margin-bottom: 0.1em;
  margin-top: 0.4em;
  font-weight: 200;
}
.md h3 {
  font-size: 1.8em;
  margin-bottom: 0.1em;
  font-weight: 100;
}
.md a {
  color: var(--vf-primary);
}
</style>
