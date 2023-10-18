<script setup>
import { shallowRef, computed } from "vue";
import { useLocalStorage, onClickOutside } from "@vueuse/core";
import { useRouter } from "vue-router";
import semverGt from "semver/functions/gt";
import GithubSvg from "./assets/github-mark-white.svg";
import { provideCurrentUser } from "./composables/useCurrentUser";
import { provideAppVersion } from "./composables/useAppVersion";
import SetUsername from "./components/SetUsername.vue";
import UserMenu from "./components/UserMenu.vue";
import Api from "./Api.vue";
// import Notifications from "./components/Notifications.vue";

const { appVersion, serverVersion } = provideAppVersion();
const { user, profile, ready } = provideCurrentUser();

const hasDismissedPopup = useLocalStorage("app/hasDismissedPopup", false);

const modalRef = shallowRef(null);

const router = useRouter();
router.beforeEach((to, from) => {
  if (to.meta.auth && ready.value && !user.value) {
    router.push("/");
  }
});

onClickOutside(modalRef, (event) => (hasDismissedPopup.value = true));
function reloadPage() {
  window.location.reload();
}

const hasNewVersion = computed(() => {
  if (!appVersion.value || !serverVersion.value) {
    return false;
  }
  return semverGt(serverVersion.value, appVersion.value);
});
</script>

<template>
  <div class="dark:text-white absolute inset-0 flex flex-col">
    <div class="bg-indigo-50 sticky dark:bg-[#1c1c1c] top-0 z-30 shadow w-full">
      <div class="bg-blue-500" v-if="hasNewVersion">
        <div
          class="max-w-7xl mx-auto flex justify-left items-center flex-col md:flex-row p-2"
        >
          <p>A new version of the app is available.</p>
          <button
            class="bg-blue-800 px-3 py-1 md:ml-4 rounded hover:bg-blue-700 mt-2 md:mt-0"
            @click="reloadPage"
          >
            Refresh
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="w-6 h-6 inline ml-2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
              />
            </svg>
          </button>
        </div>
      </div>
      <div
        class="max-w-7xl flex justify-between mx-auto items-center w-full h-12"
      >
        <div class="flex flex-1">
          <RouterLink
            to="/"
            alt="Home"
            class="mr-4 text-lg no-underline hover:dark:text-white hover:no-underline dark:text-white mx-1 rounded h-10 flex items-center justify-center text-center pr-2 py-1"
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

        <div
          class="flex items-center dark:text-white"
          :key="profile?.id || 'empty'"
        >
          <RouterLink
            aria-label="Login"
            v-if="!user"
            to="/auth/login"
            class="flex items-center mx-2 px-4 py-2 text-md font-light uppercase"
          >
            Login
          </RouterLink>
          <RouterLink
            aria-label="Signup"
            v-if="!user"
            to="/auth/signup"
            class="flex items-center mx-2 px-4 py-2 text-md font-bold uppercase text-white bg-gradient-to-r from-indigo-500 to-indigo-600"
          >
            Join
          </RouterLink>

          <div v-else-if="!profile"></div>
          <div v-else class="flex">
            <!-- <Notifications /> -->
            <UserMenu />
          </div>
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
          class="bg-pink-600 flex ml-4 transition-all text-sm shadow-block-yellow dark:text-white px-3 py-1 rounded no-underline hover:no-underline hover:dark:text-white hover:bg-pink-500"
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
      <Api v-else>
        <RouterView />
      </Api>
    </div>
    <div v-else class="flex-1 flex justify-center items-center">
      <div class="lds-ring">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
    </div>
    <footer
      class="flex flex-col p-4 bg-indigo-100 dark:bg-[#242424] dark:text-white lg:flex xl:items-center"
    >
      <p class="text-sm dark:text-gray-200 font-thin py-3">
        <a
          href="https://www.footballsocial.app/"
          class="league-link font-medium mr-1"
          >FootballSocial</a
        >is independent, hand-crafted and open-source, by
        <a href="https://ternent.dev" class="league-link font-light">
          ternent.dev</a
        >.
      </p>
      <p class="text-sm font-thin py-1">
        Football data provided by the
        <a
          href="https://www.football-data.org/"
          target="_blank"
          class="league-link font-medium"
          >Football-Data.org</a
        >
        API.
      </p>
      <ul
        class="flex flex-wrap xl:flex-row flex-col mt-3 text-sm dark:text-gray-400 py-2 xl:pt-6"
      >
        <li>
          <RouterLink
            to="/legal/privacy"
            class="hover:text-gray-300 transition-colors mr-2 hover:underline h-6 xl:p-2"
            >Privacy Policy</RouterLink
          >
        </li>
        <li>
          <RouterLink
            to="/legal/terms"
            class="hover:text-gray-300 transition-colors mr-2 hover:underline h-6 xl:p-2"
            >Terms of Use</RouterLink
          >
        </li>
        <li>
          <a
            href="https://sam.staging.teamwork.com/p/forms/PBLRygLcpZ6NjG0Zlaoe"
            target="_blank"
            class="hover:text-gray-300 transition-colors mr-2 hover:underline h-6 xl:p-2"
            >Feedback</a
          >
        </li>
        <li>
          <a
            :href="`https://github.com/samternent/home/releases/tag/footballsocial-${appVersion}`"
            target="_blank"
            class="hover:text-gray-200 transition-colors mr-2 hover:underline h-6 xl:p-2"
            >v{{ appVersion }}</a
          >
        </li>
      </ul>
    </footer>
  </div>
</template>
<style scoped>
.lds-ring {
  width: 80px;
  height: 80px;
}
.lds-ring div {
  box-sizing: border-box;
  display: block;
  position: absolute;
  width: 64px;
  height: 64px;
  margin: 8px;
  border: 8px solid #3c3c3c;
  border-radius: 50%;
  animation: lds-ring 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
  border-color: #3c3c3c transparent transparent transparent;
}
.lds-ring div:nth-child(1) {
  animation-delay: -0.45s;
}
.lds-ring div:nth-child(2) {
  animation-delay: -0.3s;
}
.lds-ring div:nth-child(3) {
  animation-delay: -0.15s;
}
@keyframes lds-ring {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
