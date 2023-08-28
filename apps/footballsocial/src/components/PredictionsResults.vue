<script setup>
import { shallowRef, unref } from "vue";
import { fetchPredictionTable } from "../composables/usePredictionService";
import { useCurrentUser } from "../composables/useCurrentUser";
import { watch } from "vue";

const props = defineProps({
  competitionCode: {
    type: String,
    required: true,
  },
  private: {
    type: Boolean,
    default: false,
  },
});

const predictionsLoaded = shallowRef(false);
const table = shallowRef([]);

async function loadPredictions() {
  const { data } = await fetchPredictionTable(
    unref(props.competitionCode),
    unref(props.gameweek)
  );
  table.value = data;
  predictionsLoaded.value = true;
}

watch(() => props.competitionCode, loadPredictions, { immediate: true });

const { profile } = useCurrentUser();
</script>
<template>
  <div v-if="!predictionsLoaded" class="w-full">
    <div
      v-for="i in 10"
      :key="i"
      class="bg-[#1e1e1e] animate-pulse my-2 rounded flex-1 h-8 w-full"
    />
  </div>
  <div
    v-else-if="!table.length"
    class="w-full text-center py-8 text-3xl font-thin"
  >
    This league has no predictions yet.
  </div>
  <div v-else class="flex flex-col w-full">
    <table class="w-full text-base md:text-base rounded overflow-hidden shadow">
      <thead
        class="h-10 font-light bg-gradient-to-r from-indigo-800 to-pink-900"
      >
        <tr class="font-thin text-center text-white">
          <th class="w-16 font-medium">POS</th>
          <th class="text-left">
            <abbr class="font-medium" title="Teams in Competition"
              >USERNAME</abbr
            >
          </th>

          <th class="w-10">
            <abbr class="font-medium" title="Correct Home Score">HS</abbr>
          </th>
          <th class="w-10">
            <abbr class="font-medium" title="Correct Away Score">AS</abbr>
          </th>
          <th class="w-10">
            <abbr class="font-medium" title="Correct Match Result">MR</abbr>
          </th>
          <th class="w-10">
            <abbr class="font-medium" title="Correct Match Score">MS</abbr>
          </th>
          <th class="w-12">
            <abbr class="font-medium" title="Points">PTS</abbr>
          </th>
        </tr>
      </thead>
      <tbody class="font-light">
        <tr
          class="border-b border-b-zinc-800 transition-all text-white hover:bg-zinc-900"
          v-for="row in table"
          :key="row.username"
          :class="{
            'bg-opacity-10 bg-indigo-500': row.username === profile?.username,
            'bg-opacity-10 bg-green-500': row.position === 1,
            'bg-opacity-10 bg-red-500': row.position === table.length,
          }"
        >
          <td
            class="text-center text-md p-2 text-white border-r border-zinc-800"
          >
            {{ row.position }}
          </td>
          <td class="text-left py-2 px-3">
            <RouterLink
              class="league-link"
              v-if="!private"
              :to="`/leagues/${competitionCode}/predictions/${row.username}`"
              >{{ row.username }}</RouterLink
            >
            <p v-else class="blur-md">{{ row.username }}</p>
          </td>
          <td class="text-center p-1">{{ row.totalHomeGoals || 0 }}</td>
          <td class="text-center p-1">{{ row.totalAwayGoals || 0 }}</td>
          <td class="text-center p-1">{{ row.totalCorrectResult || 0 }}</td>
          <td class="text-center p-1">{{ row.correctScore || 0 }}</td>
          <td class="text-center p-1 border-l border-zinc-800">
            {{ row.points || 0 }}
          </td>
        </tr>
      </tbody>
    </table>
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
