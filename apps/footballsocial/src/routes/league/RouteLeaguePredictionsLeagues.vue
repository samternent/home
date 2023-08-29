<script setup>
import { shallowRef } from "vue";
import { useCurrentUser } from "../../composables/useCurrentUser";
import { supabaseClient } from "../../service/supabase";

const props = defineProps({
  competitionCode: {
    type: String,
    required: true,
  },
});

const leagues = shallowRef([]);
const { profile } = useCurrentUser();

async function fetchMyLeagues() {
  const { data: myLeagueIds, error: myLeagueError } = await supabaseClient
    .from("league_members")
    .select()
    .eq("username", profile.value.username);

  const { data, error } = await supabaseClient
    .from("leagues")
    .select("*")
    .eq("competition_code", props.competitionCode)
    .in(
      "id",
      myLeagueIds.map(({ league_id }) => league_id)
    );

  leagues.value = data;
}

fetchMyLeagues();
</script>
<template>
  <div class="w-full">
    <div class="flex justify-end w-full py-2">
      <RouterLink
        class="text-center mx-2 border-2 border-indigo-600 hover:bg-indigo-900 transition-all py-2 px-4 rounded"
        :to="`/leagues/${competitionCode}/leagues/join`"
        >Join League</RouterLink
      >
      <RouterLink
        class="text-center mx-2 bg-green-600 hover:bg-green-500 transition-all py-2 px-4 rounded"
        :to="`/leagues/${competitionCode}/leagues/create`"
        >Create League</RouterLink
      >
    </div>
    <div
      v-for="league in leagues"
      :key="league.id"
      class="bg-zinc-900 my-2 p-2"
    >
      <h2 class="text-3xl font-thin p-2 mb-4">{{ league.name }}</h2>
      <div class="flex">
        <div class="bg-zinc-800 w-50">
          <p class="text-xl my-2 text-center py-2">League Code</p>
          <div
            class="mt-2 p-6 text-4xl text-center font-black tracking-tighter bg-gradient-to-r from-indigo-500 to-70% to-pink-500 via-40%"
          >
            {{ league.league_code }}
          </div>
        </div>
        <div class="px-4 flex flex-col justify-between">
          <p class="text-xl mb-2 font-thin">
            League commissioner: @{{ league.owner }}
          </p>
          <p class="text-xl mb-2 font-thin" v-if="league.gameweek_start === league.gameweek_end">
            Gameweek: {{ league.gameweek_start }}
          </p>
          <p class="text-xl mb-2 font-thin" v-else>
            Gameweeks: {{ league.gameweek_start }} - {{ league.gameweek_end }}
          </p>
          <RouterLink
            :to="`/leagues/${competitionCode}/leagues/${league.id}`"
            class="bg-green-700 text-center py-2 px-4 rounded font-light text-xl"
            >View League</RouterLink
          >
        </div>
      </div>
    </div>
    <div v-if="!leagues?.length" class="text-4xl font-thin text-center flex flex-col items-center justify-center my-6">
      <p>No leagues found</p>
      <p class="text-3xl">Create or join one.</p>
    </div>
  </div>
</template>
