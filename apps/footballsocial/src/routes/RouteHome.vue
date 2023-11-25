<script setup>
import { useRouter } from "vue-router";
import { useLocalStorage } from "@vueuse/core";
import { useCurrentUser } from "../composables/useCurrentUser";
import { usePredictionService } from "../composables/usePredictionService";
import { watch, onMounted, shallowRef } from "vue";

import { SBrandHeader, SButton } from "ternent-ui/components";

const router = useRouter();
const lastLeague = useLocalStorage("lastLeague", "PL");
const { user } = useCurrentUser();
const { fetchLandingStats } = usePredictionService();

const players = shallowRef(0);
const predictionsCount = shallowRef(0);
const table = shallowRef([]);

onMounted(async () => {
  const { data } = await fetchLandingStats();
  players.value = data?.users;
  predictionsCount.value = data?.predictions;
  table.value = data?.table;
});

watch(
  user,
  (_user) => {
    if (_user) {
      router.push({
        path: `/leagues/${!lastLeague.value ? "PL" : lastLeague.value}`,
      });
    }
  },
  { immediate: true }
);
</script>
<template>
  <div
    class="w-full max-w-3xl mx-auto h-full flex-1 flex lg:flex-row flex-col p-4"
  >
    <div class="py-6 px-2">
      <SBrandHeader>Football Social</SBrandHeader>
      <h2 class="text-2xl sm:text-3xl font-light tracking-tighter mt-2 mb-12">
        The friendly football score prediction game.
      </h2>
      <p class="text-2xl font-thin tracking-tighter my-4">
        With
        <span v-if="predictionsCount" class="text-3xl font-medium"
          >{{ predictionsCount }}
        </span>
        <span v-else class="skeleton inline-block h-6 w-10 mx-1" />
        predictions from
        <span v-if="players" class="text-3xl font-medium">
          {{ players }}
        </span>
        <span v-else class="skeleton inline-block h-6 w-8 mx-1" />
        players, across
        <span class="text-3xl font-medium">7 </span> leagues.
      </p>

      <div class="flex text-2xl justify-senter items-center my-12">
        <SButton
          aria-label="Login"
          v-if="!user"
          to="/auth/login"
          type="primary"
        >
          Login
        </SButton>
        <span class="font-thin text-2xl mx-2">or</span>
        <SButton
          aria-label="Join"
          v-if="!user"
          to="/auth/signup"
          class="btn-outline"
          type="primary"
        >
          Join
        </SButton>
      </div>
      <p class="text-lg font-light tracking-tighter my-4 mt-16">
        If you're here to look at the code, it's open-source on Github.
        <a
          href="https://github.com/samternent/home/tree/main/apps/footballsocial"
          class="block my-2 hover:text-indigo-300 transition-all"
          target="_blank"
        >
          <svg
            width="98"
            height="96"
            viewBox="0 0 100 100"
            class="inline w-6 h-6 mr-2"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"
              fill="currentColor"
            />
          </svg>
          samternent/home/apps/footballsocial
        </a>
        <a
          href="https://github.com/samternent/home/tree/main/apps/footballsocial-api"
          class="block my-2 hover:text-indigo-300 transition-all"
          target="_blank"
        >
          <svg
            width="98"
            height="96"
            viewBox="0 0 100 100"
            class="inline w-6 h-6 mr-2"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"
              fill="currentColor"
            />
          </svg>
          samternent/home/apps/footballsocial-api
        </a>
      </p>
    </div>
  </div>
</template>
<style>
.animate-gradient {
  background-size: 200%;
  animation: animatedgradient 10s ease infinite alternate;
}

@keyframes animatedgradient {
  0% {
    background-position: 0% 100%;
  }
  100% {
    background-position: 50% 100%;
  }
}
</style>
