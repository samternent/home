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
  <div class="dropdown dropdown-end">
    <div tabindex="0" role="button" class="btn m-1 btn-ghost btn-sm">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        data-slot="icon"
        class="w-6 h-6"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
        />
      </svg>
    </div>
    <ul
      tabindex="0"
      class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52"
    >
      <li v-for="(item, i) in items" :key="`dropdown_${i}`">
        <RouterLink
          :to="item.path"
          :class="{
            'tab-active !bg-base-200 !text-primary':
              (!exact && isActiveLink(item)) ||
              (exact && isExactActiveLink(item)),
          }"
          >{{ item.title }}</RouterLink
        >
      </li>
    </ul>
  </div>
</template>
