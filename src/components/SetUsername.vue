<script setup>
import { shallowRef } from "vue";
import { useCurrentUser } from "../composables/useCurrentUser";

const { updateUsername } = useCurrentUser();
const username = shallowRef();

function setUsername() {
  updateUsername(username.value);
}
</script>
<template>
  <div class="w-full mx-auto max-w-2xl py-8">
    <input
      type="text"
      v-model="username"
      class="bg-[#1d1d1d] w-full rounded p-4 border-2 border-[#343434] my-2"
      name="pick_username"
      placeholder="Pick Username"
    />
    <div class="mx-2 my-4 flex justify-end">
      <button
        type="submit"
        @click="setUsername"
        class="bg-pink-600 transition-all shadow-block-yellow text-white px-4 py-2 rounded no-underline hover:no-underline hover:text-white hover:bg-pink-500"
      >
        Update username
      </button>
    </div>
  </div>
</template>
