<script setup>
import { shallowRef } from "vue";
import { useCurrentUser } from "../../composables/useCurrentUser";
import { supabaseClient } from "../../service/supabase";

import { SButton } from "ternent-ui/components";

const props = defineProps({
  competitionCode: {
    type: String,
    required: true,
  },
});

const leagues = shallowRef([]);
const isLoading = shallowRef(false);
const { profile } = useCurrentUser();

async function fetchMyLeagues() {
  isLoading.value = true;

  const { data: myLeagueIds, error: myLeagueError } = await supabaseClient
    .from("league_members")
    .select()
    .eq("username", profile.value?.username);

  const { data, error } = await supabaseClient
    .from("leagues")
    .select()
    .eq("competition_code", props.competitionCode)
    .not("id", "in", `(${myLeagueIds.map(({ league_id }) => league_id)})`);

  leagues.value = data;
  isLoading.value = false;
}

fetchMyLeagues();
</script>
<template>
  <div v-for="league in leagues" :key="league.id" class="p-2">
    <div class="flex flex-col">
      <div class="flex items-center py-8 border-b">
        <div class="px-4 flex flex-1 flex-col justify-between h-full">
          <h2 class="text-2xl font-medium">{{ league.name }}</h2>
          <p class="text-xl font-light">
            Commissioner: <span class="font-medium">{{ league.owner }}</span>
          </p>
          <p
            class="text-xl font-light"
            v-if="league.gameweek_start === league.gameweek_end"
          >
            Gameweek:
            <span class="font-medium">{{ league.gameweek_start }}</span>
          </p>
          <p class="text-xl font-light" v-else>
            Gameweeks:
            <span class="font-medium"
              >{{ league.gameweek_start }} - {{ league.gameweek_end }}</span
            >
          </p>
        </div>
        <SButton
          :to="`/leagues/${competitionCode}/leagues/${league.id}`"
          class="text-center py-2 px-4 rounded font-light text-xl"
          type="secondary"
          >Join League</SButton
        >
      </div>
    </div>
  </div>
  <div
    v-if="!leagues?.length && !isLoading"
    class="text-4xl font-thin text-center flex flex-col items-center justify-start my-32"
  >
    <p>No leagues found</p>
    <p class="text-3xl">Create or join one.</p>
  </div>
  <div v-else-if="isLoading" class="w-full pr-4 pt-10">
    <div
      v-for="i in 10"
      :key="i"
      class="skeleton m-2 my-8 rounded flex-1 h-32 w-full"
    />
  </div>
</template>
