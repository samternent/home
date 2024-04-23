<script setup>
import { shallowRef, toRefs } from "vue";
import { useRouter } from "vue-router";
import { useCurrentUser } from "../../composables/useCurrentUser";
import { supabaseClient } from "../../service/supabase";

const props = defineProps({
  competitionCode: {
    type: String,
    required: true,
  },
  leagueCode: {
    type: String,
    default: null,
  },
});

const { profile } = useCurrentUser();
const router = useRouter();

const league = shallowRef(null);
const canJoinLeague = shallowRef(false);
const leagueCode = shallowRef(props.leagueCode);

async function findLeague() {
  if (!leagueCode.value) return;

  const { data, error } = await supabaseClient
    .from("leagues")
    .select()
    .eq("league_code", leagueCode.value);

  const { data: membersData } = await supabaseClient
    .from("league_members")
    .select()
    .eq("league_id", data[0].id)
    .eq("username", profile.value?.username);

  league.value = data[0];
  canJoinLeague.value = !membersData.length;
}
async function joinLeague() {
  if (!league.value) return;

  if (!profile.value) {
    router.push("/");
    return;
  }

  const { error } = await supabaseClient.from("league_members").insert([
    {
      league_id: league.value.id,
      username: profile.value.username,
    },
  ]);

  router.push(`/leagues/${props.competitionCode}/leagues/${league.value.id}`);
}

findLeague();
</script>
<template>
  <div class="w-full">
    <div class="flex">
      <input
        type="text"
        v-model="leagueCode"
        class=""
        placeholder="League Code"
      />
      <button
        class="ml-4 rounded px-4"
        @click="findLeague"
        :disabled="!leagueCode"
      >
        Find league
      </button>
    </div>
  </div>
  <div v-if="league" class="my-2 p-2">
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
          class="text-center py-2 px-4 rounded font-light text-xl"
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
</template>
