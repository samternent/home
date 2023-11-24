<script setup>
import { shallowRef, watch } from "vue";
import { useCurrentUser } from "../composables/useCurrentUser";

const { updateProfile, profile } = useCurrentUser();
const username = shallowRef();

function setUsername() {
  updateProfile({ username: username.value });
}
watch(
  profile,
  (_profile) => {
    username.value = profile.value?.username;
  },
  { immediate: true }
);
</script>
<template>
  <div class="w-full mx-auto max-w-2xl py-8">
    <input
      type="text"
      v-model="username"
      class="input input-bordered w-full"
      name="pick_username"
      required="true"
      @beforeinput="(e) => /[^a-zA-Z0-9_]/.test(e.data) && e.preventDefault()"
      placeholder="Pick Username"
    />
    <div class="mx-2 my-4 flex justify-end">
      <button type="submit" @click="setUsername" class="btn btn-success">
        Update username
      </button>
    </div>
  </div>
</template>
