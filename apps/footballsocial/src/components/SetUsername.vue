<script setup>
import { shallowRef } from "vue";
import { useCurrentUser } from "../composables/useCurrentUser";

const { updateUsername, signOut } = useCurrentUser();
const username = shallowRef();

function setUsername() {
  updateUsername(username.value);
}
async function signOutAndLeave() {
  await signOut();
  router.push("/");
}
</script>
<template>
  <div class="w-full mx-auto max-w-2xl py-8">
    <input
      type="text"
      v-model="username"
      class="dark:bg-[#1d1d1d] w-full rounded p-4 border-2 border-[#343434] my-2"
      name="pick_username"
      placeholder="Pick Username"
    />
    <div class="mx-2 my-4 flex justify-end">
      <button
        type="submit"
        @click="setUsername"
        class="bg-pink-600 transition-all shadow-block-yellow dark:text-white px-4 py-2 rounded no-underline hover:no-underline hover:dark:text-white hover:bg-pink-500"
      >
        Update username
      </button>
    </div>
    <p class="my-16">
      <button @click="signOutAndLeave" class="px-4 py-2 bg-red-800">
        Sign Out
      </button>
    </p>
  </div>
</template>
