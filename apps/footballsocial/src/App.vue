<script setup>
import { shallowRef, computed } from "vue";
import { useLocalStorage, onClickOutside } from "@vueuse/core";
import { useRouter } from "vue-router";
import semverGt from "semver/functions/gt";
import { provideCurrentUser } from "./composables/useCurrentUser";
import { provideAppVersion } from "./composables/useAppVersion";
import SetUsername from "./components/SetUsername.vue";
import UserMenu from "./components/UserMenu.vue";
import Api from "./Api.vue";

// DS components
import TSpinner from "ternent/ui/TSpinner";

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
  <div class="absolute inset-0 flex flex-col">
    <div class="sticky top-0 z-30 shadow w-full bg-default">
      <div class="" v-if="hasNewVersion">
        <div
          class="max-w-7xl mx-auto flex justify-left items-center flex-col md:flex-row p-2"
        >
          <p>A new version of the app is available.</p>
          <button
            class="px-3 py-1 md:ml-4 rounded mt-2 md:mt-0"
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
            class="mr-4 text-lg no-underline hover:no-underline mx-1 rounded h-10 flex items-center justify-center text-center pr-2 py-1"
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

        <div class="flex items-center" :key="profile?.id || 'empty'">
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
            class="flex items-center mx-2 px-4 py-2 text-md font-bold uppercase"
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
      <template v-if="user && !profile?.username">
        <SetUsername />
      </template>
      <Api v-else>
        <RouterView />
      </Api>
    </div>
    <div v-else class="flex-1 flex justify-center items-center">
      <TSpinner />
    </div>
    <footer class="flex flex-col p-4 lg:flex xl:items-center">
      <p class="text-sm font-thin py-3">
        <a href="https://www.footballsocial.app/" class="font-medium mr-1"
          >FootballSocial</a
        >is independent, hand-crafted and open-source, by
        <a href="https://ternent.dev" class="font-light"> ternent.dev</a>.
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
      <ul class="flex flex-wrap xl:flex-row flex-col mt-3 text-sm py-2 xl:pt-6">
        <li>
          <RouterLink
            to="/legal/privacy"
            class="transition-colors mr-2 hover:underline h-6 xl:p-2"
            >Privacy Policy</RouterLink
          >
        </li>
        <li>
          <RouterLink
            to="/legal/terms"
            class="transition-colors mr-2 hover:underline h-6 xl:p-2"
            >Terms of Use</RouterLink
          >
        </li>
        <li>
          <a
            href="https://sam.staging.teamwork.com/p/forms/PBLRygLcpZ6NjG0Zlaoe"
            target="_blank"
            class="transition-colors mr-2 hover:underline h-6 xl:p-2"
            >Feedback</a
          >
        </li>
        <li>
          <a
            :href="`https://github.com/samternent/home/releases/tag/footballsocial-${appVersion}`"
            target="_blank"
            class="transition-colors mr-2 hover:underline h-6 xl:p-2"
            >v{{ appVersion }}</a
          >
        </li>
      </ul>
    </footer>
  </div>
</template>
