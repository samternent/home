<script setup>
import { SCard, SButton } from "ternent-ui/components";

const projects = [
  {
    name: "Football Social",
    description: "Real-time social platform for football fans with live match data and community features",
    route: "/portfolio/footballsocial",
    image: "⚽",
    status: "Beta",
    tech: ["Vue.js", "Node.js", "WebSockets"],
    features: ["Live scores", "Fan discussions", "Match predictions"]
  },
  {
    name: "Coffee Shop Demo",
    description: "Interactive coffee shop interface showcasing modern e-commerce patterns",
    route: "/portfolio/coffee-shop", 
    image: "☕",
    status: "Demo",
    tech: ["Vue.js", "Tailwind", "Animations"],
    features: ["Interactive UI", "Product catalog", "Modern design"]
  },
  {
    name: "Game Engine",
    description: "Browser-based game engine built with WebAssembly and modern web technologies",
    route: "/portfolio/game",
    image: "🎮",
    status: "WIP",
    tech: ["WebAssembly", "Rust", "Canvas"],
    features: ["Performance focused", "Cross-platform", "Open source"]
  }
];
</script>
<template>
  <div class="min-h-screen bg-gradient-to-br from-base-100 via-base-200 to-base-300 p-6">
    <div class="max-w-6xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-12">
        <h1 class="text-4xl md:text-5xl font-bold mb-4">
          <span class="text-base-content">Project</span>
          <span class="text-primary">Portfolio</span>
        </h1>
        <p class="text-lg text-base-content/70 max-w-2xl mx-auto">
          A collection of applications and demos showcasing modern web technologies, 
          from real-time social platforms to experimental game engines.
        </p>
      </div>

      <!-- Projects Grid -->
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        <SCard 
          v-for="project in projects" 
          :key="project.name"
          class="group hover:scale-105 transition-all duration-300 cursor-pointer border-2 hover:border-primary/30 hover:shadow-xl"
          @click="$router.push(project.route)"
        >
          <div class="p-6">
            <!-- Project Header -->
            <div class="flex items-start justify-between mb-4">
              <div class="flex items-center gap-3">
                <div class="text-3xl">{{ project.image }}</div>
                <div>
                  <h3 class="text-xl font-semibold text-base-content group-hover:text-primary transition-colors">
                    {{ project.name }}
                  </h3>
                  <div class="badge badge-sm" :class="{
                    'badge-success': project.status === 'Beta',
                    'badge-info': project.status === 'Demo',
                    'badge-warning': project.status === 'WIP'
                  }">
                    {{ project.status }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Description -->
            <p class="text-base-content/70 mb-4 leading-relaxed">
              {{ project.description }}
            </p>

            <!-- Tech Stack -->
            <div class="mb-4">
              <h4 class="text-sm font-medium text-base-content/80 mb-2">Tech Stack:</h4>
              <div class="flex flex-wrap gap-1">
                <span 
                  v-for="tech in project.tech" 
                  :key="tech"
                  class="badge badge-outline badge-sm"
                >
                  {{ tech }}
                </span>
              </div>
            </div>

            <!-- Features -->
            <div class="space-y-2 mb-6">
              <h4 class="text-sm font-medium text-base-content/80">Key Features:</h4>
              <ul class="space-y-1">
                <li v-for="feature in project.features" :key="feature" class="text-sm text-base-content/60 flex items-center gap-2">
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
              View {{ project.name }} →
            </SButton>
          </div>
        </SCard>
      </div>

      <!-- Additional Info -->
      <div class="bg-base-100 rounded-2xl p-8 border border-base-300 shadow-lg">
        <div class="text-center">
          <h2 class="text-2xl font-bold mb-4 text-base-content">Development Philosophy</h2>
          <div class="grid md:grid-cols-3 gap-8 mt-8">
            <div class="text-center">
              <div class="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-2xl mx-auto flex items-center justify-center mb-4">
                <span class="text-2xl">🚀</span>
              </div>
              <h3 class="font-semibold mb-2">Performance First</h3>
              <p class="text-sm text-base-content/70">Optimized for speed with modern web technologies and best practices.</p>
            </div>
            <div class="text-center">
              <div class="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-2xl mx-auto flex items-center justify-center mb-4">
                <span class="text-2xl">🎨</span>
              </div>
              <h3 class="font-semibold mb-2">User Experience</h3>
              <p class="text-sm text-base-content/70">Intuitive interfaces that prioritize accessibility and usability.</p>
            </div>
            <div class="text-center">
              <div class="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-2xl mx-auto flex items-center justify-center mb-4">
                <span class="text-2xl">🔄</span>
              </div>
              <h3 class="font-semibold mb-2">Continuous Innovation</h3>
              <p class="text-sm text-base-content/70">Experimenting with cutting-edge technologies and patterns.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
