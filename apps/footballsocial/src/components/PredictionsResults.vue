<script setup>
import { shallowRef, watch } from "vue";
import { DateTime, Interval } from "luxon";
import { usePredictionService } from "../composables/usePredictionService";
import { useCurrentUser } from "../composables/useCurrentUser";
import { useWhiteLabel } from "../module/brand/useWhiteLabel";

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
    default: 30,
  },
});

const predictionsLoaded = shallowRef(false);
const lastUpdated = shallowRef(null);
const table = shallowRef([]);
const { isWhiteLabel, host } = useWhiteLabel();

const { fetchPredictionTable } = usePredictionService();

async function loadPredictions() {
  const {
    data: { table: _data, lastUpdated: _lastUpdated },
  } = await fetchPredictionTable(
    props.competitionCode,
    props.gameweek,
    isWhiteLabel.value ? host.value : null
  );
  lastUpdated.value = DateTime.fromMillis(_lastUpdated).toFormat("DD hh:mm:ss");

  table.value = props.limit ? _data.slice(0, props.limit) : _data;
  predictionsLoaded.value = true;
}

watch(() => props.competitionCode, loadPredictions, { immediate: true });

const { profile } = useCurrentUser();
</script>
<template>
  <div v-if="!predictionsLoaded" class="w-full pt-10">
    <div
      v-for="i in 10"
      :key="i"
      class="skeleton m-2 my-2 rounded flex-1 h-10 w-full"
    />
  </div>
  <div
    v-else-if="!table.length"
    class="w-full text-center py-16 text-3xl font-light"
  >
    No predictions found
  </div>
  <div v-else>
    <div class="text-xs p-2 flex justify-end font-light">
      Last updated: {{ lastUpdated }}
    </div>
    <div class="flex flex-col w-full overflow-x-auto">
      <table class="rounded-tl-lg text-xs lg:text-base">
        <thead class="rounded-none p-2">
          <tr class="border-0 text-base border-b bg-base-content text-base-100">
            <th scope="col" class="w-12 p-2 tracking-tight font-medium">
              <abbr title="Position">POS</abbr>
            </th>
            <th scope="col" v-if="!gameweek" class="w-10"></th>
            <th scope="col" class="text-left p-2 tracking-tight font-medium">
              <abbr class="" title="Username">Username</abbr>
            </th>

            <th scope="col" class="w-10 p-2 tracking-tight font-medium">
              <abbr title="Correct Home Score">HS</abbr>
            </th>
            <th scope="col" class="w-10 p-2 tracking-tight font-medium">
              <abbr title="Correct Away Score">AS</abbr>
            </th>
            <th scope="col" class="w-10 p-2 tracking-tight font-medium">
              <abbr title="Correct Match Result">MR</abbr>
            </th>
            <th scope="col" class="w-10 p-2 tracking-tight font-medium">
              <abbr title="Correct Match Score">MS</abbr>
            </th>
            <th scope="col" class="w-12 p-2 tracking-tight font-medium">
              <abbr title="Points">PTS</abbr>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in table"
            :key="row.username"
            class="border-0 bg-base-100 hover:bg-base-200"
            :class="{
              'bg-primary bg-opacity-20': row.username === profile?.username,
              'bg-green-500 bg-opacity-10': row.position === 1,
              'bg-base-300 bg-opacity-20': row.position % 2 == 0,
            }"
          >
            <th scope="row" class="text-center font-medium text-sm p-2">
              {{ row.position }}
            </th>
            <td v-if="!gameweek" class="text-center py-2 px-1">
              <span
                v-if="
                  row.position < row.lastPosition ||
                  (!row.lastPosition && row.position > row.lastPosition)
                "
                class="text-green-800"
                >▲</span
              >
              <span
                v-else-if="row.lastPosition && row.position > row.lastPosition"
                class="text-red-900"
                >▼</span
              >
              <span v-else-if="row.lastPosition">➖</span>
            </td>
            <td class="text-left py-2 px-3 flex items-center">
              <RouterLink
                class="league-link"
                v-if="!private"
                :to="`/leagues/${competitionCode}/predictions/${row.username}`"
                >{{ row.username }}</RouterLink
              >
              <p v-else>{{ row.username }}</p>
              <span
                v-if="
                  row.gameweekPoints > 0 &&
                  (gameweek ? row.position === 1 : row.gameweekPosition === 1)
                "
                class="text-orange-400"
                ><svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  class="w-5 h-5 md:w-6 md:h-6 ml-2"
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
            <td class="text-center p-1">
              {{ row.points || 0 }}
            </td>
          </tr>
          <template v-if="table.length < 20">
            <tr
              v-for="(_, i) in [...Array(20 - table.length)]"
              :key="`empty_${i}`"
              class="border-0 bg-base-100 hover:bg-base-200 h-10"
              :class="{
                'bg-base-200 bg-opacity-10': i % 2 !== 0,
              }"
            >
              <th scope="row" class="text-center p-1">
                <span class="opacity-50">➖</span>
              </th>
              <td class="text-center p-1"></td>
              <td class="text-center p-1"></td>
              <td class="text-center p-1"></td>
              <td class="text-center p-1"></td>
              <td class="text-center p-1"></td>
              <td class="text-center p-1"></td>
            </tr>
          </template>
        </tbody>
      </table>
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
