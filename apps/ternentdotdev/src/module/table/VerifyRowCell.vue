<script setup>
import { shallowRef, toRefs, watchEffect } from "vue";
import { importPublicKeyFromPem, verifyJson } from "ternent-identity";

const props = defineProps({
  data: {
    type: Object,
    required: true,
  },
  signature: {
    type: String,
    required: true,
  },
  identity: {
    type: String,
    required: true,
  },
  collection: {
    type: String,
    required: true,
  },
  id: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Number,
    required: true,
  },
});

const isVerified = shallowRef(false);
const ready = shallowRef(false);
const { collection, id, timestamp, data, signature, identity } = toRefs(props);

watchEffect(async () => {
  const key = await importPublicKeyFromPem(identity?.value);

  isVerified.value = await verifyJson(
    signature?.value,
    {
      id: id.value,
      data: data.value?.encrypted
        ? {
            permission: data.value?.permission,
            encrypted: data.value?.encrypted,
          }
        : data.value,
      timestamp: timestamp.value,
      identity: identity.value,
      collection: collection.value,
    },
    key
  );
  ready.value = true;
});
</script>
<template>
  <svg
    v-if="isVerified"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke-width="1.5"
    stroke="currentColor"
    class="w-6 h-6 text-green-600"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
    />
  </svg>
  <svg
    v-else
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth="3"
    stroke="currentColor"
    class="w-6 h-6 text-red-600"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286zm0 13.036h.008v.008H12v-.008z"
    />
  </svg>
</template>
