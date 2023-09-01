<script setup>
import { shallowRef, unref, reactive } from "vue";

import { useRouter } from "vue-router";
import { supabaseClient } from "../../service/supabase";
import { useCurrentUser } from "../../composables/useCurrentUser";
import { calculatePredictionTable } from "../../composables/usePredictionService";
import { watch } from "vue";

const { user, profile, signOut, updateProfile } = useCurrentUser();

const router = useRouter();
defineProps({
  username: {
    type: String,
    required: true,
  },
});

const updatedProfile = reactive({
  username: null,
});

async function signOutAndLeave() {
  await signOut();
  router.push("/");
}

async function saveProfile() {
  await updateProfile(updatedProfile);
}

watch(profile, (_profile) => {
  router.push(`/auth/profile/${_profile.username}`);
});

// const avatarFile = event.target.files[0]
// const { data, error } = await supabaseClient
//   .storage
//   .from('avatars')
//   .upload('public/avatar1.png', avatarFile, {
//     cacheControl: '3600',
//     upsert: false
//   })
</script>
<template>
  <div class="mx-auto w-full max-w-4xl p-4">
    <div v-if="!user" class="text-3xl my-8 text-center">
      Please check your emails to confirm your signup.
    </div>
    <div v-else class="bg-zinc-800 rounded p-2">
      {{ profile.username }}
      <p class="my-16">
        <button @click="signOutAndLeave" class="px-4 py-2 bg-red-800">
          Sign Out
        </button>
      </p>


    </div>
  </div>
</template>
