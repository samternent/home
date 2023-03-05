<script setup lang="ts"></script>
<template>
  <div class="flex w-full flex-col lg:flex-row">
    <div
      class="lg:w-1/2 p-2 border-b-2 lg:border-b-0 lg:border-r-2 border-zinc-800"
    >
      <pre
        class="text-green-600 font-medium tracking-wider whitespace-pre-wrap"
      >
// concords.app is in development.

// it's a merkle-tree based tamper-proof ledger.
// with granular permissions using age encryption.
// and identity verification using ECDSA keys and WebCryptoAPI.
      </pre>
    </div>
    <div class="lg:w-1/2 p-2">
      <p class="my-4">
        We don't use cookies or track identifiable information.
      </p>
      <div class="font-medium flex items-center">
        <span class="text-lg font-sans mb-2"
          >concords<span class="text-indigo-600 font-6xl">•</span>app</span
        >
        <!-- <span class="font-light ml-6"
              >Storage Agnostic, Tamper-Proof & Encrypted Ledger.</span
            > -->
      </div>
      <a
        class="text-pink-500 underline hover:text-pink-600 text-sm"
        href="https://teamconcords.com/"
        target="_blank"
        >Team Concords Limited.</a
      >
    </div>
  </div>
</template>
