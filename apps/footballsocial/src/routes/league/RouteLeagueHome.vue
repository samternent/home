<script setup>
import { computed, toRefs, watch, shallowRef } from "vue";
import { useRoute } from 'vue-router';
import { useTitle } from "@vueuse/core";
import { useCompetitionLoader } from "../../api/football-data/useCompetitionLoader";

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
const crest = computed(
  () => crestMap[competitionCode.value] || competitionCode.value
);
const tabs = shallowRef(["predictions", "standings"]);

watch(
  competition,
  (_competition) => {
    if (_competition?.name) {
      title.value = `${_competition.name}  - Football Social`;
    }
  },
  { immediate: true }
);

function isActiveLink(t) {
  const regex = new RegExp(`/leagues/${competitionCode.value}/${t}*`, 'g');
  return regex.test(route.path);
}
</script>
<template>
  <ul
    class="flex max-w-[100vw] overflow-x-auto h-auto py-4 overflow-y-hidden"
  >
    <li v-for="t in tabs" :key="`${t}`">
      <RouterLink
        :to="`/leagues/${competitionCode}/${t}`"
        class="mx-2 py-3 uppercase hover:border-indigo-900 dark:text-white border-b-4 border-transparent"
        :class="{
          '!border-indigo-600': isActiveLink(t)
        }"
      >
        {{ t }}
      </RouterLink>
    </li>
  </ul>
  <!-- Banner -->
  <!-- <div
    class="bg-indigo-700 bg-opacity-10 w-full rounded-lg h-24 my-2 border-dashed border border-zinc-700 p-4"
  >
  <p class="text-xl font-thin">Introducing<strong> Mini-leagues</strong> </p>
  <p class="text-xl font-thin">Choose your competition length, invite who you want... etc. etc. etc.</p>
  </div> -->
  <div class="flex mb-16 w-full mt-4">
    <RouterView />
  </div>
</template>
