<script setup>
import {
  useLocalStorage,
  breakpointsTailwind,
  useBreakpoints,
} from "@vueuse/core";
import { computed, watch, shallowRef } from "vue";
import { useRoute } from "vue-router";
import { SThemeToggle } from "ternent-ui/components";
import { useLedger } from "../ledger/useLedger";
import { useIdentity } from "../identity/useIdentity";

const breakpoints = useBreakpoints(breakpointsTailwind);
const route = useRoute();
const mdAndLarger = breakpoints.greaterOrEqual("md");
const smallerThanMd = breakpoints.smaller("md");
const smallerThanLg = breakpoints.smaller("lg");

const theme = useLocalStorage("app/theme", "obsidian");
const themeMode = useLocalStorage("app/themeMode", "light");

watch(route, () => {
  openSideBar.value = false;
});

const openSideBar = useLocalStorage("ternentdotdev/openSideBar", false);
const showSidebar = computed(() => mdAndLarger.value || openSideBar.value);

const topItems = computed(() => [
  {
    name: "Apps",
    to: "/workspace/apps",
  },
  {
    name: "Users",
    to: "/workspace/users",
  },
  {
    name: "Permissions",
    to: "/workspace/permissions",
  },
]);
const middleItems = computed(() => [
  {
    name: "Tamper",
    to: "/workspace/tamper",
  },
  {
    name: "Solid Pods",
    to: "/workspace/solid",
  },
]);

const bottomItems = computed(() => [
  {
    name: "Docs",
    to: "/docs",
  },
  {
    name: "Protocol Spec",
    to: "/protocol/spec",
  },
]);
const appVersion = shallowRef(
  document.querySelector("html").dataset.appVersion
);

const { api, ledger } = useLedger();
const { privateKey, publicKey } = useIdentity();
const uploadInputRef = shallowRef(null);
const CORE_LEDGER_KEY = "concord:ledger:core";
const TAMPER_LEDGER_KEY = "concord:ledger:tamper";
const TAMPER_ACTIVE_KEY = "concord:ledger:tampered";

function downloadText(filename, content, mime = "application/json") {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";

  document.body.appendChild(a);
  a.click();
  a.remove();

  setTimeout(() => URL.revokeObjectURL(url), 250);
}

function downloadLedger() {
  if (!ledger.value) return;
  const head = ledger.value.head?.slice(0, 7) || "export";
  const filename = `concord-ledger-${head}.json`;
  const json = JSON.stringify(ledger.value, null, 2);
  downloadText(filename, json);
}

async function createNewLedger() {
  const confirmed = window.confirm(
    "Create a new ledger? This will replace the current working copy."
  );
  if (!confirmed) return;
  if (privateKey.value && publicKey.value) {
    await api.auth(privateKey.value, publicKey.value);
  }
  await api.create();
}

function triggerLedgerUpload() {
  uploadInputRef.value?.click();
}

async function handleLedgerUpload(event) {
  const target = event.target;
  if (!target?.files?.length) return;
  const file = target.files[0];
  target.value = "";

  let parsed;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    window.alert("Invalid ledger JSON.");
    return;
  }

  const confirmed = window.confirm(
    "Upload this ledger? This will replace the current working copy."
  );
  if (!confirmed) return;

  await api.load(parsed, [], true, true);
}

async function deleteLedger() {
  const confirmed = window.confirm(
    "Delete the current ledger? This will permanently remove it from local storage."
  );
  if (!confirmed) return;
  await api.destroy();
  window.localStorage.removeItem(CORE_LEDGER_KEY);
  window.localStorage.removeItem(TAMPER_LEDGER_KEY);
  window.localStorage.removeItem(TAMPER_ACTIVE_KEY);
}
</script>
<template>
  <div
    v-if="showSidebar"
    class="sticky top-0 flex flex-col border-r border-[var(--ui-border)] font-thin"
    :class="{
      'w-64': mdAndLarger,
      'w-64 absolute z-30 h-full': smallerThanMd && openSideBar,
    }"
  >
    <!-- Header -->
    <div v-if="smallerThanMd" class="p-4 border-b border-base-300/30">
      <div class="flex items-center justify-end">
        <!-- Mobile close button -->
        <button
          @click="openSideBar = false"
          class="btn btn-sm btn-circle btn-ghost hover:bg-base-300"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>

    <!-- Navigation Items -->
    <div
      class="flex-1 flex flex-col justify-between p-2 overflow-hidden font-mono"
    >
      <!-- Top Items -->
      <nav class="space-y-1 text-xs">
        <div v-for="item in topItems" :key="item.to" class="group">
          <!-- Main Item -->
          <RouterLink
            :to="item.to"
            class="flex items-center px-4 py-1 border-[var(--ui-border)] transition-all duration-200"
            :class="{
              'font-medium text-[var(--ui-primary)]': $route.path.startsWith(
                item.to
              ),
            }"
          >
            <div class="flex-1 min-w-0">{{ item.name }}</div>
          </RouterLink>
        </div>
        <hr class="m-4 border-t border-[var(--ui-border)]" />
        <div v-for="item in middleItems" :key="item.to" class="group text-xs">
          <!-- Main Item -->
          <RouterLink
            :to="item.to"
            class="flex items-center px-4 py-1 border-[var(--ui-border)] transition-all duration-200"
            :class="{
              'font-medium text-[var(--ui-primary)]': $route.path.startsWith(
                item.to
              ),
            }"
          >
            <div class="flex-1 min-w-0">{{ item.name }}</div>
          </RouterLink>
        </div>
      </nav>

      <!-- Bottom Items -->
      <nav class="space-y-2 pt-4">
        <div class="py-2 flex flex-col w-auto gap-2 font-mono">
          <button
            class="text-xs border border-[var(--ui-border)] px-4 py-2 rounded-full text-left cursor-pointer hover:bg-[var(--ui-primary)]/10 transition-colors"
            @click="createNewLedger"
          >
            Create new ledger
          </button>
          <input
            ref="uploadInputRef"
            type="file"
            accept="application/json"
            class="hidden"
            @change="handleLedgerUpload"
          />
          <button
            class="text-xs border border-[var(--ui-border)] px-4 py-2 rounded-full text-left cursor-pointer hover:bg-[var(--ui-fg)]/5 transition-colors"
            @click="triggerLedgerUpload"
          >
            Upload ledger
          </button>
          <button
            class="text-xs border border-[var(--ui-border)] px-4 py-2 rounded-full text-left cursor-pointer hover:bg-[var(--ui-fg)]/5 transition-colors"
            @click="downloadLedger"
          >
            Download ledger
          </button>
          <button
            class="text-xs border border-red-400/60 text-red-600 px-4 py-2 rounded-full text-left cursor-pointer hover:bg-[var(--ui-critical)]/10 transition-colors"
            @click="deleteLedger"
          >
            Delete ledger
          </button>
        </div>
        <div class="flex flex-col w-auto gap-1 font-sans">
          <RouterLink
            v-for="item in bottomItems"
            :key="item.to"
            :to="item.to"
            class="flex items-center gap-3 rounded-lg transition-all duration-200 hover:bg-base-300/50 text-xs px-4 hover:text-[var(--ui-secondary)]"
          >
            {{ item.name }}
          </RouterLink>
          <a
            :href="`https://github.com/samternent/home/releases/tag/concord-${appVersion}`"
            target="_blank"
            class="text-xs font-mono px-2 hover:text-[var(--ui-accent)] transition-colors px-4 py-2"
          >
            v{{ appVersion }}
          </a>
        </div>
        <div class="flex items-center justify-between py-2 font-sans text-xs">
          <SThemeToggle
            v-model="theme"
            show-dropdown
            size="xs"
            class="w-full"
          />
          <SThemeToggle v-model="themeMode" size="sm" class="w-20" />
        </div>
      </nav>
    </div>
  </div>
</template>
