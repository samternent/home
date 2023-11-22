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
import { SSpinner, SNavBar, SBanner } from "ternent-ui/components";

// import Notifications from "./components/Notifications.vue";

const { appVersion, serverVersion } = provideAppVersion();
const { user, profile, ready } = provideCurrentUser();

const hasDismissedPopup = useLocalStorage("app/hasDismissedPopup", false);
const theme = useLocalStorage("app/theme", "bumblebee");

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

const themes = shallowRef([
  "light",
  "dark",
  "cupcake",
  "bumblebee",
  "synthwave",
  "cyberpunk",
  "dim",
]);
function setTheme(_theme) {
  theme.value = _theme;
}
</script>

<template>
  <div class="min-h-screen flex flex-col" :data-theme="theme">
    <div class="sticky top-0 z-10 bg-primary">
      <SBanner
        v-if="hasNewVersion"
        @click="reloadPage"
        buttonText="refresh"
        message="A new version of the app is available."
      />
      <SNavBar title="FS">
        <template #right>
          <div class="flex" v-if="profile">
            <!-- <details class="dropdown">
              <summary class="m-1 btn">Theme</summary>
              <ul
                class="p-2 shadow menu dropdown-content z-[1] bg-base-100 rounded-box w-52"
              >
                <li
                  v-for="theme in themes"
                  :key="theme"
                  @click="setTheme(theme)"
                >
                  {{ theme }}
                </li>
              </ul>
            </details> -->
            <UserMenu />
          </div>
        </template>
      </SNavBar>
    </div>
    <div
      class="flex-1 flex flex-col pt-2 bg-base-100 max-w-7xl w-full mx-auto"
      v-if="ready"
    >
      <template v-if="user && !profile?.username">
        <SetUsername />
      </template>
      <Api v-else>
        <RouterView />
      </Api>
    </div>
    <div v-else class="flex-1 flex justify-center items-center h-screen">
      <SSpinner />
    </div>
    <footer
      class="flex flex-col p-4 lg:flex xl:items-center border-t-8 border-primary bg-base-300"
    >
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
