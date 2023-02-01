<script setup lang="ts">
import { useRouter } from "vue-router";
import { useLoadingBar } from "naive-ui";

const router = useRouter();
const loadingBar = useLoadingBar();

router.beforeEach(loadingBar.start);
router.afterEach(loadingBar.finish);
</script>
<template>
  <div class="flex flex-col h-screen py-4">
    <RouterView />
    <footer
      class="p-4 text-white md:flex md:items-center md:justify-between md:p-6 mt-8"
    >
      <span class="text-sm sm:text-center text-white">
        <a href="https://www.teamconcords.com" class="league-link"
          >Team Concords Limited</a
        >
        © 2022.
      </span>
      <ul class="flex flex-wrap items-center mt-3 text-sm text-white sm:mt-0">
        <li>
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
        </li>
      </ul>
    </footer>
  </div>
</template>
