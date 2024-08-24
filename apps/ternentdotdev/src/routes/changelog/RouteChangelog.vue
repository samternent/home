<script setup>
import { shallowRef, computed, watch } from "vue";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { useBreadcrumbs } from "@/module/breadcrumbs/useBreadcrumbs";

const props = defineProps({
  type: {
    type: String,
    required: true,
    validator: (value) => ["apps", "packages"].includes(value),
  },
  name: {
    type: String,
    required: true,
  },
});

const clean = DOMPurify.sanitize("<b>hello there</b>");

const changelogMarkdown = shallowRef();

async function loadMarkdown() {
  const changelogs = await fetch(
    `https://raw.githubusercontent.com/samternent/home/main/${props.type}/${props.name}/CHANGELOG.md`
  );
  changelogMarkdown.value = await changelogs.text();
}

const changelog = computed(() =>
  changelogMarkdown.value
    ? DOMPurify.sanitize(marked.parse(changelogMarkdown.value))
    : "loading..."
);
useBreadcrumbs({
  path: `/changelogs/${props.type}/${props.name}`,
  name: props.name,
});

watch([() => props.type, () => props.name], loadMarkdown, { immediate: true });
</script>
<template>
  <div class="flex-1 flex w-full p-4 bg-base-100">
    <div class="flex-1 md mx-auto max-w-4xl" v-html="changelog" />
  </div>
</template>
<style>
.md h1 {
  font-size: 2.8em;
  margin-bottom: 0.2em;
  font-weight: 400;
  background-color: var(--vf-bg-base-100);
}
.md h2 {
  font-size: 2em;
  margin-bottom: 0.1em;
  margin-top: 0.4em;
  font-weight: 200;
}
.md h3 {
  font-size: 1.6em;
  margin-bottom: 0.1em;
  font-weight: 200;
}
.md a {
  color: var(--vf-primary);
}
</style>
