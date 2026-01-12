<script setup lang="ts">
import { computedAsync } from "@vueuse/core";
import { getEntrySigningPayload } from "@ternent/concord-protocol";
import { verify, importPublicKeyFromPem } from "ternent-identity";

const props = defineProps({
  payload: {
    type: Object,
    required: true,
  },
  signature: {
    type: String,
    required: true,
  },
  author: {
    type: String,
    required: true,
  },
});

const isVerified = computedAsync(async () => {
  const author = await importPublicKeyFromPem(props.author);
  delete props.payload.signature;
  return verify(props.signature, getEntrySigningPayload(props.payload), author);
}, null);
</script>
<template>
  <svg
    v-if="isVerified"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke-width="1.5"
    stroke="currentColor"
    class="size-5"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
    />
  </svg>
  <svg
    v-else
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke-width="1.5"
    stroke="currentColor"
    class="size-5"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.25-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z"
    />
  </svg>
</template>
