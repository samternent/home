<script setup>
import { computed, shallowRef } from "vue";
import { useCompetitionLoader } from "../../api/football-data/useCompetitionLoader";

const props = defineProps({
  competitionCode: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    default: null,
  },
});
const { items: competition } = useCompetitionLoader();
const tabs = computed(() => [
  { title: "Predictions", to: "play" },
  { title: "Leagues", to: "leagues" },
]);

const overrideGameweek = shallowRef();
const gameweek = computed(
  () => overrideGameweek.value || competition.value?.currentSeason?.currentMatchday
);

function setGameweek(_gameweek) {
  overrideGameweek.value = _gameweek;
}
</script>
<template>
  <div class="w-full">
    <ul class="flex my-4 lg:hidden">
      <li v-for="t in tabs" :key="`${t}`">
        <RouterLink
          :to="`/leagues/${competition?.code}/predictions/${t.to}`"
          class="px-4 py-2 text-sm uppercase hover:dark:bg-zinc800 hover:border-indigo-800 dark:text-white border-b-4 border-transparent"
          active-class="!border-indigo-800 dark:bg-zinc800 "
        >
          {{ t.title }}
        </RouterLink>
      </li>
    </ul>
    <!-- <div
      class="flex items-center justify-center w-full bg-indigo-900 h-10 text-sm md:text-base font-medium mb-2"
    >
      <button
        @click="setGameweek(gameweek - 1)"
        :disabled="gameweek <= 1"
        :aria-label="`Gameweek ${gameweek - 1}`"
      >
        <svg
          class="w-4 h-4 md:w-5 md:h-5 fill-white"
          stroke="currentColor"
          viewBox="0 0 1024 1024"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M640 0l-512 512 512 512 192-192-320-320 320-320-192-192z" />
        </svg>
      </button>
      <h2 class="px-2 mx-6 font-bold uppercase text-center dark:text-white">
        Gameweek {{ gameweek }}
      </h2>
      <button
        @click="setGameweek(gameweek + 1)"
        :aria-label="`Gameweek ${gameweek + 1}`"
      >
        <svg
          class="w-4 h-4 md:w-5 md:h-5 fill-white"
          stroke="currentColor"
          viewBox="0 0 1024 1024"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M320 0l-192 192 320 320-320 320 192 192 512-512-512-512z" />
        </svg>
      </button>
    </div> -->
    <div class="w-full">
      <Transition>
        <RouterView />
      </Transition>
    </div>
  </div>
</template>
<style scoped>
.v-enter-active,
.v-leave-active {
  transition: opacity 0.9s ease;
  transition-duration: 0.2s;
}

.v-enter-from,
.v-leave-to {
  opacity: 1;
}
</style>
