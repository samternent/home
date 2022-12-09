<script setup>
import { provideCurrentUser } from "./composables/useCurrentUser";
import SetUsername from "./components/SetUsername.vue";

const { user, profile, ready } = provideCurrentUser();
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
          <svg class="w-8 h-8 fill-[#44575F]" viewBox="0 0 48 48">
            <g>
              <path
                d="M5.899999237060548,-7.629394538355427e-7 c-5.6,0 -5.9,5.3 -5.9,5.6 v38.9 c19.9,0 35.2,0 38.6,0 c5.6,0 5.9,-5.3 5.9,-5.6 V-7.629394538355427e-7 H5.899999237060548 zM7.099999237060544,13.599999237060544 c0,0 1.9,2.1 6.4,2.1 s6.3,-2.1 6.3,-2.1 c0,2.8 -2.8,5.1 -6.3,5.1 C9.99999923706055,18.699999237060545 7.099999237060544,16.39999923706055 7.099999237060544,13.599999237060544 zM32.49999923706055,30.599999237060544 c-1.5,0.9 -3.2,1.5 -5.1,2 c-1.6,0.4 -3.2,0.6000000000000001 -4.9,0.6000000000000001 c-2,0 -3.9,-0.30000000000000004 -5.8,-0.8 c-1.7000000000000002,-0.5 -3.3,-1.2 -4.7,-2 c-0.9,-0.6000000000000001 -1.1,-1.7000000000000002 -0.6000000000000001,-2.6 c0.6000000000000001,-0.9 1.7000000000000002,-1.1 2.6,-0.6000000000000001 c1.1,0.7000000000000001 2.3,1.2 3.7,1.6 c2.8,0.8 6,0.8 8.9,0.2 c1.5,-0.4 2.9,-0.9 4,-1.6 c0.9,-0.5 2,-0.2 2.6,0.6000000000000001 C33.699999237060545,28.89999923706055 33.39999923706055,30.099999237060544 32.49999923706055,30.599999237060544 zM31.89999923706055,18.699999237060545 c-3.5,0 -6.3,-2.3 -6.3,-5.1 c0,0 1.9,2.1 6.4,2.1 s6.3,-2.1 6.3,-2.1 C38.199999237060545,16.39999923706055 35.29999923706055,18.699999237060545 31.89999923706055,18.699999237060545 z"
                id="svg_1"
                class=""
                fill="inherit"
                fill-opacity="1"
              />
            </g>
          </svg>
        </RouterLink>

        <div class="flex items-center text-white" :key="profile?.id || 'empty'">
          <!-- <RouterLink
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
          </div> -->
        </div>
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
  </div>
</template>
