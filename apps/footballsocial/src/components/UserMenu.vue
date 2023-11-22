<script setup>
import { shallowRef } from "vue";
import { onClickOutside } from "@vueuse/core";
import { useRouter } from "vue-router";
import { useCurrentUser } from "../composables/useCurrentUser";

import { SAvatar } from "ternent-ui/components";

const showMenu = shallowRef(false);
const dropdownRef = shallowRef(null);
const { profile, signOut } = useCurrentUser();
const router = useRouter();

onClickOutside(dropdownRef, (event) => {
  showMenu.value = false;
});

async function signOutAndLeave() {
  await signOut();
  showMenu.value = false;
  router.push("/");
}
</script>
<template>
  <div class="dropdown dropdown-end">
    <label tabindex="0" class="btn btn-ghost btn-circle avatar">
      <SAvatar :name="profile.username" />
    </label>
    <ul
      tabindex="0"
      class="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52"
    >
      <li>
        <RouterLink to="/auth/profile">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="w-4 h-4"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
            />
          </svg>

          Profile</RouterLink
        >
      </li>
      <li>
        <span @click="signOutAndLeave">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="w-4 h-4 mr-2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M5.636 5.636a9 9 0 1012.728 0M12 3v9"
            />
          </svg>
          Logout</span
        >
      </li>
    </ul>
  </div>
</template>
