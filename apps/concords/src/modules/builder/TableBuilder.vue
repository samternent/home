<script lang="ts" setup>
import { shallowRef, computed } from "vue";

import inputTypes from "@/utils/inputTypes";

defineProps({
  tableName: {
    type: String,
    required: true,
  },
});

const type = shallowRef<string>("");
const name = shallowRef<string>("");
</script>
<template>
  <div></div>
</template>
