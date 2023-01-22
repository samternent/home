<template>
  <div
    class="w-full flex-1 mx-auto max-w-6xl px-8 flex justify-center flex-col animate"
  >
    <h1 class="text-6xl font-medium">Welcome 👋</h1>
    <div class="text-1xl my-4 text-white pt-4 font-light animate">
      <span class="font-medium text-5xl text-pink-500">concord: </span>
      <span class="text-5xl font-thin">noun.</span>
      <p class="text-white font-thin">
        <em>agreement or harmony between people or groups.</em>
      </p>
      <!-- <p class="mt-4 text-2xl">Concords is a A different kind of web app.</p> -->
      <!-- <div class="mt-12 mb-8 flex text-2xl items-center w-full">or</div> -->

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
    </div>
    <p class="mt-4 text-xl">
      <span class="text-2xl font-medium">Secure by design</span>, An
      <strong>anonymous</strong>
      ledger app, using ECDSA Identity & Age Encryption for protected document
      data files.
    </p>
    <div class="mt-12 mb-8 flex text-2xl items-center w-full">
      <RouterLink
        to="/onboarding/identity"
        class="px-4 py-2 text-lg bg-green-600 hover:bg-green-700 transition-all rounded-full flex items-center font-medium"
      >
        Get started
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
  </div>
</template>
