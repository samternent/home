<script lang="ts" setup>
import { useRouter } from "vue-router";
import { useLocalStorage } from "@vueuse/core";

const router = useRouter();
const lastLeague = useLocalStorage("lastLeague", "PL");

router.push({ path: `/leagues/${!lastLeague.value ? "PL" : lastLeague.value}` });
</script>
<template>

</template>
