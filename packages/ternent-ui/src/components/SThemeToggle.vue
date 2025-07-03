<script setup>
import { computed } from "vue";

const props = defineProps({
  modelValue: {
    type: String,
    required: true,
  },
  size: {
    type: String,
    default: "md",
    validator: (value) => ["sm", "md", "lg"].includes(value),
  },
  showDropdown: {
    type: Boolean,
    default: false,
  }
});

const emit = defineEmits(["update:modelValue"]);

// All available DaisyUI themes + custom themes
const themes = [
  // Custom Themes (Featured)
  { name: "sleekLight", label: "✨ Sleek Light", category: "Custom", featured: true },
  { name: "sleekDark", label: "🌟 Sleek Dark", category: "Custom", featured: true },
  
  // Standard DaisyUI Themes
  { name: "light", label: "☀️ Light", category: "Light" },
  { name: "dark", label: "🌙 Dark", category: "Dark" },
  { name: "cupcake", label: "🧁 Cupcake", category: "Light" },
  { name: "bumblebee", label: "🐝 Bumblebee", category: "Light" },
  { name: "emerald", label: "💚 Emerald", category: "Light" },
  { name: "corporate", label: "🏢 Corporate", category: "Light" },
  { name: "synthwave", label: "🌆 Synthwave", category: "Dark" },
  { name: "retro", label: "📻 Retro", category: "Light" },
  { name: "cyberpunk", label: "🤖 Cyberpunk", category: "Dark" },
  { name: "valentine", label: "💖 Valentine", category: "Light" },
  { name: "halloween", label: "🎃 Halloween", category: "Dark" },
  { name: "garden", label: "🌿 Garden", category: "Light" },
  { name: "forest", label: "🌲 Forest", category: "Dark" },
  { name: "aqua", label: "🌊 Aqua", category: "Light" },
  { name: "lofi", label: "📼 Lo-Fi", category: "Light" },
  { name: "pastel", label: "🎨 Pastel", category: "Light" },
  { name: "fantasy", label: "🦄 Fantasy", category: "Light" },
  { name: "wireframe", label: "📐 Wireframe", category: "Light" },
  { name: "black", label: "⚫ Black", category: "Dark" },
  { name: "luxury", label: "💎 Luxury", category: "Dark" },
  { name: "dracula", label: "🧛 Dracula", category: "Dark" },
  { name: "cmyk", label: "🖨️ CMYK", category: "Light" },
  { name: "autumn", label: "🍂 Autumn", category: "Light" },
  { name: "business", label: "💼 Business", category: "Dark" },
  { name: "acid", label: "🔬 Acid", category: "Light" },
  { name: "lemonade", label: "🍋 Lemonade", category: "Light" },
  { name: "night", label: "🌃 Night", category: "Dark" },
  { name: "coffee", label: "☕ Coffee", category: "Dark" },
  { name: "winter", label: "❄️ Winter", category: "Light" },
  { name: "dim", label: "🔅 Dim", category: "Dark" },
  { name: "nord", label: "🏔️ Nord", category: "Light" },
  { name: "sunset", label: "🌅 Sunset", category: "Light" },
  
  // Custom ternent.dev themes
  { name: "azureBloom", label: "🌸 Azure Bloom", category: "Light" },
  { name: "azureBloomDark", label: "🌸 Azure Bloom Dark", category: "Dark" },
  { name: "corporateProfessional", label: "🏢 Corporate Pro", category: "Light" },
  { name: "corporateDark", label: "🏢 Corporate Dark", category: "Dark" },
  { name: "neonBlanc", label: "⚪ Neon Blanc", category: "Light" },
  { name: "neonNoir", label: "⚫ Neon Noir", category: "Dark" },
  { name: "marshmallowLight", label: "🤍 Marshmallow", category: "Light" },
  { name: "marshmallowDark", label: "🖤 Marshmallow Dark", category: "Dark" },
];

const currentTheme = computed(() => {
  const theme = themes.find(t => t.name === props.modelValue);
  return theme || themes[0];
});

const isDark = computed(() => currentTheme.value.category === 'Dark');

function updateTheme(themeName) {
  emit("update:modelValue", themeName);
}

function toggleDarkMode() {
  // Simple toggle between light and dark for backward compatibility
  emit("update:modelValue", isDark.value ? "light" : "dark");
}

const sizeClasses = computed(() => ({
  sm: { icon: "w-4 h-4", toggle: "toggle-sm" },
  md: { icon: "w-5 h-5", toggle: "" },
  lg: { icon: "w-6 h-6", toggle: "toggle-lg" },
}));

const lightThemes = computed(() => themes.filter(t => t.category === 'Light'));
const darkThemes = computed(() => themes.filter(t => t.category === 'Dark'));
const customThemes = computed(() => themes.filter(t => t.category === 'Custom'));
const featuredThemes = computed(() => themes.filter(t => t.featured));
</script>

<template>
  <!-- Full Theme Selector Dropdown -->
  <div v-if="showDropdown" class="dropdown dropdown-end">
    <div tabindex="0" role="button" class="btn btn-ghost gap-2">
      <span class="text-sm">{{ currentTheme.label }}</span>
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </div>
    <div tabindex="0" class="dropdown-content z-[1] p-2 shadow-2xl bg-base-100 rounded-box w-80 max-h-96 overflow-y-auto">
      <div class="grid grid-cols-1 gap-1">
        <!-- Featured/Custom Themes Section -->
        <div v-if="featuredThemes.length > 0" class="mb-2">
          <div class="text-xs font-semibold text-base-content/60 mb-2 px-2">✨ Featured Themes</div>
          <div class="grid grid-cols-1 gap-1">
            <button
              v-for="theme in featuredThemes"
              :key="theme.name"
              @click="updateTheme(theme.name)"
              class="btn btn-sm btn-ghost justify-start"
              :class="{ 'btn-active': props.modelValue === theme.name }"
            >
              <span class="text-xs">{{ theme.label }}</span>
            </button>
          </div>
          <div class="divider my-2"></div>
        </div>
        
        <!-- Light Themes Section -->
        <div class="mb-2">
          <div class="text-xs font-semibold text-base-content/60 mb-2 px-2">☀️ Light Themes</div>
          <div class="grid grid-cols-2 gap-1">
            <button
              v-for="theme in lightThemes"
              :key="theme.name"
              @click="updateTheme(theme.name)"
              class="btn btn-sm btn-ghost justify-start"
              :class="{ 'btn-active': props.modelValue === theme.name }"
            >
              <span class="text-xs">{{ theme.label }}</span>
            </button>
          </div>
        </div>
        
        <!-- Dark Themes Section -->
        <div>
          <div class="text-xs font-semibold text-base-content/60 mb-2 px-2">🌙 Dark Themes</div>
          <div class="grid grid-cols-2 gap-1">
            <button
              v-for="theme in darkThemes"
              :key="theme.name"
              @click="updateTheme(theme.name)"
              class="btn btn-sm btn-ghost justify-start"
              :class="{ 'btn-active': props.modelValue === theme.name }"
            >
              <span class="text-xs">{{ theme.label }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Simple Toggle (for backward compatibility) -->
  <label v-else class="flex cursor-pointer gap-3 items-center" aria-label="Toggle dark mode">
    <!-- Sun icon -->
    <svg
      v-if="size !== 'sm'"
      xmlns="http://www.w3.org/2000/svg"
      :class="[
        sizeClasses[size].icon,
        isDark ? 'text-base-content/50' : 'text-warning'
      ]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="12" cy="12" r="5" />
      <path
        d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"
      />
    </svg>
    
    <!-- Toggle switch -->
    <div class="relative">
      <input
        type="checkbox"
        @click="toggleDarkMode"
        :checked="isDark"
        aria-label="Toggle dark mode"
        class="sr-only"
      />
      <div
        :class="[
          'w-11 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out',
          isDark 
            ? 'bg-primary' 
            : 'bg-base-300'
        ]"
        @click="toggleDarkMode"
      >
        <div
          :class="[
            'w-4 h-4 bg-base-100 rounded-full shadow-md transform transition-transform duration-200 ease-in-out',
            isDark ? 'translate-x-5' : 'translate-x-0'
          ]"
        />
      </div>
    </div>
    
    <!-- Moon icon -->
    <svg
      v-if="size !== 'sm'"
      xmlns="http://www.w3.org/2000/svg"
      :class="[
        sizeClasses[size].icon,
        isDark ? 'text-primary' : 'text-base-content/50'
      ]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
    </svg>
  </label>
</template>
