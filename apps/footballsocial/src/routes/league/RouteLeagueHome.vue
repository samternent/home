<script setup>
import { computed, toRefs, watch, shallowRef } from "vue";
import { useRoute } from "vue-router";
import { useTitle, useLocalStorage } from "@vueuse/core";
import { useCompetitionLoader } from "../../api/football-data/useCompetitionLoader";

import { STabs } from "ternent-ui/components";

const props = defineProps({
  competitionCode: {
    type: String,
    required: true,
  },
  gameweek: {
    type: Number,
    default: null,
  },
  season: {
    type: String,
    default: null,
  },
});

const { competitionCode } = toRefs(props);
const title = useTitle();
const route = useRoute();

const { items: competition, hasItems: hasCompetition } = useCompetitionLoader();

const crestMap = {
  DED: "ED",
};

const tabs = computed(() => [
  {
    title: "Predictions",
    path: `/leagues/${competitionCode.value}/predictions`,
  },
  { title: "Table", path: `/leagues/${competitionCode.value}/table` },
  // { title: "Leagues", path: `/leagues/${competitionCode.value}/leagues` },
  // {
  //   title: "Discussions",
  //   path: `/leagues/${competitionCode.value}/discussions`,
  // },
]);

watch(
  competition,
  (_competition) => {
    if (_competition?.name) {
      title.value = `${_competition.name}  - Football Social`;
    }
  },
  { immediate: true }
);

const dismissFeatureBanner = useLocalStorage(
  "footballsocial/dismissFeatureBanner",
  false
);
const dismissProductHuntBanner = useLocalStorage(
  "footballsocial/dismissProductHuntBanner",
  false
);
</script>
<template>
  <STabs :items="tabs" :path="route.path" />
  <!-- Banner -->
  <!-- <div
    v-if="!dismissProductHuntBanner"
    class="bg-opacity-20 w-full rounded-lg my-4 border-dashed borde p-4"
  >
    <div
      @click="dismissProductHuntBanner = true"
      class="cursor-pointer float-right transition-colors"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        class="w-6 h-6"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    </div>
    <p class="text-xl font-thin">
      Enjoying
      <span class="transition-all font-medium tracking-tighter">
        Football Social<span class="text-pink-700">.</span></span
      >?
    </p>
    <p class="font-thin py-2 text-lg">
      Please consider leaving an upvote or comment on
      <a
        href="https://www.producthunt.com/posts/football-social"
        target="_blank"
        class="league-link font-medium"
        >ProductHunt.com</a
      >.
    </p>
  </div>
  <div
    v-else-if="!dismissFeatureBanner"
    class="bg-indigo-700 bg-opacity-20 w-full rounded-lg my-4 border-dashed border border-indigo-300 p-4"
  >
    <div
      @click="dismissFeatureBanner = true"
      class="cursor-pointer float-right text-indigo-300 hover:text-indigo-500 transition-colors"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        class="w-6 h-6"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    </div>
    <p class="text-xl font-thin">
      Thank you for playing
      <span
        class="bg-gradient-to-r from-white to-70% to-indigo-100 transition-all via-40% bg-clip-text text-transparent font-medium tracking-tighter"
      >
        Football Social<span class="text-pink-700">.</span></span
      >.
    </p>
    <p class="font-thin py-2 text-lg">
      If you have any issues, feedback or feature requests, please use
      <a
        href="https://sam.staging.teamwork.com/p/forms/PBLRygLcpZ6NjG0Zlaoe"
        target="_blank"
        class="league-link font-light"
        >this form</a
      >, or the link in the footer<span
        class="font-black text-base text-pink-700"
        >.</span
      >
    </p>
  </div> -->

  <div class="flex mb-16 w-full mt-4">
    <RouterView />
  </div>
</template>
