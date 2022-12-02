<script setup>
import { useLocalStorage } from "@vueuse/core";
import { shallowRef } from "vue";
import api from "./utils/api";
import { useToast } from "vue-toastification";

import { provideCurrentUser } from "./composables/useCurrentUser";
import SetUsername from "./components/SetUsername.vue";
import Notifications from "./components/Notifications.vue";
import { onMounted } from "vue";

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

const notificationsEnabled = shallowRef(false);
const notificationsDeclined = useLocalStorage("notifciationsDeclined", false);
onMounted(async () => {
  if (Notification.permission === "granted") {
    notificationsEnabled.value = true;
  }
});
async function requestNotifcationPermissions() {
  const result = await Notification.requestPermission();
  if (result === "granted") {
    notificationsEnabled.value = true;
    const notifTitle = "You have enabled notifcations";
    const notifBody = `Talk Football, with Football people.`;
    const notifImg = `/android-chrome-512x512.png`;
    const options = {
      body: notifBody,
      icon: notifImg,
    };
    new Notification(notifTitle, options);
  }
}
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
        </div>
      </div>
    </div>

    <div class="flex-1 flex flex-col" v-if="ready">
      <div
        v-if="!notificationsDeclined && !notificationsEnabled"
        class="px-2 py-2 bg-indigo-600 rounded my-2 mx-auto flex"
      >
        Don't miss a beat.
        <button
          @click="requestNotifcationPermissions"
          class="mx-2 flex px-2 text-md font-medium rounded ml-8 text-gray-900 bg-yellow-500 items-center"
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
      </div>
      <template v-if="user && !profile?.username">
        <SetUsername />
      </template>
      <RouterView v-else />
    </div>
  </div>
</template>
