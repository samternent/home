<template>
  <!-- This example requires Tailwind CSS v2.0+ -->
  <div
    class="relative z-30"
    aria-labelledby="modal-title"
    role="dialog"
    aria-modal="true"
  >
    <div
      class="fixed inset-0 bg-[#2d2d2d] bg-opacity-75 transition-opacity"
    ></div>

    <div class="fixed inset-0 z-10 overflow-y-auto">
      <div
        class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0"
      >
        <div
          class="relative transform rounded-lg bg-[#1a1a1a] text-left shadow-xl transition-all p-2 sm:my-8 w-full sm:max-w-xl"
        >
          <button
            @click="$emit('close')"
            type="button"
            aria-label="Close modal"
            class="mt-3 absolute right-0 -top-12 bg-[#1a1a1a] sm:top-0 inline-flex w-full justify-center rounded-md px-4 py-2 text-base font-medium text-gray-200 hover:bg-[#2d2d2d] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
          >
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
                d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>
          <div class="bg-[#1a1a1a] px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <slot />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
