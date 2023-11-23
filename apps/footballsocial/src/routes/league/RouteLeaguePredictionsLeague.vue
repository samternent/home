<script setup>
import { shallowRef, computed } from "vue";
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

  const arrayRange = (start, stop, step) =>
    Array.from(
      { length: (stop - start) / step + 1 },
      (value, index) => start + index * step
    );

  const gameweeks = computed(() => arrayRange(gameweek_start, gameweek_end, 1));

  const { data } = await supabaseClient
    .from("gameweek_results")
    .select()
    .eq("competitionCode", props.competitionCode)
    .in(
      "username",
      members.value.map(({ username }) => username)
    )
    .in("gameweek", gameweeks.value);

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

const linkEl = shallowRef();

function copyLink() {
  // Select the text field
  linkEl.value.select();
  linkEl.value.setSelectionRange(0, 99999); // For mobile devices

  // Copy the text inside the text field
  navigator.clipboard.writeText(linkEl.value.value);

  // emit copy to clipboard message
}
const leagueLink = computed(
  () =>
    `${window.location.origin}/leagues/${props.competitionCode}/leagues/join/${league.value.league_code}`
);
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
          <thead class="h-10 font-light">
            <tr class="font-thin text-center">
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
              class="border-b transition-all"
              v-for="row in table"
              :key="row.username"
              :class="{
                'bg-opacity-10': row.username === profile?.username,
                'bg-opacity-10': row.position === 1,
                'bg-opacity-10': row.position === table.length,
              }"
            >
              <td class="text-center text-md p-2 border-r">
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
        <p
          class="text-xl mb-2 font-thin"
          v-if="league.gameweek_start === league.gameweek_end"
        >
          Gameweek: {{ league.gameweek_start }}
        </p>
        <p class="text-xl mb-2 font-thin" v-else>
          Gameweeks: {{ league.gameweek_start }} - {{ league.gameweek_end }}
        </p>
        <p class="text-xl text-center py-4">League Code</p>
        <div class="p-6 text-4xl text-center font-bold tracking-tighter">
          {{ league.league_code }}
        </div>
        <div class="flex w-full">
          <input
            ref="linkEl"
            dir="rtl"
            class="flex-1 p-2 font-thin"
            :value="leagueLink"
          />
          <button @click="copyLink" class="p-2">
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
                d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5A3.375 3.375 0 006.375 7.5H5.25m11.9-3.664A2.251 2.251 0 0015 2.25h-1.5a2.251 2.251 0 00-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v12c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5a9 9 0 00-9-9z"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
