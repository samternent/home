<script setup>
import { shallowRef, computed } from "vue";
import { useRouter } from "vue-router";
import { useCurrentUser } from "../../composables/useCurrentUser";
import { supabaseClient } from "../../service/supabase";

const props = defineProps({
  competitionCode: {
    type: String,
    required: true,
  },
});

const gameweekDefinitions = {
  PL: 38,
  PD: 38,
  ELC: 46,
  BL1: 34,
  SA: 38,
  FL1: 38,
  DED: 34,
};
const gameweeks = computed(() =>
  Array.from(
    { length: gameweekDefinitions[props.competitionCode] },
    (_, i) => i + 1
  )
);

const leagueName = shallowRef("");
const startGameweek = shallowRef(1);
const endGameweek = shallowRef(gameweeks.value.length);
const { profile } = useCurrentUser();

const router = useRouter();

async function joinLeague(league_id, username) {
  const { error } = await supabaseClient.from("league_members").insert([
    {
      league_id,
      username,
    },
  ]);
}

async function createLeague() {
  const { data, error } = await supabaseClient
    .from("leagues")
    .insert([
      {
        name: leagueName.value,
        owner: profile.value.username,
        commissioner: profile.value.username,
        created_by: profile.value.username,
        league_code: crypto.randomUUID().slice(0, 5),
        gameweek_start: startGameweek.value,
        gameweek_end: endGameweek.value,
        competition_code: props.competitionCode,
      },
    ])
    .select();

  const myLeague = data[0];
  joinLeague(myLeague.id, profile.value.username);
  router.push(`/leagues/${props.competitionCode}/leagues/${myLeague.id}`);
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

    <label for="league_name" class="block text-lg font-light leading-6"
      >League name</label
    >
    <div class="mt-2 mb-4">
      <div class="flex">
        <input
          type="text"
          v-model="leagueName"
          name="league_name"
          class="block text-xl flex-1 border-0 px-3 py-2 focus:ring-0 rounded"
          placeholder="Enter league name"
        />
      </div>
    </div>

    <div class="flex w-full">
      <div class="flex-1">
        <label for="league_name" class="block text-lg font-light leading-6 my-2"
          >Gameweek start</label
        >
        <select
          v-model="startGameweek"
          class="block flex-1 border-0 py-2 px-3 text-xl focus:ring-0 mr-2 rounded"
        >
          <option v-for="gw in gameweeks" :key="`startWeek${gw}`" :value="gw">
            {{ gw }}
          </option>
        </select>
      </div>
      <div class="flex-1">
        <label for="league_name" class="block text-lg font-light leading-6 my-2"
          >Gameweek end</label
        >
        <select
          v-model="endGameweek"
          class="block flex-1 border-0 py-2 px-3 text-xl focus:ring-0 mr-2 rounded"
        >
          <option v-for="gw in gameweeks" :key="`endWeek${gw}`" :value="gw">
            {{ gw }}
          </option>
        </select>
      </div>
    </div>
    <!-- <p class="my-2 text-zinc-300 text-sm">
      Leave gameweeks blank to play for the enture season, or enter a start and
      end gameweek for your league to begin and end.
    </p> -->
    <div class="mt-6 flex items-center justify-end gap-x-6">
      <button
        type="submit"
        @click="createLeague"
        :disabled="!leagueName"
        class="rounded-md disabled:opacity-30 transition-bg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
      >
        Create league
      </button>
    </div>
  </div>
</template>
