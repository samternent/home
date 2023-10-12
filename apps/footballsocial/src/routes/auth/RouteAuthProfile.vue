<script setup>
import { shallowRef, unref } from "vue";
import { supabaseClient } from "../../service/supabase";
import { useCurrentUser } from "../../composables/useCurrentUser";
import { onMounted } from "vue";

const { user, profile } = useCurrentUser();

const pendingDeletion = shallowRef(false);

async function checkPendingDeletion() {
  const { data, error } = await supabaseClient
    .from("deletions")
    .select()
    .eq("username", profile.value.username);

  if (data[0]?.username === profile.value.username) {
    pendingDeletion.value = true;
  }
}
onMounted(checkPendingDeletion);

async function requestAccountDeletion() {
  const { data, error } = await supabaseClient
    .from("deletions")
    .insert({ username: profile.value.username })
    .select();

  if (data[0].username === profile.value.username) {
    pendingDeletion.value = true;
  }
}
</script>
<template>
  <div class="mx-auto w-full max-w-3xl p-4">
    <div>
      <p>
        <span
          class="text-4xl sm:text-5xl dark:text-white font-medium tracking-tighter"
          >{{ profile.username }}</span
        >
      </p>

      <p class="my-16">
        <div v-if="pendingDeletion">
          <p>Deletion request is pending.</p>
          <p>This will be processed withing 48 hours</p>
        </div>
        <button :disabled="pendingDeletion" @click="requestAccountDeletion" class="px-4 py-2 bg-red-800 disabled:opacity-50">
          Request account deletion
        </button>
      </p>
    </div>
  </div>
</template>
