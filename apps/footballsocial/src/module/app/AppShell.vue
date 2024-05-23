<script setup>
import { shallowRef, computed } from "vue";
import { useLocalStorage, onClickOutside } from "@vueuse/core";
import semverGt from "semver/functions/gt";
import { useCurrentUser } from "../auth/useCurrentUser";
import { useAppVersion } from "./useAppVersion";
import { provideWhiteLabel } from "../brand/useWhiteLabel";
import UserMenu from "../auth/UserMenu.vue";
import Logo from "../brand/Logo.vue";

import SetUsername from "../auth/SetUsername.vue";

// DS components
import { SButton, SBanner, SFooter, SThemeToggle } from "ternent-ui/components";

const { appVersion, serverVersion } = useAppVersion();
const { user, ready, profile } = useCurrentUser();
const { theme, colorTheme } = provideWhiteLabel();

const hasDismissedPopup = useLocalStorage("app/hasDismissedPopup", false);
const modalRef = shallowRef(null);

onClickOutside(modalRef, () => (hasDismissedPopup.value = true));
function reloadPage() {
  window.location.reload();
}

const hasNewVersion = computed(() => {
  if (!appVersion.value || !serverVersion.value) {
    return false;
  }
  return semverGt(serverVersion.value, appVersion.value);
});

const links = [
  {
    title: "Privacy",
    to: "/legal/privacy",
  },
  {
    title: "Terms",
    to: "/legal/terms",
  },
  {
    title: "Feedback",
    to: "https://sam.staging.teamwork.com/p/forms/PBLRygLcpZ6NjG0Zlaoe",
    external: true,
  },
  {
    title: `v${appVersion.value}`,
    to: `https://github.com/samternent/home/releases/tag/footballsocial-${appVersion.value}`,
    external: true,
  },
];
</script>

<template>
  <div class="min-h-screen flex flex-col" :data-theme="theme">
    <div class="sticky top-0 z-10">
      <SBanner
        v-if="hasNewVersion"
        @click="reloadPage"
        buttonText="refresh"
        message="A new version of the app is available."
        class="rounded-none"
      />
    </div>
    <div class="flex-1 flex flex-col pt-2 bg-base-100 max-w-4xl w-full mx-auto">
      <div
        class="flex justify-between w-full max-w-6xl border-b border-base-300 pb-2 items-center"
      >
        <RouterLink
          to="/"
          class="btn btn-ghost text-lg"
          aria-label="Fooball Social"
        >
          <img
            src="/android-chrome-192x192.png"
            class="w-8 h-8"
            alt="Football Social"
          />
        </RouterLink>
        <UserMenu v-if="profile" />
        <div v-else-if="!user">
          <div class="flex justify-center items-center">
            <SButton
              aria-label="Login"
              to="/auth/login"
              class="font-medium btn-sm"
              type="primary"
            >
              Login
            </SButton>
            <span class="font-light mx-2">or</span>
            <SButton
              aria-label="Join"
              to="/auth/signup"
              class="btn-sm font-light"
              type="secondary"
            >
              Join
            </SButton>
          </div>
        </div>
      </div>

      <div
        v-if="user && !profile?.username && ready"
        class="fixed top-0 left-0 bottom-0 right-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
      >
        <div class="bg-base-100 px-4 rounded-lg shadow-lg w-96 text-center">
          <SetUsername />
        </div>
      </div>
      <RouterView />
    </div>
    <SFooter :links="links">
      <template #top>
        <p class="text-sm font-light text-center">
          Football data provided by the
          <a
            href="https://www.football-data.org/"
            target="_blank"
            referrerpolicy="noreferrer"
            class="league-link font-bold"
            >Football-Data.org</a
          >
          API.
        </p>
        <p class="text-sm font-light mb-4 text-center">
          <a href="https://www.footballsocial.app/" class="font-bold mr-1"
            >FootballSocial</a
          >is independent, hand-crafted and open-source, by
          <a
            href="https://ternent.dev"
            target="_blank"
            referrerpolicy="noreferrer"
            class="font-light hover:text-primary transition-colors group"
          >
            <span class="font-bold"
              >ternent<span
                class="font-light text-base-content border-b-2 transition-all border-transparent group-hover:border-primary"
                >dot</span
              >dev</span
            ></a
          >.
        </p>
        <Logo class="mx-auto h-auto w-12" />
      </template>
      <template #bottom>
        <SThemeToggle v-model="colorTheme" class="mt-4" />
      </template>
    </SFooter>
  </div>
</template>
