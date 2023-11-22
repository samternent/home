<script setup>
import { useRouter } from "vue-router";
import GithubSvg from "../assets/github-mark-white.svg";
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
        <span
          v-else
          class="bg-[#3e3e3e] inline-block animate-pulse h-6 w-10 rounded mx-1"
        />
        predictions from
        <span v-if="players" class="text-3xl font-medium">
          {{ players }}
        </span>
        <span
          v-else
          class="bg-[#3e3e3e] inline-block animate-pulse h-6 w-8 rounded mx-1"
        />
        players, across
        <span class="text-3xl font-medium">7 </span> leagues.
      </p>

      <div class="flex text-2xl justify-senter items-center my-12">
        <SButton
          aria-label="Login"
          v-if="!user"
          to="/auth/login"
          class="btn-primary"
          type="primary"
        >
          Login
        </SButton>
        <span class="font-thin text-2xl mx-2">or</span>
        <SButton
          aria-label="Signup"
          v-if="!user"
          to="/auth/signup"
          class="btn-secondary"
          type="secondary"
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
          <img :src="GithubSvg" class="h-6 w-6 inline mr-2" />
          samternent/home/apps/footballsocial
        </a>
        <a
          href="https://github.com/samternent/home/tree/main/apps/footballsocial-api"
          class="block my-2 hover:text-indigo-300 transition-all"
          target="_blank"
        >
          <img :src="GithubSvg" class="h-6 w-6 inline mr-2" />
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
