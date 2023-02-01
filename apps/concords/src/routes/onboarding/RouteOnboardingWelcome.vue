<script lang="ts" setup>
import { LayoutHeaderTitle } from "@/modules/layout";
import { NButton } from "naive-ui";
</script>
<template>
  <div
    class="w-full flex-1 mx-auto max-w-6xl px-8 flex justify-center flex-col animate"
  >
    <div
      class="mt-12 mb-2 flex text-2xl justify-between items-center w-full mx-4 px-8 rounded-xl"
    >
      <div class="text-1xl text-white pt-4 font-light animate my-8">
        <span class="font-medium text-5xl text-pink-500">concord: </span>
        <span class="text-5xl font-thin">noun.</span>
        <p class="text-white font-thin text-lg">
          <em>agreement or harmony between people or groups.</em>
        </p>
      </div>
      <NButton
        @click="$router.push({ path: '/identity' })"
        strong
        secondary
        round
        type="primary"
      >
        Take the tour
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-5 h-5 ml-2"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M8.25 4.5l7.5 7.5-7.5 7.5"
          />
        </svg>
      </NButton>
    </div>
    <div class="mt-4">
      <p class="my-3 text-3xl font-thin w-3/4 mx-auto">
        Concords is an anonymous and secure web app that leans on cryptographic
        principals to create an anonymous, secure, immutable, verifiable and
        replicable data documents directly in the browser.
      </p>
      <ul
        class="text-lg font-thin mt-8 mb-16 py-4 rounded-xl bg-[#1a1a1a] px-6 w-3/4 mx-auto"
      >
        <li class="pl-2">Granular permissions with Age encryption.</li>
        <li class="pl-2">Tamper-proof data structure.</li>
        <li class="pl-2">ECDSA signed transations.</li>
        <li class="pl-2">
          No datastore. Works completely offline and we never see your document.
        </li>
        <li class="pl-2">Git inspired commit based workflow.</li>
        <li class="pl-2">
          Storage agnostic. Supports raw and encrypted JSON download/upload.
        </li>
      </ul>
    </div>
  </div>
</template>
<style scoped>
@counter-style repeating-emoji {
  system: cyclic;
  symbols: "🔒" "🔐" "🔏" "⚡" "🤓" "💾";
  suffix: " ";
}

ul {
  list-style-type: repeating-emoji;
}
ul li {
  margin-left: 20px;
}
</style>
