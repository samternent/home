<script setup>
import { shallowRef } from "vue";
import { useCurrentUser } from "../../composables/useCurrentUser";
import { supabaseClient } from "../../service/supabase";

const props = defineProps({
  competitionCode: {
    type: String,
    required: true,
  },
  id: {
    type: Number,
    required: true,
  },
});

function sortTable(a, b) {
  if (a.points === b.points) {
    if (a.correctScore !== b.correctScore) {
      return b.correctScore - a.correctScore;
    }
    if (a.totalCorrectResult !== b.totalCorrectResult) {
      return b.totalCorrectResult - a.totalCorrectResult;
    }
    return b.username.toLowerCase() - a.username.toLowerCase();
  }
  return b.points - a.points;
}

const league = shallowRef({});
const members = shallowRef([]);
const table = shallowRef([]);

async function fetchLeague() {
  const { data: leagueData } = await supabaseClient
    .from("leagues")
    .select()
    .eq("id", props.id);
  const { data: membersData } = await supabaseClient
    .from("league_members")
    .select()
    .eq("league_id", leagueData[0].id);

  league.value = leagueData[0];
  members.value = membersData;

  const { gameweek_start, gameweek_end } = league.value;

  const gameweeks = Array.from(
    { length: gameweek_end - gameweek_start },
    (_, i) => i + gameweek_start
  );

  const { data } = await supabaseClient
    .from("gameweek_results")
    .select()
    .eq("competitionCode", props.competitionCode)
    .in(
      "username",
      members.value.map(({ username }) => username)
    )
    .in("gameweek", gameweeks);

  const combinedTableStructure = {};

  data.forEach((item) => {
    if (combinedTableStructure[item.username]) {
      const vals = { ...combinedTableStructure[item.username] };
      combinedTableStructure[item.username] = {
        ...combinedTableStructure[item.username],
        points: vals.points + item.points,
        correctScore: vals.correctScore + item.correctScore,
        totalCorrectResult: vals.totalCorrectResult + item.totalCorrectResult,
        totalAwayGoals: vals.totalAwayGoals + item.totalAwayGoals,
        totalHomeGoals: vals.totalHomeGoals + item.totalHomeGoals,
      };
    } else {
      combinedTableStructure[item.username] = item;
    }
  });
  table.value = Object.values(combinedTableStructure)
    .sort(sortTable)
    .map((row, i) => {
      return { position: i + 1, ...row };
    });
}

fetchLeague();
</script>
<template>
  <div class="w-full">
    <div class="text-zinc-300 mb-6">
      <RouterLink
        :to="`/leagues/${competitionCode}/leagues`"
        class="pb-2 hover:text-zinc-100 transition-all"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-6 h-6 inline mr-2"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
          />
        </svg>

        Back
      </RouterLink>
    </div>
    <h2 class="text-3xl font-thin p-2 mb-4">{{ league.name }}</h2>
    <div class="flex flex-col md:flex-row">
      <div class="w-full flex-1 md:px-4">
        <table
          class="w-full text-base md:text-base rounded overflow-hidden shadow"
        >
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
                'bg-opacity-10 bg-indigo-500':
                  row.username === profile?.username,
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
      <div class="w-64 mt-8 md:mt-0">
        <p class="text-xl mb-2 font-thin">
          League commissioner: @{{ league.owner }}
        </p>
        <p class="text-xl mb-2 font-thin">
          Gameweeks: {{ league.gameweek_start }} - {{ league.gameweek_end }}
        </p>
        <p class="bg-zinc-800 text-xl text-center py-4">League Code</p>
        <div
          class="p-6 text-4xl text-center font-black tracking-tighter bg-gradient-to-r from-indigo-500 to-70% to-pink-500 via-40%"
        >
          {{ league.league_code }}
        </div>
      </div>
    </div>
  </div>
</template>
