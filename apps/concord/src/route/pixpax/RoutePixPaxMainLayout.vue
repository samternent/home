<script lang="ts" setup>
import { useLocalStorage } from "@vueuse/core";
import { SThemeToggle } from "ternent-ui";
import AppBootstrap from "../../module/app/AppBootstrap.vue";
import Logo from "../../module/brand/Logo.vue";
import IdentityAvatar from "../../module/identity/IdentityAvatar.vue";
import PixPaxAvatarDropdown from "../../module/pixpax/ui/PixPaxAvatarDropdown.vue";
import PixPaxLogoText from "../../module/pixpax/ui/assets/PixPaxLogoText.svg?component";
import { providePixpaxCloudSync } from "../../module/pixpax/context/usePixpaxCloudSync";
import { providePixpaxContextStore } from "../../module/pixpax/context/usePixpaxContextStore";
import { providePixpaxSwitchContext } from "../../module/pixpax/context/usePixpaxSwitchContext";

const themeMode = useLocalStorage("app/themeMode", "light");

const context = providePixpaxContextStore();
providePixpaxCloudSync({ context });
providePixpaxSwitchContext({ context });

const {
  pixbookReadOnly,
  viewedPixbookProfile,
  viewingIdentityKey,
  viewingLabel,
  returnToMyPixbook,
} = context;
</script>

<template>
  <AppBootstrap :read-only="pixbookReadOnly">
    <div
      class="dark flex flex-col flex-1 font-mono bg-[image:var(--bg-pixpax)]"
    >
      <header
        class="sticky top-0 z-30 w-full backdrop-blur-[12px] border-b border-[var(--ui-border)]"
      >
        <div class="mx-auto flex items-center w-full justify-between px-4 py-2">
          <div class="hidden lg:block flex-1" />
          <RouterLink :to="{ name: 'pixpax-main' }"
            ><PixPaxLogoText class="h-4 lg:h-6"
          /></RouterLink>

          <div class="flex-1 flex justify-end">
            <PixPaxAvatarDropdown />
          </div>
        </div>
      </header>

      <div
        v-if="pixbookReadOnly && viewedPixbookProfile"
        class="mt-6 mx-auto sticky z-20 top-20 backdrop-blur-sm w-100 flex items-center justify-between gap-3 rounded-full border border-[var(--ui-border)] bg-[var(--ui-bg)]/60 px-4 py-2 text-xs"
      >
        <div class="flex items-center gap-3">
          <IdentityAvatar :identity="viewingIdentityKey" size="sm" />
          <div class="flex flex-col text-left">
            <span class="text-[var(--ui-fg-muted)]">Viewing</span>
            <span class="text-[var(--ui-fg)] font-semibold"
              >{{ viewingLabel }}'s pixbook</span
            >
          </div>
        </div>
        <button
          type="button"
          class="ml-2 rounded-full border border-[var(--ui-border)] px-3 py-1 text-[10px] uppercase tracking-wide hover:bg-[var(--ui-fg)]/5 transition-colors"
          @click="returnToMyPixbook"
        >
          Return to my pixbook
        </button>
      </div>

      <slot />

      <footer
        class="flex justify-end items-center py-8 border-t-[1px] border-[var(--ui-border)] w-full"
      >
        <div
          class="max-w-[980px] mx-auto w-full flex flex-col items-center gap-6"
        >
          <a
            href="https://concord.ternent.dev"
            class="flex flex-col items-center justify-center gap-1 opacity-80 hover:opacity-100 text-xs font-mono font-thin -translate-y-1 hover:-translate-y-0.5 group-hover:translate-x-1.5 transition-all duration-300"
          >
            <span
              class="text-xs font-mono font-thin -translate-y-1 group-hover:translate-y-0.5 group-hover:translate-x-1.5 transition-all duration-300"
              >Verifiable ownership.</span
            >
            <span
              class="text-xs font-mono font-thin -translate-y-1 group-hover:translate-y-0.5 group-hover:translate-x-1.5 transition-all duration-300"
              >POWERED BY CONCORD</span
            >
            <Logo
              class="size-8 group-hover:-rotate-6 transition-all duration-300"
            />
          </a>
          <div class="flex items-center gap-3">
            <RouterLink
              :to="{ name: 'pixpax-about' }"
              class="opacity-80 hover:opacity-100 text-xs font-mono font-thin -translate-y-1 hover:-translate-y-0.5 transition-all duration-300"
              >About</RouterLink
            >

            <!-- <RouterLink
              :to="{ name: 'pixpax-settings-home' }"
              class="opacity-80 hover:opacity-100 text-xs font-mono font-thin -translate-y-1 hover:-translate-y-0.5 transition-all duration-300"
              >Settings</RouterLink
            > -->
            <!-- <RouterLink
              :to="{ name: 'pixpax-control-creator' }"
              class="opacity-80 hover:opacity-100 text-xs font-mono font-thin -translate-y-1 hover:-translate-y-0.5 transition-all duration-300"
              >Creator</RouterLink
            >
            <RouterLink
              :to="{ name: 'pixpax-control-analytics' }"
              class="opacity-80 hover:opacity-100 text-xs font-mono font-thin -translate-y-1 hover:-translate-y-0.5 transition-all duration-300"
              >Analytics</RouterLink
            > -->
            <RouterLink
              :to="{ name: 'pixpax-control-admin' }"
              class="opacity-80 hover:opacity-100 text-xs font-mono font-thin -translate-y-1 hover:-translate-y-0.5 transition-all duration-300"
              >Admin</RouterLink
            >
          </div>
          <div class="flex items-center justify-center py-2 font-sans text-xs">
            <SThemeToggle v-model="themeMode" size="sm" />
          </div>
          <div class="flex gap-2 items-center justify-center">
            <a
              href="mailto:sam@ternent.dev"
              class="opacity-80 hover:opacity-100 text-xs font-mono font-thin -translate-y-1 hover:-translate-y-0.5 transition-all duration-300"
            >
              sam@ternent.dev
            </a>
          </div>
        </div>
      </footer>
    </div>
  </AppBootstrap>
</template>
