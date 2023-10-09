<script setup>
import { shallowRef, unref } from "vue";
import { usePredictionService } from "../composables/usePredictionService";
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
  gameweek: {
    type: Number,
    default: null,
  },
  limit: {
    type: Number,
    default: null,
  },
});

const predictionsLoaded = shallowRef(false);
const table = shallowRef([]);

const { fetchPredictionTable } = usePredictionService();

async function loadPredictions() {
  const { data } = await fetchPredictionTable(
    props.competitionCode,
    props.gameweek
  );

  table.value = props.limit ? data.slice(0, props.limit) : data;
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
      <thead class="h-10 font-light relative bg-indigo-900">
        <tr class="font-thin text-center text-white">
          <th v-if="!gameweek" class="w-10"></th>
          <th class="w-12 font-medium">POS</th>
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
          }"
        >
          <td
            v-if="!gameweek"
            class="text-center py-2 px-1 text-white border-r border-zinc-800"
          >
            <span v-if="row.position < row.lastPosition" class="text-green-800"
              >▲</span
            >
            <span
              v-else-if="row.position > row.lastPosition"
              class="text-red-900"
              >▼</span
            >
            <span v-else-if="row.lastPosition">➖</span>
          </td>
          <td
            class="text-center font-medium text-md p-2 border-r border-zinc-800"
          >
            {{ row.position }}
          </td>
          <td class="text-left py-2 px-3 flex">
            <RouterLink
              class="league-link"
              v-if="!private"
              :to="`/leagues/${competitionCode}/predictions/${row.username}`"
              >{{ row.username }}</RouterLink
            >
            <p v-else class="blur-md">{{ row.username }}</p>
            <span
              v-if="gameweek ? row.position === 1 : row.gameweekPosition === 1"
              class="text-orange-400"
              ><svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                class="w-6 h-6 ml-2"
                :class="{
                  'blur-md': private,
                }"
              >
                <path
                  fill-rule="evenodd"
                  d="M12.963 2.286a.75.75 0 00-1.071-.136 9.742 9.742 0 00-3.539 6.177A7.547 7.547 0 016.648 6.61a.75.75 0 00-1.152-.082A9 9 0 1015.68 4.534a7.46 7.46 0 01-2.717-2.248zM15.75 14.25a3.75 3.75 0 11-7.313-1.172c.628.465 1.35.81 2.133 1a5.99 5.99 0 011.925-3.545 3.75 3.75 0 013.255 3.717z"
                  clip-rule="evenodd"
                />
              </svg>
            </span>
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
