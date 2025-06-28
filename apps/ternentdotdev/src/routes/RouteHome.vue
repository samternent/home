<script setup>
import { computed } from "vue";
import {
  useLocalStorage,
  breakpointsTailwind,
  useBreakpoints,
} from "@vueuse/core";
import ternentUIThemes from "ternent-ui/themes";
import { SDropdown, SBreadcrumbs, SButton } from "ternent-ui/components";
import { useWhiteLabel } from "@/module/brand/useWhiteLabel";
import { useAppShell } from "@/module/app-shell/useAppShell";
import Logo from "@/module/brand/Logo.vue";
import { useBreadcrumbs } from "@/module/breadcrumbs/useBreadcrumbs";
import AppLayout from "@/module/app/AppLayout.vue";
import { useIdentity } from "@/module/identity/useIdentity";
import IdentityAvatar from "@/module/identity/IdentityAvatar.vue";

const whiteLabel = useWhiteLabel();
const themeName = useLocalStorage("app/theme", null);
const { appVersion } = useAppShell();
const themeVariation = computed(
  () => ternentUIThemes[themeName.value]?.["color-scheme"] || "light"
);
const breakpoints = useBreakpoints(breakpointsTailwind);
const smallerThanMd = breakpoints.smaller("md");
const openSideBar = useLocalStorage("ternentdotdev/openSideBar", false);
const breadcrumbs = useBreadcrumbs({
  path: "/",
  name: "Home",
});

const { publicKeyPEM } = useIdentity();
</script>
<template>
  <div
    class="flex flex-col justify-end flex-1 w-full relative mx-auto h-screen max-h-screen overflow-hidden"
  >
    <div
      class="flex z-30 mx-auto w-full bg-primary gap-4 h-14 p-2 items-center sticky top-0 px-4 justify-between"
    >
      <div class="flex gap-2">
        <SButton
          v-if="smallerThanMd"
          type="outline"
          class="btn btn-circle btn-sm"
          @click="openSideBar = !openSideBar"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            data-slot="icon"
            class="w-6 h-6"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
            />
          </svg>
        </SButton>

        <div class="bg-base-100 bg-opacity-50 bg px-4 rounded-box">
          <SBreadcrumbs :breadcrumbs="breadcrumbs" />
        </div>
      </div>
      <div class="w-1/3"></div>
      <div class="flex">
        <SDropdown>
          <template #activator="{ showMenu }">
            <SButton
              class="btn btn-ghost btn-circle bg-base-300 btn-sm hover:scale-105"
              @click="showMenu"
            >
              <IdentityAvatar :identity="publicKeyPEM" size="xs" />
            </SButton>
          </template>
          <div class="menu bg-base-100 w-64 rounded-box shadow-lg border border-base-300">
            <div class="menu-title px-4 py-2 border-b border-base-300">
              <div class="flex items-center gap-3">
                <IdentityAvatar :identity="publicKeyPEM" size="sm" />
                <div>
                  <div class="font-semibold">Your Identity</div>
                  <div class="text-xs text-base-content/60">Cryptographic Profile</div>
                </div>
              </div>
            </div>
            
            <ul class="p-2">
              <li>
                <router-link to="/app/profile" class="flex items-center gap-3 p-3 rounded-lg hover:bg-base-200">
                  <span class="text-lg">👤</span>
                  <div>
                    <div class="font-medium">View Profile</div>
                    <div class="text-xs text-base-content/60">Identity & keys overview</div>
                  </div>
                </router-link>
              </li>
              
              <li>
                <router-link to="/app/profile/management" class="flex items-center gap-3 p-3 rounded-lg hover:bg-base-200">
                  <span class="text-lg">👥</span>
                  <div>
                    <div class="font-medium">Manage Profile</div>
                    <div class="text-xs text-base-content/60">Edit, share & backup</div>
                  </div>
                </router-link>
              </li>
              
              <div class="divider my-1"></div>
              
              <li>
                <router-link to="/app/settings" class="flex items-center gap-3 p-3 rounded-lg hover:bg-base-200">
                  <span class="text-lg">⚙️</span>
                  <div>
                    <div class="font-medium">Settings</div>
                    <div class="text-xs text-base-content/60">App preferences</div>
                  </div>
                </router-link>
              </li>
              
              <li>
                <router-link to="/solid" class="flex items-center gap-3 p-3 rounded-lg hover:bg-base-200">
                  <span class="text-lg">🌐</span>
                  <div>
                    <div class="font-medium">Solid Pod</div>
                    <div class="text-xs text-base-content/60">Connect & sync</div>
                  </div>
                </router-link>
              </li>
            </ul>
          </div>
        </SDropdown>
      </div>
    </div>
    <AppLayout>
      <RouterView v-slot="{ Component }">
        <Transition name="fade" duration="50" mode="out-in" class="flex flex-1">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </AppLayout>

    <div
      class="flex z-30 items-center justify-between flex-1 p-2 max-h-8 w-full bg-base-300"
    >
      <RouterLink
        to="/"
        class="flex justify-center p-2 rounded-box hover:scale-105 transition-transform"
      >
        <Logo class="h-auto w-6" />
      </RouterLink>
      <div class="items-center gap-4 flex h-full">
        <div class="flex flex-col">
          <a
            :href="`https://github.com/samternent/home/releases/tag/ternentdotdev-${appVersion}`"
            target="_blank"
            class="link flex items-center ml-2 text-xs"
            >{{ appVersion }}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="w-4 h-4 ml-2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
              />
            </svg>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
