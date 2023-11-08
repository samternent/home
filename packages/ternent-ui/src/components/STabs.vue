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
  <ul class="tabs">
    <RouterLink
      v-for="t in items"
      :key="`${t.path}`"
      :to="t.path"
      class="tab tab-bordered font-light"
      :class="{
        'tab-active':
          (!exact && isActiveLink(t)) || (exact && isExactActiveLink(t)),
      }"
    >
      {{ t.title }}
    </RouterLink>
  </ul>
</template>
