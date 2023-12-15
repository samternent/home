<script setup>
const props = defineProps({
  items: {
    type: Array,
    required: true,
  },
  path: {
    type: String,
    required: true,
  },
  exact: {
    type: Boolean,
    default: false,
  },
});

function isActiveLink(t) {
  return new RegExp(`${t.path}*`, "g").test(props.path);
}
function isExactActiveLink(t) {
  return new RegExp(`^${t.path}$`, "g").test(props.path);
}
</script>
<template>
  <ul role="tablist" class="tabs tabs-base flex-grow-0 flex">
    <RouterLink
      v-for="t in items"
      :key="`${t.path}`"
      :to="t.path"
      role="tab"
      class="tab focus:outline-none border-b-4 border-transparent hover:border-primary hover:border-opacity-50 transition-all"
      :class="{
        'tab-active !border-primary':
          (!exact && isActiveLink(t)) || (exact && isExactActiveLink(t)),
      }"
    >
      {{ t.title }}
    </RouterLink>
  </ul>
</template>
