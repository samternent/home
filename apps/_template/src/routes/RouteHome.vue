<script setup lang="ts"></script>
<template>
  <div class="w-full flex-1 flex flex-col">
    <Teleport to="#TopFixedPanel"> </Teleport>
    <Teleport to="#BottomPanelBanner"> </Teleport>
    <Teleport to="#BottomPanelContent"> </Teleport>
  </div>
</template>
