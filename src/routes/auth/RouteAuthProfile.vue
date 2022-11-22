<script setup>
import { shallowRef } from "vue";
import { useRouter } from "vue-router";
import { supabaseClient } from "../../service/supabase";
import { useCurrentUser } from "../../composables/useCurrentUser";

const { user, profile, signOut } = useCurrentUser();
defineProps({
  username: {
    type: String,
    required: true,
  },
});
</script>
<template>
  <div class="mx-auto w-full max-w-3xl p-4">
    <div v-if="!user" class="text-3xl my-8 text-center">
      Please check your emails to confirm your signup.
    </div>
    <div v-else>
      <p>
        <span class="text-6xl font-bold tracking-tighter text-white shadow-text"
          >@{{ username }}</span
        >
      </p>
      <p class="my-16">
        <button @click="signOut" class="px-4 py-2 bg-red-800">Sign Out</button>
      </p>
    </div>
  </div>
</template>
