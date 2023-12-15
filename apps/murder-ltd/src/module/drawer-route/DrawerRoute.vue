<script setup>
import { computed } from "vue";
import { SDrawerRight } from "ternent-ui/components";
import { useDrawerRoute } from "./useDrawerRoute";

const { drawerRoutePath, setDrawerRoutePath } = useDrawerRoute();
const isOpen = computed({
  get() {
    return Boolean(drawerRoutePath.value);
  },
  set(value) {
    if (!value) {
      setDrawerRoutePath(null);
    }
  },
});
</script>
<template>
  <SDrawerRight v-model="isOpen">
    <!-- <div v-if="drawerRoutePath === 'contact'" /> -->
  </SDrawerRight>
</template>
