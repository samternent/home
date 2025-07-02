<script setup>
import { useBreadcrumbs } from "@/module/breadcrumbs/useBreadcrumbs";
import { SCard, SButton } from "ternent-ui/components";

useBreadcrumbs({
  path: "/tools",
  name: "Tools",
});

const tools = [
  {
    name: "Compression",
    description: "Gzip compression and decompression with detailed analytics",
    route: "/tools/gzip",
    icon: "📦",
    status: "Live",
    features: ["Real-time compression", "File & text support", "Size analysis"]
  },
  {
    name: "Encryption",
    description: "End-to-end encryption tools for secure data handling",
    route: "/tools/encryption", 
    icon: "🔐",
    status: "Live",
    features: ["AES encryption", "Key generation", "Secure messaging"]
  },
  {
    name: "Ledger System",
    description: "Decentralized ledger with real-time collaboration",
    route: "/ledger",
    icon: "📊",
    status: "Featured",
    features: ["Multi-user sync", "Audit trails", "Export capabilities"]
  }
];
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-base-100 via-base-200 to-base-300 p-6">
    <div class="max-w-6xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-12">
        <h1 class="text-4xl md:text-5xl font-bold mb-4">
          <span class="text-base-content">Developer</span>
          <span class="text-primary">Tools</span>
        </h1>
        <p class="text-lg text-base-content/70 max-w-2xl mx-auto">
          Browser-based tools for compression, encryption, and decentralized systems. 
          No installation required, privacy-focused.
        </p>
      </div>

      <!-- Tools Grid -->
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        <SCard 
          v-for="tool in tools" 
          :key="tool.name"
          class="group hover:scale-105 transition-all duration-300 cursor-pointer border-2 hover:border-primary/30 hover:shadow-xl"
          @click="$router.push(tool.route)"
        >
          <div class="p-6">
            <!-- Tool Header -->
            <div class="flex items-start justify-between mb-4">
              <div class="flex items-center gap-3">
                <div class="text-3xl">{{ tool.icon }}</div>
                <div>
                  <h3 class="text-xl font-semibold text-base-content group-hover:text-primary transition-colors">
                    {{ tool.name }}
                  </h3>
                  <div class="badge badge-sm" :class="{
                    'badge-primary': tool.status === 'Featured',
                    'badge-success': tool.status === 'Live',
                    'badge-warning': tool.status === 'Beta'
                  }">
                    {{ tool.status }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Description -->
            <p class="text-base-content/70 mb-4 leading-relaxed">
              {{ tool.description }}
            </p>

            <!-- Features -->
            <div class="space-y-2 mb-6">
              <h4 class="text-sm font-medium text-base-content/80">Key Features:</h4>
              <ul class="space-y-1">
                <li v-for="feature in tool.features" :key="feature" class="text-sm text-base-content/60 flex items-center gap-2">
                  <div class="w-1.5 h-1.5 bg-primary rounded-full"></div>
                  {{ feature }}
                </li>
              </ul>
            </div>

            <!-- CTA -->
            <SButton 
              class="w-full group-hover:bg-primary group-hover:text-primary-content transition-all"
              variant="outline"
            >
              Explore {{ tool.name }} →
            </SButton>
          </div>
        </SCard>
      </div>

      <!-- Additional Info -->
      <div class="bg-base-100 rounded-2xl p-8 border border-base-300 shadow-lg">
        <div class="text-center">
          <h2 class="text-2xl font-bold mb-4 text-base-content">Why These Tools?</h2>
          <div class="grid md:grid-cols-3 gap-8 mt-8">
            <div class="text-center">
              <div class="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-2xl mx-auto flex items-center justify-center mb-4">
                <span class="text-2xl">🔒</span>
              </div>
              <h3 class="font-semibold mb-2">Privacy First</h3>
              <p class="text-sm text-base-content/70">All processing happens in your browser. No data leaves your device.</p>
            </div>
            <div class="text-center">
              <div class="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-2xl mx-auto flex items-center justify-center mb-4">
                <span class="text-2xl">⚡</span>
              </div>
              <h3 class="font-semibold mb-2">Instant Access</h3>
              <p class="text-sm text-base-content/70">No downloads, installations, or account creation required.</p>
            </div>
            <div class="text-center">
              <div class="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-2xl mx-auto flex items-center justify-center mb-4">
                <span class="text-2xl">🌐</span>
              </div>
              <h3 class="font-semibold mb-2">Open Source</h3>
              <p class="text-sm text-base-content/70">Transparent, auditable, and built for the developer community.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
