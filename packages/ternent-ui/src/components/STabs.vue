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
  type: {
    type: String,
    default: "base",
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
  <ul role="tablist" class="flex-grow-0 flex relative">
    <div
      v-if="type === 'lifted'"
      class="absolute h-0 border-b border-base-300 bg-info w-full bottom-0"
    ></div>
    <RouterLink
      v-for="t in items"
      :key="`${t.path}`"
      :to="t.path"
      role="tab"
      class="pb-2 px-4 focus:outline-none border-b-2 z-10 border-transparent hover:border-base-content hover:border-opacity-50 transition-all text-lg font-light"
      :class="{
        '!border-primary border-opacity-80 !font-medium':
          (type === 'base' && !exact && isActiveLink(t)) ||
          (exact && isExactActiveLink(t)),
        '!border-b-0 !border-base-300 !bg-base-200 font-medium':
          ((!exact && isActiveLink(t)) || (exact && isExactActiveLink(t))) &&
          type === 'lifted',
        '!border-base-300 !bg-base-200 !border-b !opacity-50 hover:!opacity-100':
          type === 'lifted' &&
          !exact &&
          !isActiveLink(t) &&
          !isExactActiveLink(t),
      }"
    >
      {{ t.title }}
    </RouterLink>
  </ul>
</template>
