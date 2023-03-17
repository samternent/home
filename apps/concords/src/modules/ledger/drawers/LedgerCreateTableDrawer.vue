<script setup lang="ts">
import { computed } from "vue";
import { LedgerCreateTable } from "@/modules/ledger";
const props = defineProps(["modelValue", "table"]);
const emit = defineEmits(["update:modelValue", "submit"]);

const show = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit("update:modelValue", value);
  },
});
</script>
<template>
  <transition name="slide">
    <div
      class="z-50 fixed top-14 right-0 h-screen left-16 md:left-auto md:w-[550px] px-2 bg-zinc-800 border-l border-zinc-600"
      v-if="show"
    >
      <div class="flex justify-end w-full p-2">
        <button @click="show = false">
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
      </div>
      <LedgerCreateTable :table="table" @submit="$emit('submit')" />
    </div>
  </transition>
</template>

<style scoped>
.slide-enter-active {
  animation: slide-in 0.3s;
}
.slide-leave-active {
  animation: slide-in 0.3s reverse;
}
@keyframes slide-in {
  0% {
    transform: translateX(100%);
  }
  100% {
    transform: translateX(0);
  }
}
</style>
