<script setup>
import { SBrandHeader } from "ternent-ui/components";
import { useWhiteLabel } from "@/module/brand/useWhiteLabel";

const whiteLabel = useWhiteLabel();
</script>
<template>
  <div class="flex flex-col h-full flex-1 p-4">
    <SBrandHeader
      >{{ whiteLabel.name[0]
      }}<span class="font-light">{{ whiteLabel.name[1] }}</span
      >{{ whiteLabel.name[2] }}</SBrandHeader
    >
    <p class="text-xl font-light px-1">
      {{ whiteLabel.description }}
    </p>
  </div>
</template>
