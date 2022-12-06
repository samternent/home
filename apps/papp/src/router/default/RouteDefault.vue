<script setup lang="ts"></script>
<template>
  <div class="flex flex-col flex-1">
    <h1
      class="text-center mt-6 md:mt-16 text-5xl sm:text-6xl md:text-7xl font-thin"
    >
      concords<strong>SDK</strong>
    </h1>
    <h2
      class="text-center mt-16 sm:text-lg md:text-xl text-gray-600 font-light px-4 md:px-12"
    >
      A complete collection of browser based cryptography utilities, for
      building secrity conscious web apps.
    </h2>
    <ul class="flex flex-1 mx-4 my-4 flex-col items-center mt-16 gap-8 px-2">
      <li class="flex w-full sm:w-1/2 md:w-1/4">
        <RouterLink
          to="/ledger"
          class="text-2xl font-light w-full py-2 hover:rounded items-center flex justify-center border-b-2 border-orange-500 hover:bg-orange-500 hover:text-white transition-all"
          >Ledger</RouterLink
        >
      </li>
      <li class="flex w-full sm:w-1/2 md:w-1/4">
        <RouterLink
          to="/identity"
          class="text-2xl font-light w-full py-2 hover:rounded items-center flex justify-center border-b-2 border-blue-500 hover:bg-blue-500 hover:text-white transition-all"
          >Identity</RouterLink
        >
      </li>
      <li class="flex w-full sm:w-1/2 md:w-1/4">
        <RouterLink
          to="/encryption"
          class="text-2xl font-light w-full py-2 hover:rounded items-center flex justify-center border-b-2 border-pink-500 hover:bg-pink-500 hover:text-white transition-all"
          >Encryption</RouterLink
        >
      </li>
      <li class="flex w-full sm:w-1/2 md:w-1/4">
        <RouterLink
          to="/storage"
          class="text-2xl font-light w-full py-2 hover:rounded items-center flex justify-center border-b-2 border-purple-500 hover:bg-purple-500 hover:text-white transition-all"
          >Storage</RouterLink
        >
      </li>
    </ul>
  </div>
</template>
