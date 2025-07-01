<script setup>
import { useLocalStorage } from "@vueuse/core";
import { shallowRef, computed } from "vue";
import { useWhiteLabel } from "@/module/brand/useWhiteLabel";
import { SMenu } from "ternent-ui/components";
import ternentUIThemes from "ternent-ui/themes";
import { useBreadcrumbs } from "@/module/breadcrumbs/useBreadcrumbs";

const whiteLabel = useWhiteLabel();

const theme = useLocalStorage("app/theme");

const themes = computed(() => [
  // Featured Sleek Themes
  { name: "✨ Sleek Light", value: "sleekLight" },
  { name: "🌟 Sleek Dark", value: "sleekDark" },
  
  // Custom Themes
  { name: "Azure Bloom", value: "azureBloom" },
  { name: "Azure Bloom Dark", value: "azureBloomDark" },
  { name: "Corporate Professional", value: "corporateProfessional" },
  { name: "Corporate Professional Dark", value: "corporateDark" },
  { name: "Neon Blanc", value: "neonBlanc" },
  { name: "Neon Noir", value: "neonNoir" },
  { name: "Marshmallow", value: "marshmallowLight" },
  { name: "Marshmallow Dark", value: "marshmallowDark" },
  
  // DaisyUI Themes
  { name: "Light", value: "light" },
  { name: "Dark", value: "dark" },
  { name: "Cupcake", value: "cupcake" },
  { name: "Bumblebee", value: "bumblebee" },
  { name: "Emerald", value: "emerald" },
  { name: "Corporate", value: "corporate" },
  { name: "Synthwave", value: "synthwave" },
  { name: "Retro", value: "retro" },
  { name: "Cyberpunk", value: "cyberpunk" },
  { name: "Valentine", value: "valentine" },
  { name: "Halloween", value: "halloween" },
  { name: "Garden", value: "garden" },
  { name: "Forest", value: "forest" },
  { name: "Aqua", value: "aqua" },
  { name: "Lofi", value: "lofi" },
  { name: "Pastel", value: "pastel" },
  { name: "Fantasy", value: "fantasy" },
  { name: "Wireframe", value: "wireframe" },
  { name: "Black", value: "black" },
  { name: "Luxury", value: "luxury" },
  { name: "Dracula", value: "dracula" },
  { name: "CMYK", value: "cmyk" },
  { name: "Autumn", value: "autumn" },
  { name: "Business", value: "business" },
  { name: "Acid", value: "acid" },
  { name: "Lemonade", value: "lemonade" },
  { name: "Night", value: "night" },
  { name: "Coffee", value: "coffee" },
  { name: "Winter", value: "winter" },
  { name: "Dim", value: "dim" },
  { name: "Nord", value: "nord" },
  { name: "Sunset", value: "sunset" },
]);

const themeName = shallowRef(
  themes.value.find((t) => t.value === theme.value)?.name
);

useBreadcrumbs({
  path: "/app/settings",
  name: "Settings",
});

function setTheme({ name, value }) {
  themeName.value = name;
  theme.value = value;
}
</script>
<template>
  <div class="p-2 flex flex-col">
    <ul class="flex flex-col">
      <li class="flex gap-2">
        <span class="text-medium">Theme:</span>
        <SMenu
          v-model="themeName"
          @select="setTheme"
          :button-text="themeName"
          :items="themes"
        />
      </li>
    </ul>
  </div>
</template>
