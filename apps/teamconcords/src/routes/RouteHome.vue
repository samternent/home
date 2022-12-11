<script lang="ts" setup>
import { shallowRef } from "vue";
</script>
<template>
  <div
    class="w-full flex-1 mx-auto max-w-6xl px-2 flex justify-center flex-col"
  >
    <h1
      class="text-3xl md:text-5xl text-[#d3d3d3] font-light tracking-tighter mt-12 md:mt-16"
    >
      TEAM CONCORDS LIMITED.
    </h1>
    <div class="text-2xl md:text-2xl text-[#adadad] pt-4">
      <p class="font-thin">
        An
        <span class="text-pink-400 font-medium">independent</span>
        software company.
      </p>
    </div>
    <div class="text-2xl md:text-2xl text-[#cecece] pt-4">
      <h3 class="mt-4">What we do</h3>
      <ul class="font-thin">
        <li>
          <a
            href="http://footballsocial.app"
            target="_blank"
            class="league-link"
            >http://footballsocial.app</a
          >
        </li>
        <li>
          <a href="http://concords.app" target="_blank" class="league-link"
            >http://concords.app</a
          >
        </li>
      </ul>
      <h3 class="mt-4">Contact</h3>
      <ul class="font-thin">
        <li>
          <a
            href="mailto:hello@teamconcords.com"
            target="_blank"
            class="league-link"
            >hello@teamconcords.com</a
          >
        </li>
      </ul>
    </div>
  </div>
  <footer
    class="p-4 text-white md:flex md:items-center md:justify-between md:p-6"
  >
    <span class="text-sm sm:text-center text-gray-200">
      <a href="https://www.teamconcords.com/" class="league-link"
        >Team Concords Limited</a
      >
      © 2022.
    </span>
    <ul class="flex flex-wrap items-center mt-3 text-sm text-gray-400 sm:mt-0">
      <!-- <li>
        <RouterLink to="/company/about" class="mr-4 hover:underline md:mr-6"
          >About</RouterLink
        >
      </li>
      <li>
        <RouterLink to="/legal/privacy" class="mr-4 hover:underline md:mr-6"
          >Privacy Policy</RouterLink
        >
      </li>
      <li>
        <RouterLink to="/legal/terms" class="mr-4 hover:underline md:mr-6"
          >Terms of Use</RouterLink
        >
      </li>
      <li>
        <RouterLink to="/company/contact" class="mr-4 hover:underline md:mr-6"
          >Contact</RouterLink
        >
      </li> -->
    </ul>
  </footer>
</template>
