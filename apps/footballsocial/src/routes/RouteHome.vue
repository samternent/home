<script lang="ts" setup>
import { shallowRef } from "vue";
import { competitions } from "../utils/competitions";
</script>
<template>
  <div class="w-full flex-1 mx-auto max-w-2xl px-2">
    <h1
      class="text-5xl md:text-6xl text-white font-bold tracking-tighter shadow-text mt-12 md:mt-16"
    >
      Football Social
    </h1>
    <p class="text-sm md:text-base text-[#cdcdcd]">
      <span class="font-bold"
        ><span class="text-indigo-400">Football</span> Social.
      </span>
      Talk <span class="text-pink-400">Football</span>, with
      <span class="text-yellow-400">Football</span> people.
    </p>
    <ul class="my-16">
      <li
        v-for="competition in competitions"
        :key="competition.code"
        class="my-2 text-3xl md:text-4xl"
      >
        -
        <RouterLink
          :to="`/leagues/${competition.code}`"
          class="ml-4 text-white font-bold tracking-tighter league-link"
        >
          {{ competition.name }}.</RouterLink
        >
      </li>
    </ul>
  </div>
</template>
