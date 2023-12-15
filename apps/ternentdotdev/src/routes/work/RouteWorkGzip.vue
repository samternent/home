<script setup>
import { useLocalStorage } from "@vueuse/core";
import { SBrandHeader, SBrowserMockup } from "ternent-ui/components";
import { useBreadcrumbs } from "../../module/breadcrumbs/useBreadcrumbs";

useBreadcrumbs({
  path: "/work/gzip",
  name: "GZip",
});

const viewType = useLocalStorage("work/gzip/viewType", "mobile");
</script>
<template>
  <div class="flex flex-col h-full flex-1 p-4">
    <SBrandHeader class="font-light">GZip</SBrandHeader>
    <div class="join mx-auto my-4">
      <button class="btn btn-sm join-item" @click="viewType = 'mobile'">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-6 h-6"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"
          />
        </svg>
      </button>
      <button class="btn btn-sm join-item" @click="viewType = 'desktop'">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-6 h-6"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25"
          />
        </svg>
      </button>
    </div>
    <SBrowserMockup
      url="https://gzip.ternent.dev"
      class="flex-1 w-full mx-auto"
      :class="{
        'max-w-7xl': viewType === 'desktop',
        'max-w-md': viewType === 'mobile',
      }"
    />
  </div>
</template>
