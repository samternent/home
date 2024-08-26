<script setup>
import { computed } from "vue";
import {
  useLocalStorage,
  breakpointsTailwind,
  useBreakpoints,
} from "@vueuse/core";
import ternentUIThemes from "ternent-ui/themes";
import { SBrandHeader, SBreadcrumbs, SButton } from "ternent-ui/components";
import { useWhiteLabel } from "@/module/brand/useWhiteLabel";
import { useAppShell } from "@/module/app-shell/useAppShell";
import Logo from "@/module/brand/Logo.vue";
import { useBreadcrumbs } from "@/module/breadcrumbs/useBreadcrumbs";
import AppLayout from "@/module/app/AppLayout.vue";

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

        <div class="bg-base-300 bg px-4 rounded-box">
          <SBreadcrumbs :breadcrumbs="breadcrumbs" />
        </div>
      </div>
      <div>
        <!-- <input
          class="input rounded-box w-64 input-sm bg-opacity-10"
          placeholder="Search"
        /> -->
      </div>
      <div class="flex">
        <SButton to="/settings" type="outline" class="btn-sm btn-circle">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1"
            stroke="currentColor"
            class="w-6 h--6"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
            />
          </svg>
        </SButton>
        <SButton type="outline" class="btn btn-circle btn-sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1"
            stroke="currentColor"
            class="w-6 h-6"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
            />
          </svg>
        </SButton>
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
      class="flex z-30 items-center justify-between flex-1 p-4 max-h-24 w-full bg-base-300"
    >
      <RouterLink
        to="/"
        class="flex justify-center p-2 md:pl-4 md:pr-12 rounded-box"
      >
        <Logo class="h-auto w-14 mx-1 md:mr-2" />
        <div class="md:flex flex-0 flex-col justify-center hidden">
          <SBrandHeader class="!text-2xl lg:!text-3xl"
            >{{ whiteLabel.name[0]
            }}<span class="font-light text-primary text-xl lg:text-2xl">{{
              whiteLabel.name[1]
            }}</span
            >{{ whiteLabel.name[2] }}</SBrandHeader
          >
          <p class="text-xl font-light px-1 flex items-center">
            <!-- {{ whiteLabel.description }}÷ -->
            <span
              class="text-xs bg-base-content text-base-100 px-2 border-r border-b shadow rounded-box border-accent"
              >{{ whiteLabel.tag }}</span
            >
          </p>
          <span class="text-sm font-light"> </span>
        </div>
      </RouterLink>
      <div class="items-end gap-4 flex">
        <div class="hidden md:flex items-end gap-4">
          <SButton size="lg" type="primary">Contact</SButton>
          <ul class="text-xs">
            <li class="flex gap-2">
              <a
                href="https://www.linkedin.com/in/samternent/"
                target="_blank"
                class="link flex items-center"
                shrink
                >linkedin.com/in/samternent
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
            </li>
            <li class="flex gap-2">
              <a
                href="https://www.github.com/samternent/"
                target="_blank"
                class="link flex items-center"
                shrink
                >github.com/samternent
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
            </li>
          </ul>
        </div>
        <div class="flex flex-col">
          <a
            href="https://github.com/samternent/home"
            target="_blank"
            class="opacity-80 hover:opacity-100 transition-colors p-2"
          >
            <img
              v-if="themeVariation === 'dark'"
              class="w-10 lg:w-12"
              src="@/assets/github-mark-white.png"
            />
            <img v-else class="w-10 lg:w-10" src="@/assets/github-mark.png" />
          </a>
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
              /></svg
          ></a>
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
