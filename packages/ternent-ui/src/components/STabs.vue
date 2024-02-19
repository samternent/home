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
  <ul
    role="tablist"
    class="tabs tabs-base flex-grow-0 flex relative"
    :class="{
      'tabs-base': type === 'base',
      'tabs-lifted': type === 'lifted',
    }"
  >
    <div
      v-if="type === 'lifted'"
      class="absolute h-0 border-b border-base-300 bg-info w-full bottom-0"
    ></div>
    <RouterLink
      v-for="t in items"
      :key="`${t.path}`"
      :to="t.path"
      role="tab"
      class="tab focus:outline-none border-b-4 z-10 border-transparent hover:border-primary hover:border-opacity-50 transition-all"
      :class="{
        'tab-active !border-primary':
          (type === 'base' && !exact && isActiveLink(t)) ||
          (exact && isExactActiveLink(t)),
        'tab-active !border-b-0 !border-base-300 !bg-base-200 font-medium':
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
