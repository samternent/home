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
    <div class="text-3xl text-white pt-4 font-light">
      <span class="font-medium text-5xl">concord: </span>
      <span class="text-5xl font-thin">noun.</span>
      <p class="text-white font-thin">
        <em>agreement or harmony between people or groups.</em>
      </p>
      <p class="mt-4 text-xl">
        <span class="text-2xl font-medium">Secure by design</span>.
        <strong>ECDSA Identity & Age Encryption</strong> protected document data
        files.
      </p>
      <ul class="text-lg my-8 px-4">
        <li class="pl-2">Granular permissions with Age encryption.</li>
        <li class="pl-2">Tamper-proof data structure.</li>
        <li class="pl-2">ECDSA signed transations.</li>
        <li class="pl-2">Works completely offline.</li>
        <li class="pl-2">Git inspired commit based workflow.</li>
        <li class="pl-2">
          Storage agnostic. Supports raw and encrypted JSON download/upload.
        </li>
      </ul>
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
</style>
