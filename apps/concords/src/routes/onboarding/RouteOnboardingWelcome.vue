<template>
  <div
    class="w-full flex-1 mx-auto max-w-6xl px-8 flex justify-center flex-col animate"
  >
    <h1 class="text-6xl font-medium mt-16">Welcome to Concords 👋</h1>
      <div class="mt-12 mb-8 flex text-2xl justify-start items-center w-full">
        <div class="text-1xl text-white pt-4 font-light animate my-8">
          <span class="font-medium text-5xl text-pink-500">concord: </span>
          <span class="text-5xl font-thin">noun.</span>
          <p class="text-white font-thin text-lg">
            <em>agreement or harmony between people or groups.</em>
          </p>
        </div>
      <RouterLink
        to="/welcome/identity"
        class="ml-16 px-4 py-2 text-lg bg-pink-600 hover:bg-pink-700 transition-all rounded-full flex items-center font-medium"
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
      </RouterLink>
    </div>
    <p class="mt-4 text-xl">
      Concords is an annonymous and secure web app.
      <p class="my-3">
        It leans on cryptographic principals to create an anonymous, secure, immutable, verifiable and replicable data document directly in the browser.
      </p>
      <ul class="text-lg my-8 py-4 rounded-xl bg-[#1a1a1a] px-6 w-3/4">
        <li class="pl-2">Granular permissions with Age encryption.</li>
        <li class="pl-2">Tamper-proof data structure.</li>
        <li class="pl-2">ECDSA signed transations.</li>
        <li class="pl-2">Works completely offline.</li>
        <li class="pl-2">Git inspired commit based workflow.</li>
        <li class="pl-2">
          Storage agnostic. Supports raw and encrypted JSON download/upload.
        </li>
      </ul>
    </p>
    <div class="mt-12 mb-8 flex text-2xl justify-end items-center w-full">
      <RouterLink
        to="/welcome/identity"
        class="px-4 py-2 text-lg bg-pink-600 hover:bg-pink-700 transition-all rounded-full flex items-center font-medium"
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
