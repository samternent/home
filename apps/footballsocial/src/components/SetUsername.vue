<script setup>
import { shallowRef } from "vue";
import { useCurrentUser } from "../composables/useCurrentUser";

const { updateProfile, signOut } = useCurrentUser();
const username = shallowRef();

function setUsername() {
  updateProfile({ username: username.value });
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
      required="true"
      @beforeinput="(e) => /[^a-zA-Z0-9_]/.test(e.data) && e.preventDefault()"
      placeholder="Pick Username"
    />
    <div class="mx-2 my-4 flex justify-end">
      <button
        type="submit"
        @click="setUsername"
        class="bg-green-700 text-center py-2 px-4 rounded font-light text-xl"
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
