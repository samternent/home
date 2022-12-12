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
      <!-- concords.app -->
    </h1>
    <div class="text-2xl md:text-4xl text-[#adadad] pt-4 font-thin">
      <span class="text-pink-500 font-medium">Concord: </span>
      <span class="text-yellow-500">noun.</span>
      <p>agreement or harmony between people or groups.</p>
    </div>
  </div>
  <footer
    class="p-4 text-white md:flex md:items-center md:justify-between md:p-6"
  >
    <span class="text-sm sm:text-center text-gray-200">
      <a href="https://www.concords.app/" class="league-link"
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
