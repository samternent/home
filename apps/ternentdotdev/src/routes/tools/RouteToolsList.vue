<script setup>
import { useBreadcrumbs } from "@/module/breadcrumbs/useBreadcrumbs";

useBreadcrumbs({
  path: "/tools",
  name: "Tools",
});

const tools = [
  {
    name: "GZIP Compression",
    description: "Compress and decompress files using GZIP",
    path: "/tools/gzip",
  },
  {
    name: "Encryption",
    description: "Encrypt and decrypt data securely",
    path: "/tools/encryption", 
  }
];
</script>

<template>
  <div class="min-h-screen bg-base-100">
    <div class="w-full px-6 py-16">
      <!-- Header -->
      <div class="text-center mb-16">
        <h1 class="text-4xl md:text-5xl font-semibold tracking-tight text-base-content mb-4">
          Development Tools
        </h1>
        <p class="text-lg text-base-content/70">
          Professional utilities designed to accelerate your development workflow
        </p>
      </div>
      
      <!-- Tools Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <router-link 
          v-for="tool in tools" 
          :key="tool.path"
          :to="tool.path"
          class="group relative bg-base-100 border border-base-300 rounded-2xl p-8 
                 hover:border-primary/20 hover:shadow-lg transition-all duration-200
                 hover:-translate-y-1"
        >
          <!-- Tool content -->
          <div class="space-y-4">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <h3 class="text-xl font-semibold text-base-content group-hover:text-primary 
                           transition-colors duration-200 mb-2">
                  {{ tool.name }}
                </h3>
                <p class="text-base-content/70 text-base leading-relaxed">
                  {{ tool.description }}
                </p>
              </div>
            </div>
            
            <!-- Arrow indicator -->
            <div class="flex items-center text-primary font-medium text-sm pt-2">
              <span class="mr-2">Learn more</span>
              <svg 
                class="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-200" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
              </svg>
            </div>
          </div>
          
          <!-- Subtle hover effect -->
          <div class="absolute inset-0 bg-primary/5 rounded-2xl opacity-0 group-hover:opacity-100 
                      transition-opacity duration-200 pointer-events-none"></div>
        </router-link>
      </div>
    </div>
  </div>
</template>
