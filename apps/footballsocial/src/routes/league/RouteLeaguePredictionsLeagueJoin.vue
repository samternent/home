<script setup>
import { shallowRef } from "vue";
import { useRouter } from "vue-router";
import { useCurrentUser } from "../../composables/useCurrentUser";
import { supabaseClient } from "../../service/supabase";

const props = defineProps({
  competitionCode: {
    type: String,
    required: true,
  },
});

const { profile } = useCurrentUser();
const router = useRouter();

const league = shallowRef(null);
const canJoinLeague = shallowRef(false);
const leagueCode = shallowRef("");

async function findLeague() {
  const { data, error } = await supabaseClient
    .from("leagues")
    .select()
    .eq("league_code", leagueCode.value);

  const { data: membersData } = await supabaseClient
    .from("league_members")
    .select()
    .eq("league_id", data[0].id)
    .eq("username", profile.value.username);

  league.value = data[0];
  canJoinLeague.value = !membersData.length;
}
async function joinLeague() {
  if (!league.value) return;

  const { error } = await supabaseClient.from("league_members").insert([
    {
      league_id: league.value.id,
      username: profile.value.username,
    },
  ]);

  router.push(`/leagues/${props.competitionCode}/leagues/${league.value.id}`);
}
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
    <div>
      <p class="py-2">Enter a league code</p>
      <div class="flex">
        <input
          type="text"
          v-model="leagueCode"
          class="block border-0 bg-transparent py-1.5 pl-1 focus:ring-0 bg-zinc-800 rounded w-52"
          placeholder="League Code"
        />
        <button
          class="ml-4 bg-indigo-500 rounded px-4"
          @click="findLeague"
          :disabled="!leagueCode"
        >
          find league
        </button>
      </div>
    </div>
    <div v-if="league" class="bg-zinc-900 my-2 p-2">
      <h2 class="text-3xl font-thin p-2 mb-4">{{ league.name }}</h2>
      <div class="flex">
        <div class="px-4 flex flex-col justify-between">
          <p class="text-xl mb-2 font-thin">
            League commissioner: @{{ league.owner }}
          </p>
          <p class="text-xl mb-2 font-thin">
            Gameweeks: {{ league.gameweek_start }} - {{ league.gameweek_end }}
          </p>
          <button
            @click="joinLeague"
            v-if="canJoinLeague"
            class="bg-green-700 text-center py-2 px-4 rounded font-light text-xl"
          >
            Join league
          </button>
          <div v-else>
            Already a member
            <RouterLink
              :to="`/leagues/${competitionCode}/leagues/${league.id}`"
              class="league-link"
              >View League</RouterLink
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
