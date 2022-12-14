<script lang="ts" setup>
import { onMounted, ShallowRef, shallowRef, watchEffect } from "vue";
import {
  createIdentity,
  exportPublicKeyAsPem,
  exportPrivateKeyAsPem,
} from "@concords/identity";

const keys: ShallowRef<CryptoKeyPair | null> = shallowRef(null);

onMounted(async () => {
  keys.value = await createIdentity();
});
const publicKey: ShallowRef<string | null> = shallowRef(null);
const privateKey: ShallowRef<string | null> = shallowRef(null);

watchEffect(async () => {
  if (keys.value) {
    publicKey.value = await exportPublicKeyAsPem(keys.value?.publicKey);
    privateKey.value = await exportPrivateKeyAsPem(keys.value?.privateKey);
  }
});
</script>
<template>
  <div
    class="w-full flex-1 mx-auto max-w-6xl px-8 flex justify-center flex-col"
  >
    <div class="text-3xl text-white pt-4 font-light animate">
      <span class="font-medium text-5xl">concord: </span>
      <span class="text-5xl font-thin">noun.</span>
      <p class="text-white font-thin">
        <em>agreement or harmony between people or groups.</em>
      </p>
      <!-- <p class="mt-4 text-2xl">Concords is a A different kind of web app.</p> -->
      <p class="mt-4 text-xl">
        <span class="text-2xl font-medium">Secure by design</span>. An
        <strong>anonymous</strong>
        web app, using ECDSA Identity & Age Encryption for protected document
        data files.
      </p>
      <div class="mt-12 mb-8 flex text-2xl items-center w-full">
        <RouterLink
          to="/l/create"
          class="px-4 py-2 text-lg bg-green-600 hover:bg-green-700 transition-all rounded-full flex items-center font-medium"
        >
          Get started...
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
        </RouterLink>
      </div>

      <!-- <ul class="text-lg my-8 px-6 py-4 rounded-xl">
        <li class="pl-2">Granular permissions with Age encryption.</li>
        <li class="pl-2">Tamper-proof data structure.</li>
        <li class="pl-2">ECDSA signed transations.</li>
        <li class="pl-2">Works completely offline.</li>
        <li class="pl-2">Git inspired commit based workflow.</li>
        <li class="pl-2">
          Storage agnostic. Supports raw and encrypted JSON download/upload.
        </li>
      </ul> -->
      <!-- <pre class="text-sm">{{ publicKey }}</pre>
      <pre class="text-sm">{{ privateKey }}</pre> -->
    </div>
  </div>
  <footer
    class="p-4 text-white md:flex md:items-center md:justify-between md:p-6"
  >
    <span class="text-sm sm:text-center text-white">
      <a href="https://www.teamconcords.com" class="league-link"
        >Team Concords Limited</a
      >
      © 2022.
    </span>
    <ul class="flex flex-wrap items-center mt-3 text-sm text-white sm:mt-0">
      <!-- <li>
        <RouterLink to="/company/about" class="mr-4 hover:underline md:mr-6"
          >About</RouterLink
        >
      </li>
      <li>
        <RouterLink to="/legal/privacy" class="mr-4 hover:underline md:mr-6"
          >Privacy Policy</RouterLink
        >
      </li>
      <li>
        <RouterLink to="/legal/terms" class="mr-4 hover:underline md:mr-6"
          >Terms of Use</RouterLink
        >
      </li>
      <li>
        <RouterLink to="/company/contact" class="mr-4 hover:underline md:mr-6"
          >Contact</RouterLink
        >
      </li> -->
    </ul>
  </footer>
</template>
<style>
@counter-style repeating-emoji {
  system: cyclic;
  symbols: "🔒" "🔐" "🔏" "⚡" "🤓" "💾";
  suffix: " ";
}

ul {
  list-style-type: repeating-emoji;
}

.animate {
  animation-duration: 0.5s;
  animation-name: animate-fade;
  animation-fill-mode: backwards;
}

@keyframes animate-fade {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
