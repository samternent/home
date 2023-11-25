<script setup>
import { shallowRef } from "vue";
import { onClickOutside } from "@vueuse/core";
import { useRouter } from "vue-router";
import { useCurrentUser } from "../composables/useCurrentUser";

const showMenu = shallowRef(false);
const dropdownRef = shallowRef(null);
const { signOut } = useCurrentUser();
const router = useRouter();

onClickOutside(dropdownRef, () => {
  showMenu.value = false;
});

async function signOutAndLeave() {
  await signOut();
  showMenu.value = false;
  router.push("/");
}
</script>
<template>
  <div class="relative ml-2" ref="dropdownRef">
    <button
      aria-label="User menu"
      @click="showMenu = !showMenu"
      class="btn btn-ghost"
    >
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
    </button>

    <div
      v-if="showMenu"
      class="absolute bg-base-200 right-0 top-12 flex flex-col overflow-hidden text-left rounded shadow-lg w-64"
    >
      <ul class="item">
        <li class="flex">
          <RouterLink
            @click="showMenu = false"
            to="/auth/profile"
            class="p-2 hover:bg-base-300 w-full"
            >Profile</RouterLink
          >
        </li>
        <li
          class="p-2 flex hover:bg-base-300 cursor-pointer hover:text-red-600"
          @click="signOutAndLeave"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="w-6 h-6 mr-4"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M5.636 5.636a9 9 0 1012.728 0M12 3v9"
            />
          </svg>
          Sign out
        </li>
      </ul>
    </div>
  </div>
</template>
