<script setup>
import { shallowRef, computed } from "vue";
import { useLocalStorage, onClickOutside, useColorMode } from "@vueuse/core";
import { useRouter } from "vue-router";
import semverGt from "semver/functions/gt";
import { provideCurrentUser } from "./composables/useCurrentUser";
import { provideAppVersion } from "./composables/useAppVersion";
import UserMenu from "./components/UserMenu.vue";
import Logo from "./module/brand/Logo.vue";
import Api from "./Api.vue";

// DS components
import {
  SBrandHeader,
  SNavBar,
  SBanner,
  SFooter,
  SThemeToggle,
} from "ternent-ui/components";

// import Notifications from "./components/Notifications.vue";

const { appVersion, serverVersion } = provideAppVersion();
const { user, ready, profile } = provideCurrentUser();

const hasDismissedPopup = useLocalStorage("app/hasDismissedPopup", false);
const mode = useColorMode();
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
const theme = useLocalStorage(
  "app/theme",
  window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
);
</script>

<template>
  <div
    class="min-h-screen flex flex-col"
    :data-theme="`${profile?.club ? `${profile.club}-` : ''}${theme}`"
  >
    <div class="sticky top-0 z-10 bg-primary">
      <SBanner
        v-if="hasNewVersion"
        @click="reloadPage"
        buttonText="refresh"
        message="A new version of the app is available."
      />
    </div>
    <div class="flex-1 flex flex-col pt-2 bg-base-100 max-w-4xl w-full mx-auto">
      <div
        class="flex justify-between w-full max-w-6xl border-b pb-2 items-center"
      >
        <RouterLink to="/" class="btn btn-ghost btn-sm">FS</RouterLink>
        <UserMenu v-if="profile" />
      </div>

      <Api>
        <RouterView />
      </Api>
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
        <SThemeToggle v-model="theme" class="mt-4"/>
      </template>
    </SFooter>
  </div>
</template>
