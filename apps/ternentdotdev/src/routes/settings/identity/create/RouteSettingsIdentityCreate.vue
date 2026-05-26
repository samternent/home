<script setup lang="ts">
import { ref } from "vue";
import { SButton, SCard } from "ternent-ui/components";
import { useIdentityCreate } from "@/modules/identity";

const { create, isCreating, error } = useIdentityCreate();
const createdId = ref<string | null>(null);

const onCreate = async () => {
  const identity = await create();
  createdId.value = identity.id;
};
</script>

<template>
  <SCard class="space-y-4 p-5">
    <h3 class="m-0 text-lg">Create identity</h3>
    <p class="text-sm text-fg-muted">
      Generate a new identity keypair and store it locally in this browser profile.
    </p>

    <SButton type="primary" :loading="isCreating" @click="onCreate">
      {{ isCreating ? "Creating..." : "Create identity" }}
    </SButton>

    <p v-if="createdId" class="text-sm">
      Active identity: <strong>{{ createdId }}</strong>
    </p>

    <p v-if="error" class="text-sm text-danger">
      {{ error }}
    </p>
  </SCard>
</template>
