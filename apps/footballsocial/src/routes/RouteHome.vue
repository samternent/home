<script setup>
import { useRouter } from "vue-router";
import GithubSvg from "../assets/github-mark-white.svg";
import { useLocalStorage } from "@vueuse/core";
import { useCurrentUser } from "../composables/useCurrentUser";
import { usePredictionService } from "../composables/usePredictionService";
import { watch, onMounted, shallowRef } from "vue";
import PredictionsResults from "../components/PredictionsResults.vue";

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
      <h1
        class="bg-gradient-to-r from-white to-70% to-indigo-500 via-40% bg-clip-text text-transparent text-5xl font-bold tracking-tighter"
      >
        Football Social<span class="text-pink-700">.</span>
      </h1>
      <h2 class="text-2xl sm:text-3xl font-light tracking-tighter mt-2 mb-12">
        The friendly football score prediction game.
      </h2>
      <p class="text-2xl font-thin tracking-tighter my-4">
        With
        <span class="text-3xl font-medium text-white"
          >{{ predictionsCount || "___" }}
        </span>
        predictions from
        <span class="text-3xl font-medium">
          {{ players || "__" }}
        </span>
        players, across
        <span class="text-3xl font-medium text-white">7 </span> leagues.
      </p>

      <div class="flex text-2xl justify-senter items-end my-12">
        <RouterLink
          aria-label="Login"
          v-if="!user"
          to="/auth/login"
          class="flex items-center mx-2 px-4 py-2 text-md border-2 border-indigo-600 font-medium uppercase"
        >
          Login
        </RouterLink>
        <span class="font-thin text-2xl mx-6">or</span>
        <RouterLink
          aria-label="Signup"
          v-if="!user"
          to="/auth/signup"
          class="flex items-center mx-2 px-4 py-2 text-md font-bold uppercase text-gray-900 bg-white"
        >
          Join
        </RouterLink>
      </div>
      <p class="text-lg font-light tracking-tighter my-4 mt-16">
        If you're here to look at the code, it's open-source on Github.
        <a
          href="https://github.com/samternent/home/tree/main/apps/footballsocial"
          class="block my-2 hover:text-indigo-300 transition-all"
          target="_blank"
        >
          <img :src="GithubSvg" class="h-6 w-6 inline mr-2" />
          samternent/home/apps/footballsocial
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
