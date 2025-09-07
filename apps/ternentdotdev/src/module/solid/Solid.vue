<script setup>
import { SButton } from "ternent-ui/components";
import { useSolid } from "./useSolid";

const { profile, webId, logout, hasSolidSession } = useSolid();
</script>
<template>
  <div class="flex flex-col items-center gap-6 p-6">
    <div class="text-center">
      <h2 class="text-2xl font-bold mb-2">✅ Connected to Solid Pod</h2>
      <p class="text-base-content/70">
        Your ledger can now sync with your personal data pod
      </p>
    </div>

    <div class="card bg-base-200 w-full max-w-md">
      <div class="card-body">
        <h3 class="card-title text-lg">Pod Information</h3>
        <div class="space-y-2 text-sm">
          <div>
            <span class="font-medium">WebID:</span>
            <div class="text-xs break-all">{{ webId }}</div>
          </div>
          <div v-if="profile?.fn">
            <span class="font-medium">Name:</span> {{ profile.fn }}
          </div>
        </div>
      </div>
    </div>

    <div class="flex gap-3">
      <SButton type="primary" @click="$router.push('/t/ledger')">
        Go to Ledger
      </SButton>
      <SButton type="ghost" @click="logout"> Disconnect </SButton>
    </div>
  </div>
</template>
