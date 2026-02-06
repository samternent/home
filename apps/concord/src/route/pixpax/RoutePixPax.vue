<script setup lang="ts">
import { computed } from "vue";
import { useFavicon, useTitle } from "@vueuse/core";
import PixPaxLogoRaw from "../../module/stickerbook/PixPaxLogo.svg?raw";
import Concord from "../../module/concord/Concord.vue";
import RoutePixPaxMainLayout from "./RoutePixPaxMainLayout.vue";

useTitle("PixPax.");

function svgToDataUrl(svg: string) {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

// Example: map your token vars → real hex values
const COLOR_MAP: Record<string, string> = {
  "var(--ui-border)": "#141311",
  "var(--ui-bg)": "rgba(233, 230, 223, 0.12)",
  "var(--ui-accent)": "#fcd34d",
  "var(--ui-primary)": "#c4b5fd",
  "var(--ui-secondary)": "#5eead4",
};

const themedSvg = computed(() => {
  let svg = PixPaxLogoRaw;

  // Replace any occurrences of var(--token) with actual colors
  for (const [cssVar, hex] of Object.entries(COLOR_MAP)) {
    svg = svg.split(cssVar).join(hex);
  }

  // If your SVG uses `currentColor`, you can also hard-set a root color:
  // svg = svg.replace("<svg ", `<svg color="#F6C453" `);

  return svg;
});

useFavicon(computed(() => svgToDataUrl(themedSvg.value)));
</script>
<template>
  <ClientOnly>
    <Concord>
      <RoutePixPaxMainLayout>
        <RouterView />
      </RoutePixPaxMainLayout>
    </Concord>
  </ClientOnly>
</template>
