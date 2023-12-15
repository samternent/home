<script setup>
import { SBrandHeader } from "ternent-ui/components";
import { useBreadcrumbs } from "../../module/breadcrumbs/useBreadcrumbs";

useBreadcrumbs({
  path: "/demo/list",
  name: "List demo",
});
</script>
<template>
  <div class="flex flex-col h-full flex-1 p-4">
    <!-- <SBrandHeader>Boards</SBrandHeader> -->
    <div class="flex flex-col flex-1 gap gap-0">
      <SBrandHeader size="md">TODO</SBrandHeader>
      <div class="card bg-base-200 p-4 mt-2 mb-1">
        <p>This is a card</p>
        <p>with more card stuff</p>
      </div>
      <div class="card bg-base-200 p-4 my-1">
        <p>This is a card</p>
        <p>with more card stuff</p>
      </div>
      <div class="card bg-base-200 p-4 my-1">
        <p>This is a card</p>
        <p>with more card stuff</p>
      </div>
      <SBrandHeader size="md">In progress</SBrandHeader>
      <div class="my-2" />
      <div class="card bg-base-200 p-4">
        <p>This is a card</p>
        <p>with more card stuff</p>
      </div>
      <SBrandHeader size="md">Done</SBrandHeader>
      <div class="my-2" />
      <div class="card bg-base-200 p-4">
        <p>This is a card</p>
        <p>with more card stuff</p>
      </div>
    </div>
  </div>
</template>
