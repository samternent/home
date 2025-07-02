<script setup>
import { SButton } from "ternent-ui/components";
import { useRouter } from "vue-router";

const router = useRouter();

function startResistance() {
  router.push("/app");
}
</script>

<template>
  <div class="h-screen bg-base-100 overflow-hidden">
    <!-- Hero Section -->
    <div
      class="h-full w-full bg-gradient-to-br from-base-100 via-base-200 to-base-300 flex items-center justify-center relative"
    >
      <!-- Background Pattern -->
      <div class="absolute inset-0 opacity-5">
        <div
          class="absolute inset-0"
          style="
            background-image: radial-gradient(
              circle at 1px 1px,
              rgba(255, 255, 255, 0.15) 1px,
              transparent 0
            );
            background-size: 20px 20px;
          "
        ></div>
      </div>

      <!-- Content -->
      <div class="relative z-10 text-center space-y-6 px-6 max-w-4xl mx-auto">
        <!-- Rebellion Badge -->
        <div
          class="inline-flex items-center gap-2 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-3 py-1 rounded-full text-sm font-medium"
        >
          <span class="text-lg">🔥</span>
          <span>Encrypted Rebellion Against Corporate Surveillance</span>
        </div>

        <!-- Main Headline -->
        <h1 class="text-4xl md:text-6xl font-thin tracking-tighter">
          <span class="text-base-content">ternent</span>
          <span class="text-primary">.dev</span>
        </h1>

        <!-- Revolutionary Value Proposition -->
        <p
          class="text-lg md:text-xl text-base-content/80 max-w-2xl mx-auto leading-relaxed"
        >
          <span class="text-primary font-bold">Your data, your rules.</span>
          Organize without fear. Collaborate dangerously.
        </p>

        <p class="text-base text-base-content/70 max-w-xl mx-auto">
          100% free, open-source decentralized collaboration platform built for
          rebels, activists, and anyone who refuses to surrender their digital
          sovereignty.
        </p>

        <!-- Resistance Features -->
        <div class="grid md:grid-cols-3 gap-4 mt-8 mb-8 max-w-3xl mx-auto">
          <div class="text-center space-y-2">
            <div
              class="w-14 h-14 bg-red-100 dark:bg-red-900/20 rounded-xl mx-auto flex items-center justify-center"
            >
              <span class="text-2xl">🔒</span>
            </div>
            <h3 class="font-bold text-sm">Cryptographically Secure</h3>
            <p class="text-xs text-base-content/70">
              Every action signed and verifiable - impossible to forge
            </p>
          </div>
          <div class="text-center space-y-2">
            <div
              class="w-14 h-14 bg-blue-100 dark:bg-blue-900/20 rounded-xl mx-auto flex items-center justify-center"
            >
              <span class="text-2xl">🌐</span>
            </div>
            <h3 class="font-bold text-sm">Works Offline</h3>
            <p class="text-xs text-base-content/70">
              Organize anywhere - basements, protests, air-gapped environments
            </p>
          </div>
          <div class="text-center space-y-2">
            <div
              class="w-14 h-14 bg-green-100 dark:bg-green-900/20 rounded-xl mx-auto flex items-center justify-center"
            >
              <span class="text-2xl">🔥</span>
            </div>
            <h3 class="font-bold text-sm">No Surveillance</h3>
            <p class="text-xs text-base-content/70">
              No servers to raid, no data to steal, no corporate overlords
            </p>
          </div>
        </div>

        <!-- Revolutionary CTA -->
        <div class="space-y-4">
          <SButton
            size="lg"
            class="btn-primary w-auto px-8 py-3 text-base font-semibold bg-red-600 hover:bg-red-700 border-red-600 hover:border-red-700"
            @click="startResistance"
          >
            🚀 Start Your First Resistance Room
          </SButton>
          <p class="text-xs text-base-content/60">
            No signup required • Works completely offline • Free forever
          </p>
        </div>

        <!-- Revolutionary Actions -->
        <div class="flex justify-center gap-4 pt-4">
          <button
            @click="$router.push('/app')"
            class="text-sm text-base-content/70 hover:text-primary transition-colors"
          >
            Launch Platform
          </button>
          <span class="text-base-content/30">•</span>
          <button
            @click="$router.push('/solid')"
            class="text-sm text-base-content/70 hover:text-primary transition-colors"
          >
            Connect Backup Storage
          </button>
        </div>

        <!-- Resistance Proof -->
        <div class="pt-8">
          <p class="text-xs text-base-content/50 mb-3">
            Built for digital sovereignty
          </p>
          <div class="flex justify-center items-center gap-6 opacity-60">
            <div
              class="w-20 h-8 bg-base-content/10 rounded flex items-center justify-center"
            >
              <span class="text-xs font-medium">OFFLINE</span>
            </div>
            <div
              class="w-20 h-8 bg-base-content/10 rounded flex items-center justify-center"
            >
              <span class="text-xs font-medium">ENCRYPTED</span>
            </div>
            <div
              class="w-20 h-8 bg-base-content/10 rounded flex items-center justify-center"
            >
              <span class="text-xs font-medium">OPEN</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
