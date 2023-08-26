<script setup>
import { useRouter } from "vue-router";
import GithubSvg from "../assets/github-mark-white.svg";
import { useLocalStorage } from "@vueuse/core";
import { useCurrentUser } from "../composables/useCurrentUser";
import { getPredictionsCount } from "../composables/usePredictionService";
import { watch, onMounted, shallowRef } from "vue";
import api from "../utils/api";
import PredictionsResults from "../components/PredictionsResults.vue";

const router = useRouter();
const lastLeague = useLocalStorage("lastLeague", "PL");
const { user } = useCurrentUser();

const players = shallowRef(0);
const predictionsCount = shallowRef(0);
const table = shallowRef([]);

onMounted(async () => {
  const { data } = await api.get(
    "https://api.footballsocial.app/predict/PL/table"
  );
  players.value = data?.length;
  table.value = data;
  const { count } = await getPredictionsCount();
  predictionsCount.value = count;
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
    class="w-full max-w-6xl mx-auto h-full flex-1 flex md:flex-row flex-col p-4"
  >
    <div class="md:w-1/2 py-6 px-2">
      <h1
        class="bg-gradient-to-r from-white to-70% to-indigo-500 via-40% bg-clip-text text-transparent text-5xl font-black tracking-tighter"
      >
        Football Social<span class="text-pink-700">.</span>
      </h1>
      <h2 class="text-2xl sm:text-3xl font-thin tracking-tighter my-8">
        The friendly football score prediction game.
      </h2>
      <p class="text-2xl font-thin tracking-tighter my-4" v-if="players">
        FootballSocial currently has
        <span class="text-3xl font-medium text-pink-500"> {{ players }} </span>
        active players for the
        <span class="text-2xl font-medium">Premier League</span>... Join in to
        be number
        <span class="text-3xl font-medium text-green-600">{{
          players + 1
        }}</span
        >!
      </p>
      <div class="text-2xl font-thin tracking-tighter my-4 w-full" v-else>
        <div
          class="bg-[#1e1e1e] animate-pulse my-2 rounded flex-1 h-8 w-full"
        />
        <div
          class="bg-[#1e1e1e] animate-pulse my-2 rounded flex-1 h-8 w-full"
        />
      </div>
      <p
        class="text-2xl font-thin tracking-tighter my-12"
        v-if="predictionsCount"
      >
        A total of
        <span class="text-6xl font-thin text-white"
          >{{ predictionsCount }}
        </span>
        predictions have been made.
      </p>
      <div class="text-2xl font-thin tracking-tighter my-12 w-full" v-else>
        <div
          class="bg-[#1e1e1e] animate-pulse my-2 rounded flex-1 h-12 w-full"
        />
      </div>
      <div class="flex text-2xl justify-senter items-end my-8">
        <RouterLink
          aria-label="Login"
          v-if="!user"
          to="/auth/login"
          class="flex items-center mx-2 px-4 py-2 text-md border-2 border-indigo-600 font-bold uppercase"
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
      <p class="text-xl font-light tracking-tighter my-4">
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
    <div class="flex-1 md:w-1/2 items-center flex">
      <div class="h-3/4 overflow-y-scroll w-full">
        <PredictionsResults competitionCode="PL" :private="!user" />
      </div>
    </div>
  </div>
</template>
<style>
.animate-gradient {
  background-size: 200%;
  /* -webkit-animation: animatedgradient 6s ease infinite alternate;
  -moz-animation: animatedgradient 6s ease infinite alternate;
  animation: animatedgradient 3s ease infinite alternate; */
}

@keyframes animatedgradient {
  0% {
    background-position: 0% 50%;
  }
  80% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}
</style>
