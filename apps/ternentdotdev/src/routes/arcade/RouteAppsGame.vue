<script setup>
import Game from "@/module/game/Game.vue";
import { useBreadcrumbs } from "../../module/breadcrumbs/useBreadcrumbs";

useBreadcrumbs({
  path: "/arcade/game",
  name: "Game",
});
</script>

<template>
  <div class="relative overflow-hidden shadow-xl w-full h-full flex-1">
    <Game />
  </div>
</template>
