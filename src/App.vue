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
  <div class="text-white min-h-screen flex flex-col">
    <div class="sticky bg-[#1c1c1c] top-0 z-30 shadow w-full">
      <div
        class="max-w-7xl flex justify-between mx-auto items-center w-full h-12"
      >
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

        <div class="flex items-center text-white" :key="profile?.id || 'empty'">
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
        </div>
      </div>
    </div>

    <div class="flex-1 flex flex-col" v-if="ready">
      <template v-if="user && !profile?.username">
        <SetUsername />
      </template>
      <RouterView v-else />
    </div>
  </div>
</template>
