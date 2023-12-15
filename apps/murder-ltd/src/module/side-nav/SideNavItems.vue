<script setup>
import { useDrawerRoute } from "../drawer-route/useDrawerRoute";
import { SButton } from "ternent-ui/components";

const { drawerRoutePath, setDrawerRoutePath } = useDrawerRoute();
</script>
<template>
  <div class="flex flex-col flex-1 w-full items-center py-8 justify-start px-2">
    <SButton
      type="primary"
      @click="setDrawerRoutePath('contact')"
      class="w-full"
      >Contact</SButton
    >
    <div class="my-4"></div>
    <SButton type="ghost" to="/about" class="w-full my-1">About</SButton>
    <SButton type="ghost" to="/work" class="w-full my-1">Work</SButton>
    <!-- <SButton type="ghost" to="/ternent-ui" class="w-full">Ternent UI</SButton> -->
  </div>
</template>
