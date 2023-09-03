<script setup>
import { shallowRef } from "vue";
import { onClickOutside } from "@vueuse/core";
import { useRouter } from "vue-router";
import { useCurrentUser } from '../composables/useCurrentUser';

const showMenu = shallowRef(false);
const dropdownRef = shallowRef(null);
const { profile, signOut } = useCurrentUser();
const router = useRouter();

onClickOutside(dropdownRef, (event) => {
  showMenu.value = false;
});

async function signOutAndLeave() {
  await signOut();
  router.push("/");
}
</script>
<template>
  <div class="relative" ref="dropdownRef">
    <button @click="showMenu = !showMenu" class="flex">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        class="w-6 h-6 text-[#4d4d4d]"
      >
        <path
          fill-rule="evenodd"
          d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z"
          clip-rule="evenodd"
        />
      </svg>
    </button>

    <div
      v-if="showMenu"
      class="absolute dark:bg-zinc-900 right-0 top-8 flex flex-col overflow-hidden text-left rounded border border-zinc-700 w-64"
    >
      <ul class="item">
        <!-- <li v-if="profile.username === 'sam'" class="flex">
          <RouterLink to="/admin" class="p-2 hover:bg-zinc-800 w-full hover:text-indigo-500">Admin</RouterLink>
        </li> -->
        <li class="flex">
          <RouterLink to="/auth/profile" class="p-2 hover:bg-zinc-800 w-full hover:text-indigo-500">Profile</RouterLink>
        </li>
        <li class="p-2 flex hover:bg-zinc-800 cursor-pointer hover:text-red-600" @click="signOutAndLeave">
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
