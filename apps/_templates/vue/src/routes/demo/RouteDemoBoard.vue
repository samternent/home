<script setup>
import { SBrandHeader } from "ternent-ui/components";
</script>
<template>
  <div class="flex flex-col h-full flex-1 p-4">
    <!-- <SBrandHeader>Boards</SBrandHeader> -->
    <div class="flex flex-1 gap gap-6 py-4">
      <div class="w-96 shrink-0">
        <SBrandHeader size="md">TODO</SBrandHeader>
        <div class="card bg-base-200 p-4 my-2">
          <p>This is a card</p>
          <p>with more card stuff</p>
        </div>
        <div class="card bg-base-200 p-4 my-2">
          <p>This is a card</p>
          <p>with more card stuff</p>
        </div>
        <div class="card bg-base-200 p-4 my-2">
          <p>This is a card</p>
          <p>with more card stuff</p>
        </div>
      </div>
      <div class="w-96 shrink-0">
        <SBrandHeader size="md">In progress</SBrandHeader>
        <div class="my-2" />
        <div class="card bg-base-200 p-4">
          <p>This is a card</p>
          <p>with more card stuff</p>
        </div>
      </div>
      <div class="w-96 shrink-0">
        <SBrandHeader size="md">Done</SBrandHeader>
        <div class="my-2" />
        <div class="card bg-base-200 p-4">
          <p>This is a card</p>
          <p>with more card stuff</p>
        </div>
      </div>
    </div>
  </div>
</template>
