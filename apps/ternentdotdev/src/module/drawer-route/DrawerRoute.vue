<script setup>
import { computed } from "vue";
import { SDrawerRight } from "ternent-ui/components";
import { useDrawerRoute } from "./useDrawerRoute";

import ContactDrawer from "../contact/ContactDrawer.vue";

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
    <ContactDrawer v-if="drawerRoutePath === 'contact'" />
  </SDrawerRight>
</template>
