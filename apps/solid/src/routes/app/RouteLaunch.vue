<script setup lang="ts">
import { useRouter } from "vue-router";
import { useAppApi } from "@/app/api";
import { Button, Card } from "ternent-ui/primitives";

const appApi = useAppApi();
const router = useRouter();

async function relaunchOnboarding(): Promise<void> {
  await appApi.identity.lock();
  await router.push("/");
}
</script>

<template>
  <section class="mx-auto w-full max-w-3xl p-6" data-test="launch-v2">
    <h1>ConcordOS Launch Page</h1>
  </section>
</template>
