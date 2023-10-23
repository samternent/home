<script setup>
import { computed, toRefs } from "vue";
import { DateTime } from "luxon";
import usePlayerLoader from "../../api/football-data/usePlayerLoader";
import Spinner from "../../components/Spinner.vue";
import PlayerKit from "../../components/PlayerKit.vue";

const props = defineProps({
  playerId: {
    type: String,
    required: true,
  },
});

const { playerId } = toRefs(props);

const {
  items: player,
  loading: playerLoading,
  loaded: playerLoaded,
} = usePlayerLoader(playerId);

const hasPlayer = computed(() => !playerLoading.value && playerLoaded.value);

const age = computed(() =>
  Math.floor(
    DateTime.fromFormat(player.value?.dateOfBirth, "yyyy-MM-dd")
      .diffNow()
      .as("years") * -1
  )
);
</script>
<template>
  <div class="h-24 lg:h-32 p-2 flex w-full border-b-2 border-gray-100">
    <div
      class="max-w-screen-2xl mx-auto w-full justify-between items-center flex"
    >
      <PlayerKit
        v-if="hasPlayer"
        :colors="player.currentTeam.clubColors"
        :shirtNumber="player.shirtNumber"
        :showShorts="false"
      />
      <div class="py-2 px-2 flex items-center w-full">
        <div v-if="hasPlayer">
          <h1 class="text-lg lg:text-2xl font-light">{{ player.name }}</h1>
          <h2 class="text-md lg:text-xl font-thin">{{ age }} years old</h2>
        </div>
        <div v-else>
          <h1 class="text-2xl font-thin mb-2">
            <div class="animate-pulse m-2 rounded flex-1 h-8 w-32" />
          </h1>
          <h2 class="text-xl font-thin">
            <div class="animate-pulse m-2 rounded flex-1 h-6 w-40" />
          </h2>
        </div>
      </div>
    </div>
  </div>
  <div
    v-if="hasPlayer"
    class="max-w-screen-2xl mx-auto w-full flex flex-col items-center"
  >
    <!-- {{ player }} -->
  </div>
  <div v-else class="flex-1 flex relative justify-center items-center">
    <Spinner />
  </div>
</template>
