<script setup>
import { toRefs, computed } from "vue";
import useTableLoader from "../api/football-data/useCompetitionTableLoader";

const props = defineProps({
  competitionCode: {
    type: String,
    required: true,
  },
});

const { competitionCode } = toRefs(props);

const {
  items: table,
  loading: tableLoading,
  loaded: tableLoaded,
} = useTableLoader(competitionCode);

const hasTable = computed(() => !tableLoading.value && tableLoaded.value);
const isCup = computed(() => table.value?.competition.type === "CUP");
const tableData = computed(() => {
  return (
    (isCup.value ? table.value?.standings : [table.value?.standings[0]]) || []
  );
});
</script>
<template>
  <div v-for="standing in tableData" :key="standing?.id" class="py-2 w-full">
    <TransitionGroup>
      <label
        class="p-2 px-4 block w-full bg-[#2e2e2e] font-medium border-b-2 border-[#4b4b4b]"
        v-if="isCup"
        >{{ standing.group.replace("_", " ") }}</label
      >
      <table
        class="w-full text-sm md:text-base"
        v-if="standing && !tableLoading"
      >
        <thead class="bg-indigo-900 h-10">
          <tr class="font-medium text-center text-white">
            <th class="w-10 border-b border-b-[#2e2e2e]">&nbsp;</th>
            <th class="text-center w-10 min-w-[2.5rem] md:w-14">&nbsp;</th>
            <th class="text-left">
              <abbr title="Teams in Competition">TEAM</abbr>
            </th>
            <th class="w-6">
              <abbr title="Games Played">PL</abbr>
            </th>
            <th class="w-6">
              <abbr title="Games Won">W</abbr>
            </th>
            <th class="w-6">
              <abbr title="Games Drawn">D</abbr>
            </th>
            <th class="w-6">
              <abbr title="Games Lost">L</abbr>
            </th>
            <th class="w-8">
              <abbr title="Goals For">GF</abbr>
            </th>
            <th class="w-8">
              <abbr title="Goals Against">GA</abbr>
            </th>
            <th class="w-8">
              <abbr title="Goal Difference">GD</abbr>
            </th>
            <th class="w-10">
              <abbr title="Points">PTS</abbr>
            </th>
            <th class="hidden sm:table-cell w-20" v-if="!isCup">
              <abbr title="Recent form">FORM</abbr>
            </th>
          </tr>
        </thead>
        <tbody v-if="hasTable" class="font-medium">
          <tr
            v-for="row in standing.table"
            :key="row.position"
            @click="
              $router.push(
                `/leagues/${competitionCode}/discussions/new?team=${row.team?.id}`
              )
            "
            class="bg-[#1e1e1e] border-b border-b-[#2e2e2e] transition-all text-white h-14 hover:bg-[#2e2e2e]"
          >
            <td class="text-center text-md p-2 text-white bg-[#3c3c3c ]">
              {{ row.position }}
            </td>
            <td class="text-center p-1">
              <img
                :alt="row.team.name"
                :src="row.team.crest"
                class="w-8 md:w-10 h-8 md:h-10 mx-auto"
              />
            </td>
            <td class="text-left p-1 font-medium truncate">
              <RouterLink
                @click.stop
                :to="`/leagues/${competitionCode}/teams/${row.team.id}`"
                class="truncate league-link"
              >
                <span class="hidden md:inline">{{ row.team.name }}</span
                ><span class="md:hidden truncate">{{
                  row.team.shortName
                }}</span>
              </RouterLink>
            </td>
            <td class="text-center p-1">{{ row.playedGames }}</td>
            <td class="text-center p-1">{{ row.won }}</td>
            <td class="text-center p-1">{{ row.draw }}</td>
            <td class="text-center p-1">{{ row.lost }}</td>
            <td class="text-center p-1">
              {{ row.goalsFor }}
            </td>
            <td class="text-center p-1">
              {{ row.goalsAgainst }}
            </td>
            <td class="text-center p-1">
              {{ row.goalsFor - row.goalsAgainst }}
            </td>
            <td class="text-center p-1">{{ row.points }}</td>
            <td class="text-center p-1 hidden sm:table-cell" v-if="row.form">
              <div class="flex items-center justify-center w-full">
                <div
                  v-for="(result, i) in row.form.split(',')"
                  :key="`form_${i}`"
                  class="h-2 w-2 mx-0.5 rounded-full"
                  :class="{
                    'bg-green-500': result === 'W',
                    'bg-red-500': result === 'L',
                    'bg-gray-500': result === 'D',
                  }"
                />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="w-full">
        <div
          v-for="i in 20"
          :key="i"
          class="bg-[#1e1e1e] animate-pulse my-2 rounded flex-1 h-12 w-full"
        />
      </div>
    </TransitionGroup>
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
