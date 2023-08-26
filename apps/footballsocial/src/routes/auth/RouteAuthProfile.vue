<script setup>
import { shallowRef, unref } from "vue";
import { useRouter } from "vue-router";
import { supabaseClient } from "../../service/supabase";
import { useCurrentUser } from "../../composables/useCurrentUser";
import { calculatePredictionTable } from "../../composables/usePredictionService";

const { user, profile, signOut } = useCurrentUser();
const router = useRouter();
defineProps({
  username: {
    type: String,
    required: true,
  },
});

async function signOutAndLeave() {
  await signOut();
  router.push("/");
}

const competitionCode = shallowRef('PL');
const gameweek = shallowRef(1);

function calculateResults() {
  calculatePredictionTable(unref(competitionCode), unref(gameweek));
};
</script>
<template>
  <div class="mx-auto w-full max-w-3xl p-4">
    <div v-if="!user" class="text-3xl my-8 text-center">
      Please check your emails to confirm your signup.
    </div>
    <div v-else>
      <p>
        <span
          class="text-6xl font-bold tracking-tighter dark:text-white shadow-text"
          >@{{ username }}</span
        >
      </p>
      <p class="my-16">
        <button @click="signOutAndLeave" class="px-4 py-2 bg-red-800">
          Sign Out
        </button>
      </p>

      <!-- fake admin -->
      <div v-if="username === 'sam'">
        <input v-model="competitionCode" />
        <input v-model="gameweek" />
        <button @click="calculateResults">Calculate</button>
      </div>
    </div>
  </div>
</template>
