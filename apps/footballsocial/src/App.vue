<script setup>
import api from "./utils/api";
import { useToast } from "vue-toastification";

import { provideCurrentUser } from "./composables/useCurrentUser";
import SetUsername from "./components/SetUsername.vue";
import Notifications from "./components/Notifications.vue";

const toast = useToast();

const { user, profile, ready } = provideCurrentUser();

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response.status === 429) {
      toast.error(
        "Sorry, our servers are very busy right now. Please try again later",
        {
          position: "bottom-right",
          timeout: 5000,
          closeOnClick: true,
          pauseOnFocusLoss: false,
          pauseOnHover: true,
          draggable: true,
          draggablePercent: 0.6,
          showCloseButtonOnHover: true,
          hideProgressBar: true,
          closeButton: "button",
          icon: true,
          rtl: false,
        }
      );
    }
    return Promise.reject(error);
  }
);
</script>

<template>
  <div class="text-white absolute inset-0 flex flex-col">
    <div class="sticky bg-[#1c1c1c] top-0 z-30 shadow w-full">
      <div
        class="max-w-7xl flex justify-between mx-auto items-center w-full h-12"
      >
        <div class="flex flex-1">
          <RouterLink
            to="/"
            alt="Home"
            class="mr-4 text-lg no-underline hover:text-white hover:no-underline text-white mx-1 rounded h-10 flex items-center justify-center text-center px-2 py-1"
          >
            <img
              alt="Football Social"
              src="./assets/logo-small.png"
              class="h-8 w-8"
            />
          </RouterLink>
          <section
            id="HeaderControls"
            class="flex-1 flex items-center"
          ></section>
        </div>

        <!-- <div class="flex items-center text-white" :key="profile?.id || 'empty'">
          <RouterLink
            aria-label="Login"
            v-if="!user"
            to="/auth/login"
            class="h-8 flex items-center mx-2 px-4 text-md font-medium uppercase"
          >
            Login
          </RouterLink>
          <RouterLink
            aria-label="Signup"
            v-if="!user"
            to="/auth/signup"
            class="h-8 flex items-center mx-2 px-4 text-md font-medium uppercase text-gray-900 bg-yellow-500"
          >
            Join
          </RouterLink>

          <div v-else-if="!profile"></div>
          <div v-else class="flex">
            <Notifications />
            <RouterLink
              :to="`/auth/profile/${profile?.username}`"
              class="px-2 text-xs"
            >
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
            </RouterLink>
          </div>
        </div> -->
      </div>
    </div>

    <div class="flex-1 flex flex-col" v-if="ready">
      <!-- <div
        v-if="user && !notificationsDeclined && !notificationsEnabled"
        class="max-w-7xl px-4 py-2 rounded my-2 mx-auto flex items-center w-full justify-end"
      >
        Don't miss a beat.
        <button
          @click="requestNotifcationPermissions"
          class="bg-pink-600 flex ml-4 transition-all text-sm shadow-block-yellow text-white px-3 py-1 rounded no-underline hover:no-underline hover:text-white hover:bg-pink-500"
        >
          Enable Notifications
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            class="w-5 h-5 ml-2"
          >
            <path
              fill-rule="evenodd"
              d="M5.25 9a6.75 6.75 0 0113.5 0v.75c0 2.123.8 4.057 2.118 5.52a.75.75 0 01-.297 1.206c-1.544.57-3.16.99-4.831 1.243a3.75 3.75 0 11-7.48 0 24.585 24.585 0 01-4.831-1.244.75.75 0 01-.298-1.205A8.217 8.217 0 005.25 9.75V9zm4.502 8.9a2.25 2.25 0 104.496 0 25.057 25.057 0 01-4.496 0z"
              clip-rule="evenodd"
            />
          </svg>
        </button>
      </div> -->
      <template v-if="user && !profile?.username">
        <SetUsername />
      </template>
      <RouterView v-else />
    </div>
    <footer
      class="p-4 bg-[#242424] text-white md:flex md:items-center md:justify-between md:p-6"
    >
      <span class="text-sm sm:text-center text-gray-200"
        ><a href="https://www.footballsocial.app/" class="league-link"
          >FootballSocial</a
        >
        by

        <a href="https://www.teamconcords.com/" class="league-link"
          >Team Concords Limited</a
        >
        © 2023.
      </span>
      <ul
        class="flex flex-wrap items-center mt-3 text-sm text-gray-400 sm:mt-0"
      >
        <!-- <li>
          <RouterLink to="/company/about" class="mr-4 hover:underline md:mr-6"
            >About</RouterLink
          >
        </li> -->
        <li>
          <RouterLink to="/legal/privacy" class="mr-4 hover:underline md:mr-6"
            >Privacy Policy</RouterLink
          >
        </li>
        <li>
          <RouterLink to="/legal/terms" class="mr-4 hover:underline md:mr-6"
            >Terms of Use</RouterLink
          >
        </li>
        <!-- <li>
          <RouterLink to="/company/contact" class="mr-4 hover:underline md:mr-6"
            >Contact</RouterLink
          >
        </li> -->
      </ul>
    </footer>
  </div>
</template>
