<script setup>
import { computed, shallowRef } from "vue";
import { useLocalStorage } from "@vueuse/core";
import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import { useAppShell } from "@/module/app-shell/useAppShell";
import { useWhiteLabel } from "@/module/brand/useWhiteLabel";
import { SButton, SAlert, SIndicator, SCard, SInput } from "ternent-ui/components";
import ternentUIThemes from "ternent-ui/themes";

hljs.registerLanguage("javascript", javascript);

const { appVersion } = useAppShell();
const whiteLabel = useWhiteLabel();

const host = window.location.host;
const version = window.__APP_VERSION__;

const theme = useLocalStorage("app/theme");
const themeName = shallowRef(theme.value);
const themeConfig = computed({
  get() {
    return theme.value;
  },
  set({ name }) {
    themeName.value = name;
    theme.value = name;
  },
});

const themes = computed(() =>
  Object.entries(ternentUIThemes).map(([name, theme]) => ({
    name,
    value: theme,
  }))
);
</script>
<template>
  <div class="min-h-screen bg-base-100">
    <!-- Hero section -->
    <div class="relative overflow-hidden">
      <!-- Subtle gradient background -->
      <div class="absolute inset-0 bg-gradient-to-br from-base-100 via-base-200 to-base-100"></div>
      
      <div class="relative max-w-4xl mx-auto px-6 py-24">
        <div class="text-center space-y-8">
          <!-- Company info -->
          <div class="space-y-2">
            <div class="text-xs font-mono text-base-content/60 tracking-widest uppercase">
              # {{ host }}
            </div>
            <h1 class="text-5xl md:text-6xl font-semibold tracking-tight text-base-content">
              Ternent Dot Dev
            </h1>
            <p class="text-lg text-base-content/70 max-w-2xl mx-auto leading-relaxed">
              Specialists in Frontend and Platform Engineering
            </p>
          </div>

          <!-- Location -->
          <div class="flex justify-center">
            <a
              href="https://www.google.com/maps/@52.4973492,-1.8636315,11z"
              target="_blank"
              class="inline-flex items-center gap-2 text-sm text-base-content/60 hover:text-primary 
                     transition-colors duration-200 group"
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
              </svg>
              Birmingham, UK
              <svg class="w-3 h-3 opacity-40 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
              </svg>
            </a>
          </div>

          <!-- Navigation -->
          <div class="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
            <router-link 
              to="/tools" 
              class="inline-flex items-center gap-2 bg-primary text-primary-content px-6 py-3 
                     rounded-full font-medium hover:scale-105 transition-transform duration-200
                     shadow-sm hover:shadow-md"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              Development Tools
            </router-link>
            
            <router-link 
              to="/app/profile" 
              class="inline-flex items-center gap-2 border border-base-300 text-base-content px-6 py-3 
                     rounded-full font-medium hover:border-base-400 hover:bg-base-200/50 
                     transition-all duration-200"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
              Identity Profile
            </router-link>
            
            <router-link 
              to="/solid" 
              class="inline-flex items-center gap-2 text-base-content/70 hover:text-base-content 
                     px-6 py-3 font-medium transition-colors duration-200"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/>
              </svg>
              Solid Pod
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
